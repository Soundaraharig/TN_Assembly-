-- ============================================================================
-- DATABASE DISK I/O OPTIMIZATION: STOP EXCESSIVE social_coverage WRITES
-- 
-- Root Cause Identified:
-- 1. Repeated UPDATE statements on public.college_events.social_coverage where
--    social_coverage was identical or only non-functional timestamp updated_at changed.
-- 2. Client-side redundant writes from timer ticks, projector studio, and agenda progress.
--
-- This migration installs a PostgreSQL BEFORE UPDATE trigger on public.college_events
-- that checks if NEW.social_coverage IS NOT DISTINCT FROM OLD.social_coverage.
-- When social_coverage and other meaningful event columns are identical, the trigger
-- returns NULL, preventing write amplification, WAL generation, and HOT tuple updates!
-- ============================================================================

CREATE OR REPLACE FUNCTION public.suppress_redundant_college_events_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If social_coverage is unchanged AND all other functional columns are unchanged,
  -- suppress the update entirely (even if updated_at is different).
  IF NEW.social_coverage IS NOT DISTINCT FROM OLD.social_coverage
     AND NEW.college_name IS NOT DISTINCT FROM OLD.college_name
     AND NEW.event_stage IS NOT DISTINCT FROM OLD.event_stage
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.slug IS NOT DISTINCT FROM OLD.slug
     AND NEW.chapter IS NOT DISTINCT FROM OLD.chapter
     AND NEW.level IS NOT DISTINCT FROM OLD.level
     AND NEW.location IS NOT DISTINCT FROM OLD.location
     AND NEW.dates IS NOT DISTINCT FROM OLD.dates
     AND NEW.elections_count IS NOT DISTINCT FROM OLD.elections_count
     AND NEW.participant_count IS NOT DISTINCT FROM OLD.participant_count
     AND NEW.chief_guests IS NOT DISTINCT FROM OLD.chief_guests
     AND NEW.assigned_coordinator_name IS NOT DISTINCT FROM OLD.assigned_coordinator_name
     AND NEW.assigned_coordinator_email IS NOT DISTINCT FROM OLD.assigned_coordinator_email
     AND NEW.is_locked IS NOT DISTINCT FROM OLD.is_locked
     AND NEW.treasury_whatsapp_link IS NOT DISTINCT FROM OLD.treasury_whatsapp_link
     AND NEW.opposition_whatsapp_link IS NOT DISTINCT FROM OLD.opposition_whatsapp_link
  THEN
    -- Returning NULL in a BEFORE UPDATE trigger silently cancels the UPDATE.
    -- Zero disk I/O, zero WAL writes, zero HOT updates.
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_suppress_redundant_college_events_update ON public.college_events;

CREATE TRIGGER trg_suppress_redundant_college_events_update
BEFORE UPDATE ON public.college_events
FOR EACH ROW
EXECUTE FUNCTION public.suppress_redundant_college_events_update();
