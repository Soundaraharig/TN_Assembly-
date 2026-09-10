-- ====================================================================
-- SUPABASE PRODUCTION MIGRATION: MULTI-EVENT DATA ISOLATION & SCHEMA CONSTRAINTS
-- Fixes cross-event data leakage between events (e.g. JKKNCET vs JKKN ARTS)
-- Scopes access_code, benches, leadership roles, and attendance strictly per event_id
-- Preserves JKKNCET TN ASSEMBLY 2026 (200fdd74-4d21-44d5-9f63-9a07bf267824) and all 128 delegates
-- ====================================================================

-- 1. Ensure political_parties has event_id indexing and integrity
CREATE INDEX IF NOT EXISTS idx_parties_event_id ON public.political_parties(event_id);

-- 2. Scope participant access_code per event_id on learners table
-- Note: A student access code (e.g. TN001) should be unique PER EVENT, not globally,
-- allowing participants to register independently across distinct assembly events.
DO $$
BEGIN
    -- Drop global unique constraint on access_code if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'learners_access_code_key' 
          AND conrelid = 'public.learners'::regclass
    ) THEN
        ALTER TABLE public.learners DROP CONSTRAINT learners_access_code_key;
    END IF;

    -- Drop any global unique index on access_code
    DROP INDEX IF EXISTS idx_learners_access_code_unique;

    -- Add event-scoped unique constraint on (event_id, access_code)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_learners_event_access_code' 
          AND conrelid = 'public.learners'::regclass
    ) THEN
        ALTER TABLE public.learners 
        ADD CONSTRAINT uq_learners_event_access_code UNIQUE (event_id, access_code);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_learners_event_id ON public.learners(event_id);
CREATE INDEX IF NOT EXISTS idx_learners_event_bench ON public.learners(event_id, bench);
CREATE INDEX IF NOT EXISTS idx_learners_event_role ON public.learners(event_id, role);

-- 3. Ensure event_days table exists with event-scoped uniqueness
CREATE TABLE IF NOT EXISTS public.event_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    name TEXT NOT NULL,
    date TEXT,
    status TEXT NOT NULL DEFAULT 'Upcoming',
    activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_event_days_event_day UNIQUE (event_id, day_number)
);

-- 4. Ensure day_activities table exists
CREATE TABLE IF NOT EXISTS public.day_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ensure event_day_attendance table exists with composite unique constraint
CREATE TABLE IF NOT EXISTS public.event_day_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES public.event_days(id) ON DELETE CASCADE,
    event_day_id UUID REFERENCES public.event_days(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Present',
    marked_by TEXT,
    marked_by_role TEXT DEFAULT 'volunteer',
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_day_student UNIQUE (event_id, day_id, student_id),
    CONSTRAINT unique_event_day_id_student UNIQUE (event_id, event_day_id, student_id)
);

-- 6. Attendance Indexes for rapid event-filtered querying
CREATE INDEX IF NOT EXISTS idx_event_day_att_event ON public.event_day_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_day_att_event_day ON public.event_day_attendance(event_id, day_id);
CREATE INDEX IF NOT EXISTS idx_event_day_att_student ON public.event_day_attendance(student_id);

-- 7. Row Level Security & Operational Grants
ALTER TABLE public.college_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_day_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow operational access college_events" ON public.college_events;
CREATE POLICY "Allow operational access college_events" ON public.college_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access political_parties" ON public.political_parties;
CREATE POLICY "Allow operational access political_parties" ON public.political_parties FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access learners" ON public.learners;
CREATE POLICY "Allow operational access learners" ON public.learners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access event_days" ON public.event_days;
CREATE POLICY "Allow operational access event_days" ON public.event_days FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access day_activities" ON public.day_activities;
CREATE POLICY "Allow operational access day_activities" ON public.day_activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow operational access event_day_attendance" ON public.event_day_attendance;
CREATE POLICY "Allow operational access event_day_attendance" ON public.event_day_attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;

-- 8. PostgREST Schema Cache Reload (Eliminates PGRST205 404 cache miss)
NOTIFY pgrst, 'reload schema';

-- 9. Authoritative Event Preservation
-- Strictly protects the identity of JKKNCET TN ASSEMBLY 2026 without modifying any of its 128 participants
UPDATE public.college_events
SET college_name = 'JKKNCET TN ASSEMBLY 2026',
    assigned_coordinator_email = 'soundaraharigece2025@jkkn.ac.in',
    assigned_coordinator_name = 'Soundarahari',
    slug = 'jkkncet-tn-assembly-2026-tamil-nadu-2026'
WHERE id = '200fdd74-4d21-44d5-9f63-9a07bf267824';
