-- ====================================================================
-- TARGETED SUPABASE PRODUCTION MIGRATION:
-- Event Days, Day Activities & Event Day Attendance
-- Fixes PGRST205 404 (table not in schema cache)
-- Restores JKKNCET TN ASSEMBLY 2026 Identity & Preserves All 128 Participants
-- ====================================================================

-- 1. Create event_days table
CREATE TABLE IF NOT EXISTS public.event_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    name TEXT NOT NULL,
    date TEXT,
    status TEXT NOT NULL DEFAULT 'Upcoming', -- 'Upcoming' | 'Active' | 'Completed'
    activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_event_days_event_day UNIQUE (event_id, day_number)
);

-- 2. Create day_activities table
CREATE TABLE IF NOT EXISTS public.day_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create event_day_attendance table
CREATE TABLE IF NOT EXISTS public.event_day_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
    event_day_id UUID REFERENCES public.event_days(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Present', -- 'Present' | 'Absent'
    marked_by TEXT,
    marked_by_role TEXT DEFAULT 'volunteer',
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_day_student UNIQUE (event_id, day_id, student_id),
    CONSTRAINT unique_event_day_id_student UNIQUE (event_id, event_day_id, student_id)
);

-- 4. Indexes for rapid attendance querying
CREATE INDEX IF NOT EXISTS idx_event_days_event_id ON public.event_days(event_id);
CREATE INDEX IF NOT EXISTS idx_day_activities_day_id ON public.day_activities(day_id);
CREATE INDEX IF NOT EXISTS idx_event_day_att_event_day ON public.event_day_attendance(event_id, day_id);
CREATE INDEX IF NOT EXISTS idx_event_day_att_student ON public.event_day_attendance(student_id);

-- 5. Row Level Security & Operational Grants
ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_day_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow operational access event_days" ON public.event_days;
CREATE POLICY "Allow operational access event_days" ON public.event_days FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access day_activities" ON public.day_activities;
CREATE POLICY "Allow operational access day_activities" ON public.day_activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access event_day_attendance" ON public.event_day_attendance;
CREATE POLICY "Allow operational access event_day_attendance" ON public.event_day_attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.event_days TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.day_activities TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.event_day_attendance TO anon, authenticated, postgres, service_role;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- 7. Restore authoritative event identity & start fresh with 0 days
DO $$
DECLARE
    target_id UUID := '200fdd74-4d21-44d5-9f63-9a07bf267824';
BEGIN
    -- Remove any mock days or test attendance records for this event
    DELETE FROM public.event_day_attendance WHERE event_id = target_id;
    DELETE FROM public.day_activities WHERE event_id = target_id;
    DELETE FROM public.event_days WHERE event_id = target_id;

    -- Reset test check-in flags on learners
    UPDATE public.learners
    SET day1_checked_in = false, day2_checked_in = false
    WHERE event_id = target_id;

    -- Restore event identity, coordinator email, and clear social_coverage days
    UPDATE public.college_events
    SET college_name = 'JKKNCET TN ASSEMBLY 2026',
        assigned_coordinator_email = 'soundaraharigece2025@jkkn.ac.in',
        assigned_coordinator_name = 'Soundarahari',
        slug = 'jkkncet-tn-assembly-2026-tamil-nadu-2026',
        social_coverage = jsonb_set(
            jsonb_set(COALESCE(social_coverage, '{}'::jsonb), '{event_days}', '[]'::jsonb, true),
            '{day_attendance}', '[]'::jsonb, true
        )
    WHERE id = target_id;
END $$;
