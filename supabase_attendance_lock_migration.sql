-- ====================================================================
-- SUPABASE PRODUCTION MIGRATION:
-- Independent FN & AN Attendance Locks Protection
-- Enforces write-level rejection on public.event_day_attendance
-- ====================================================================

-- 1. Ensure optional session lock columns exist on event_days (zero-cost, non-breaking)
ALTER TABLE IF EXISTS public.event_days
  ADD COLUMN IF NOT EXISTS fn_attendance_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS an_attendance_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Ensure optional session status columns exist on event_day_attendance (preserves existing data)
ALTER TABLE IF EXISTS public.event_day_attendance
  ADD COLUMN IF NOT EXISTS fn_status TEXT,
  ADD COLUMN IF NOT EXISTS an_status TEXT;

-- 3. Database Trigger Function to enforce FN & AN write locks atomically
CREATE OR REPLACE FUNCTION public.check_attendance_session_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_social_coverage JSONB;
  v_fn_locked BOOLEAN := FALSE;
  v_an_locked BOOLEAN := FALSE;
  v_day_fn_locked BOOLEAN;
  v_day_an_locked BOOLEAN;
  
  v_new_fn TEXT := 'Absent';
  v_new_an TEXT := 'Absent';
  v_old_fn TEXT := 'Absent';
  v_old_an TEXT := 'Absent';
  v_fn_match TEXT[];
  v_an_match TEXT[];
BEGIN
  -- A. Fetch lock configuration from event_days or college_events
  IF NEW.day_id IS NOT NULL THEN
    SELECT fn_attendance_locked, an_attendance_locked
    INTO v_day_fn_locked, v_day_an_locked
    FROM public.event_days
    WHERE id = NEW.day_id;

    IF v_day_fn_locked IS TRUE THEN
      v_fn_locked := TRUE;
    END IF;
    IF v_day_an_locked IS TRUE THEN
      v_an_locked := TRUE;
    END IF;
  END IF;

  -- Fallback / Primary check from college_events.social_coverage
  IF (v_fn_locked IS FALSE OR v_an_locked IS FALSE) AND NEW.event_id IS NOT NULL THEN
    SELECT social_coverage INTO v_social_coverage
    FROM public.college_events
    WHERE id = NEW.event_id;

    IF v_social_coverage IS NOT NULL THEN
      -- Check per-day lock state if day_id exists
      IF NEW.day_id IS NOT NULL AND (v_social_coverage->'attendance_locks'->'by_day'->(NEW.day_id::text)) IS NOT NULL THEN
        IF (v_social_coverage->'attendance_locks'->'by_day'->(NEW.day_id::text)->>'fn_locked')::boolean IS TRUE THEN
          v_fn_locked := TRUE;
        END IF;
        IF (v_social_coverage->'attendance_locks'->'by_day'->(NEW.day_id::text)->>'an_locked')::boolean IS TRUE THEN
          v_an_locked := TRUE;
        END IF;
      END IF;

      -- Check top-level event attendance lock flags
      IF (v_social_coverage->>'fn_attendance_locked')::boolean IS TRUE OR
         (v_social_coverage->'attendance_locks'->>'fn_locked')::boolean IS TRUE THEN
        v_fn_locked := TRUE;
      END IF;

      IF (v_social_coverage->>'an_attendance_locked')::boolean IS TRUE OR
         (v_social_coverage->'attendance_locks'->>'an_locked')::boolean IS TRUE THEN
        v_an_locked := TRUE;
      END IF;
    END IF;
  END IF;

  -- If neither FN nor AN is locked, allow operation immediately
  IF v_fn_locked IS NOT TRUE AND v_an_locked IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- B. Determine target NEW session statuses
  IF NEW.fn_status IS NOT NULL THEN
    v_new_fn := NEW.fn_status;
  ELSIF NEW.marked_by IS NOT NULL AND NEW.marked_by ~ '\[FN:(Present|Absent)' THEN
    v_new_fn := substring(NEW.marked_by from '\[FN:(Present|Absent)');
  ELSE
    v_new_fn := COALESCE(NEW.status, 'Absent');
  END IF;

  IF NEW.an_status IS NOT NULL THEN
    v_new_an := NEW.an_status;
  ELSIF NEW.marked_by IS NOT NULL AND NEW.marked_by ~ 'AN:(Present|Absent)\]' THEN
    v_new_an := substring(NEW.marked_by from 'AN:(Present|Absent)\]');
  ELSE
    v_new_an := COALESCE(NEW.status, 'Absent');
  END IF;

  -- C. Determine target OLD session statuses (if updating)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.fn_status IS NOT NULL THEN
      v_old_fn := OLD.fn_status;
    ELSIF OLD.marked_by IS NOT NULL AND OLD.marked_by ~ '\[FN:(Present|Absent)' THEN
      v_old_fn := substring(OLD.marked_by from '\[FN:(Present|Absent)');
    ELSE
      v_old_fn := COALESCE(OLD.status, 'Absent');
    END IF;

    IF OLD.an_status IS NOT NULL THEN
      v_old_an := OLD.an_status;
    ELSIF OLD.marked_by IS NOT NULL AND OLD.marked_by ~ 'AN:(Present|Absent)\]' THEN
      v_old_an := substring(OLD.marked_by from 'AN:(Present|Absent)\]');
    ELSE
      v_old_an := COALESCE(OLD.status, 'Absent');
    END IF;
  END IF;

  -- D. Enforce FN Lock
  IF v_fn_locked IS TRUE THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'FN attendance is locked by admin.';
    ELSIF TG_OP = 'UPDATE' AND (v_new_fn IS DISTINCT FROM v_old_fn) THEN
      RAISE EXCEPTION 'FN attendance is locked by admin.';
    END IF;
  END IF;

  -- E. Enforce AN Lock
  IF v_an_locked IS TRUE THEN
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'AN attendance is locked by admin.';
    ELSIF TG_OP = 'UPDATE' AND (v_new_an IS DISTINCT FROM v_old_an) THEN
      RAISE EXCEPTION 'AN attendance is locked by admin.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Attach Trigger to public.event_day_attendance
DROP TRIGGER IF EXISTS trg_check_attendance_session_lock ON public.event_day_attendance;
CREATE TRIGGER trg_check_attendance_session_lock
  BEFORE INSERT OR UPDATE ON public.event_day_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.check_attendance_session_lock();

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
