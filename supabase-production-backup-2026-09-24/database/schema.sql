-- ====================================================================
-- TAMIL NADU YOUTH LEGISLATIVE ASSEMBLY (TN ASSEMBLY)
-- PRODUCTION DDL SCHEMA CONSOLIDATION
-- Dump Date: 2026-09-24T11:01:36.975Z
-- Source Project Ref: svtjphzbuicnirynorlx
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ====================================================================
-- MIGRATION SOURCE: supabase_schema.sql
-- ====================================================================

-- ====================================================================
-- TAMIL NADU YOUTH LEGISLATIVE ASSEMBLY (TN ASSEMBLY) MANAGEMENT SYSTEM
-- PostgreSQL / Supabase DDL Migration Schema
-- ====================================================================

-- 1. Create Enums
CREATE TYPE bench_type AS ENUM ('Ruling', 'Opposition', 'Independent');
CREATE TYPE event_stage AS ENUM ('College Round', 'District Round', 'State Quarter Finals', 'State Semi Finals', 'Final Round');
CREATE TYPE event_status AS ENUM ('Draft', 'Pre-Event', 'Day 1 Live', 'Day 2 Live', 'Completed');
CREATE TYPE academic_year AS ENUM ('1st Year', '2nd Year', '3rd Year', '4th Year');

-- 2. College Events Table
CREATE TABLE college_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_name TEXT NOT NULL,
    event_stage event_stage NOT NULL DEFAULT 'College Round',
    status event_status NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Participant Access Code & Profile Table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL,
  access_code VARCHAR(10) UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  party TEXT CHECK (party IN ('Ruling', 'Opposition')),
  constituency TEXT,
  committee TEXT,
  committee_group_link TEXT,
  party_group_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Coordinators Table
CREATE TABLE coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    raw_temp_password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Political Parties Table
CREATE TABLE political_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bench bench_type NOT NULL DEFAULT 'Ruling',
    color TEXT DEFAULT '#2563eb',
    leader TEXT,
    manifesto TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Legislative Committees Table
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    topic TEXT NOT NULL,
    chairperson TEXT,
    max_capacity INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Learners (Participants) Table
CREATE TABLE learners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES college_events(id) ON DELETE CASCADE,
    access_code VARCHAR(10) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT DEFAULT 'General',
    academic_year academic_year DEFAULT '1st Year',
    constituency_number INT,
    constituency_name TEXT,
    party_id UUID REFERENCES political_parties(id) ON DELETE SET NULL,
    party_name TEXT,
    party_group_link TEXT,
    bench bench_type,
    role TEXT,
    committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
    committee_name TEXT,
    committee_group_link TEXT,
    school_name TEXT,
    day1_checked_in BOOLEAN DEFAULT FALSE,
    day2_checked_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Session Agenda Table
CREATE TABLE session_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
    day TEXT NOT NULL DEFAULT 'Day 1',
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    speaker_role TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance & quick access code authentication
CREATE INDEX idx_learners_access_code ON learners(access_code);
CREATE INDEX idx_learners_event_id ON learners(event_id);
CREATE INDEX idx_coordinators_email ON coordinators(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coordinators_email_lower ON coordinators (LOWER(email));
CREATE INDEX idx_parties_event_id ON political_parties(event_id);
CREATE INDEX idx_committees_event_id ON committees(event_id);

-- ====================================================================
-- ONE-TIME DATA CLEANUP & DEDUPLICATION MIGRATION (BUG 9)
-- Purge duplicate coordinators retaining the latest authoritative record
-- ====================================================================
-- DELETE FROM coordinators c1 USING coordinators c2
-- WHERE c1.created_at < c2.created_at AND LOWER(c1.email) = LOWER(c2.email);

-- 8. Jury Members Table
CREATE TABLE jury_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    designation TEXT NOT NULL,
    assigned_bench bench_type NOT NULL DEFAULT 'Ruling',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Volunteers Table
CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extra columns for college_events (slug, chief guests, social coverage, etc.)
ALTER TABLE college_events
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS chapter TEXT DEFAULT 'College Domain',
    ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'College Round',
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS dates TEXT,
    ADD COLUMN IF NOT EXISTS assigned_coordinator_email TEXT,
    ADD COLUMN IF NOT EXISTS assigned_coordinator_name TEXT,
    ADD COLUMN IF NOT EXISTS elections_count INT DEFAULT 2,
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS participant_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS chief_guests JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS social_coverage JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS treasury_whatsapp_link TEXT,
    ADD COLUMN IF NOT EXISTS opposition_whatsapp_link TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Extra columns for volunteers
ALTER TABLE volunteers
    ADD COLUMN IF NOT EXISTS access_code TEXT,
    ADD COLUMN IF NOT EXISTS station TEXT DEFAULT 'Floating',
    ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'Both days',
    ADD COLUMN IF NOT EXISTS is_yuva BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS has_arrived BOOLEAN DEFAULT FALSE;

-- Extra columns for jury_members
ALTER TABLE jury_members
    ADD COLUMN IF NOT EXISTS access_code TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Extra columns for political_parties
ALTER TABLE political_parties
    ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT;

-- Extra columns for learners
ALTER TABLE learners
    ADD COLUMN IF NOT EXISTS district TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Extra columns for coordinators
ALTER TABLE coordinators
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Extra indexes
CREATE INDEX IF NOT EXISTS idx_jury_event_id ON jury_members(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_event_id ON volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_events_coordinator_email ON college_events(assigned_coordinator_email);
CREATE INDEX IF NOT EXISTS idx_events_slug ON college_events(slug);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- Ensure anonymous and authenticated users have SELECT and ALL access
-- ====================================================================

-- Enable RLS on all operational tables
ALTER TABLE college_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE jury_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

-- Drop existing read policies if any to prevent conflicts
DROP POLICY IF EXISTS "Allow read access to all users" ON college_events;
DROP POLICY IF EXISTS "Allow read access to all users" ON coordinators;
DROP POLICY IF EXISTS "Allow read access to all users" ON political_parties;
DROP POLICY IF EXISTS "Allow read access to all users" ON committees;
DROP POLICY IF EXISTS "Allow read access to all users" ON learners;
DROP POLICY IF EXISTS "Allow read access to all users" ON session_agenda;
DROP POLICY IF EXISTS "Allow read access to all users" ON jury_members;
DROP POLICY IF EXISTS "Allow read access to all users" ON volunteers;

-- Universal Read Policies for anon and authenticated roles
CREATE POLICY "Allow read access to all users" ON public.college_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.coordinators FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.political_parties FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.committees FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.learners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.session_agenda FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.jury_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow read access to all users" ON public.volunteers FOR SELECT TO anon, authenticated USING (true);

-- Universal Write/ALL Policies for operational tables (Fix for Bug 10)
DROP POLICY IF EXISTS "Allow all operational access" ON college_events;
DROP POLICY IF EXISTS "Allow all operational access" ON coordinators;
DROP POLICY IF EXISTS "Allow all operational access" ON political_parties;
DROP POLICY IF EXISTS "Allow all operational access" ON committees;
DROP POLICY IF EXISTS "Allow all operational access" ON learners;
DROP POLICY IF EXISTS "Allow all operational access" ON session_agenda;
DROP POLICY IF EXISTS "Allow all operational access" ON jury_members;
DROP POLICY IF EXISTS "Allow all operational access" ON volunteers;

CREATE POLICY "Allow all operational access" ON public.college_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.coordinators FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.political_parties FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.committees FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.learners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.session_agenda FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.jury_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.volunteers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grant privileges to anon and authenticated roles
-- Deadlines Configuration
CREATE TABLE IF NOT EXISTS event_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL UNIQUE,
  questions_open_at TIMESTAMPTZ,
  questions_deadline_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submitted Questions
CREATE TABLE IF NOT EXISTS proceedings_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL,
  student_id UUID,
  student_name TEXT NOT NULL,
  bench TEXT CHECK (bench IN ('Ruling', 'Opposition')),
  constituency TEXT,
  ministry TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'Standard',
  status TEXT CHECK (status IN ('Submitted', 'Approved', 'Starred', 'Rejected')) DEFAULT 'Submitted',
  queue_order INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proceedings Motions
CREATE TABLE IF NOT EXISTS proceedings_motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  proposed_by TEXT NOT NULL,
  bench TEXT DEFAULT 'Ruling',
  committee_room TEXT DEFAULT 'General Assembly',
  content TEXT NOT NULL,
  status TEXT DEFAULT 'Submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE proceedings_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proceedings_motions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access event_deadlines" ON public.event_deadlines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write access event_deadlines" ON public.event_deadlines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access proceedings_questions" ON public.proceedings_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write access proceedings_questions" ON public.proceedings_questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access proceedings_motions" ON public.proceedings_motions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write access proceedings_motions" ON public.proceedings_motions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;

-- ====================================================================
-- PRIMARY KEY & UNIQUE CONSTRAINTS ENFORCEMENT (BUG 10 ROOT CAUSE FIX)
-- Fixes PostgreSQL Error 42P10 on upsert:
-- "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- ====================================================================

DO $$
DECLARE
    tbl text;
    tables_list text[] := ARRAY[
        'college_events',
        'coordinators',
        'political_parties',
        'committees',
        'learners',
        'session_agenda',
        'jury_members',
        'volunteers',
        'event_deadlines',
        'proceedings_questions',
        'proceedings_motions',
        'event_participants',
        'event_days',
        'day_activities',
        'event_day_attendance'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables_list
    LOOP
        -- Check if table exists in public schema
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- 1. Deduplicate rows by id if duplicates exist before enforcing primary key
            EXECUTE format('
                DELETE FROM public.%I a USING public.%I b 
                WHERE a.ctid < b.ctid AND a.id = b.id;
            ', tbl, tbl);

            -- 2. Ensure id column is NOT NULL
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET NOT NULL;', tbl);

            -- 3. Check if a PRIMARY KEY or UNIQUE constraint on id already exists
            IF NOT EXISTS (
                SELECT 1 
                FROM pg_constraint c
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
                WHERE c.conrelid = format('public.%I', tbl)::regclass
                  AND (c.contype = 'p' OR c.contype = 'u')
                  AND a.attname = 'id'
            ) THEN
                -- If table already has another column as primary key, add UNIQUE constraint, otherwise ADD PRIMARY KEY
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conrelid = format('public.%I', tbl)::regclass AND contype = 'p'
                ) THEN
                    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (id);', tbl, tbl || '_id_unique');
                ELSE
                    EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (id);', tbl);
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- STEP 2 VERIFICATION: INSPECT TABLE CONSTRAINTS (\d equivalent)
-- Run this query to confirm EVERY table has PRIMARY KEY or UNIQUE on 'id'
-- ====================================================================
/*
SELECT 
    c.table_name,
    c.column_name,
    tc.constraint_type,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
  AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
WHERE tc.constraint_schema = 'public'
  AND c.column_name = 'id'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY c.table_name;
*/

-- ====================================================================
-- STEP 3: PRE-LIVE DATABASE WIPE (CHOOSE OPTION A OR OPTION B)
-- Fully guarded with table existence checks so missing optional tables
-- will never trigger ERROR 42P01 (relation does not exist)
-- ====================================================================

-- --------------------------------------------------------------------
-- OPTION A: WIPE EVERYTHING TO 0 EVENTS (Super Admin creates fresh event)
-- --------------------------------------------------------------------
/*
DO $$
DECLARE
    tbl text;
    tables_to_wipe text[] := ARRAY[
        'event_deadlines',
        'proceedings_questions',
        'proceedings_motions',
        'session_agenda',
        'jury_members',
        'volunteers',
        'learners',
        'political_parties',
        'committees',
        'event_participants'
    ];
    seq RECORD;
BEGIN
    -- 1. Wipe all existing child tables dynamically (safe if table doesn't exist)
    FOREACH tbl IN ARRAY tables_to_wipe
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('DELETE FROM public.%I;', tbl);
        END IF;
    END LOOP;

    -- 2. Remove all coordinator accounts except the Super Admin
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coordinators') THEN
        DELETE FROM public.coordinators
        WHERE LOWER(email) NOT IN ('admin@tnassembly.gov.in');
    END IF;

    -- 3. Delete all event records (Clean 0 Events slate)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_events') THEN
        DELETE FROM public.college_events;
    END IF;

    -- 4. Reset all sequence counters to 1
    FOR seq IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH 1;', seq.sequence_name);
    END LOOP;
END $$;
*/

-- --------------------------------------------------------------------
-- OPTION B: KEEP 1 EVENT RECORD (Reset to 0 Delegates / 0 Parties / 0 Committees)
-- --------------------------------------------------------------------
/*
DO $$
DECLARE
    tbl text;
    tables_to_wipe text[] := ARRAY[
        'event_deadlines',
        'proceedings_questions',
        'proceedings_motions',
        'session_agenda',
        'jury_members',
        'volunteers',
        'learners',
        'political_parties',
        'committees',
        'event_participants'
    ];
    seq RECORD;
BEGIN
    -- 1. Wipe all existing child tables dynamically (safe if table doesn't exist)
    FOREACH tbl IN ARRAY tables_to_wipe
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('DELETE FROM public.%I;', tbl);
        END IF;
    END LOOP;

    -- 2. Remove all coordinator accounts except the Super Admin
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coordinators') THEN
        DELETE FROM public.coordinators
        WHERE LOWER(email) NOT IN ('admin@tnassembly.gov.in');
    END IF;

    -- 3. Keep exactly 1 primary event record and reset its counters to 0
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'college_events') THEN
        DELETE FROM public.college_events
        WHERE id NOT IN (
            SELECT id FROM public.college_events ORDER BY created_at ASC LIMIT 1
        );

        UPDATE public.college_events
        SET 
          registered_learners = 0,
          parties_count = 0,
          committees_count = 0,
          status = 'Upcoming',
          event_stage = 'Pre-Event Preparation';
    END IF;

    -- 4. Reset all sequence counters to 1
    FOR seq IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH 1;', seq.sequence_name);
    END LOOP;
END $$;
*/

-- ====================================================================
-- 10. DYNAMIC EVENT DAYS & ATTENDANCE SCHEMA
-- ====================================================================

-- 10a. Event Days Table
CREATE TABLE IF NOT EXISTS event_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES college_events(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    name TEXT NOT NULL,
    date TEXT,
    status TEXT NOT NULL DEFAULT 'Upcoming', -- 'Upcoming' | 'Active' | 'Completed'
    activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10b. Day Activities Table (Normalized relation)
CREATE TABLE IF NOT EXISTS day_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES college_events(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES event_days(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10c. Event Day Attendance Table
CREATE TABLE IF NOT EXISTS event_day_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES college_events(id) ON DELETE CASCADE,
    day_id UUID NOT NULL REFERENCES event_days(id) ON DELETE CASCADE,
    event_day_id UUID REFERENCES event_days(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES learners(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Present', -- 'Present' | 'Absent'
    marked_by TEXT,
    marked_by_role TEXT,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_event_day_student UNIQUE (event_id, day_id, student_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_event_days_event_id ON event_days(event_id);
CREATE INDEX IF NOT EXISTS idx_day_activities_day_id ON day_activities(day_id);
CREATE INDEX IF NOT EXISTS idx_event_day_att_event_day ON event_day_attendance(event_id, day_id);
CREATE INDEX IF NOT EXISTS idx_event_day_att_student ON event_day_attendance(student_id);

-- ====================================================================
-- 10d. EVENT DAYS UNIQUE CONSTRAINT (ONE UNIQUE DAY NUMBER PER EVENT)
-- ====================================================================

-- 1. Deduplicate any pre-existing duplicate day numbers per event keeping latest
DELETE FROM public.event_days a USING public.event_days b
WHERE a.ctid < b.ctid 
  AND a.event_id = b.event_id 
  AND a.day_number = b.day_number;

-- 2. Enforce unique constraint: (event_id, day_number)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_event_days_event_day'
    ) THEN
        ALTER TABLE public.event_days
        ADD CONSTRAINT uq_event_days_event_day UNIQUE (event_id, day_number);
    END IF;
END $$;

-- ====================================================================
-- 10e. RLS POLICIES FOR EVENT DAYS & ATTENDANCE
-- ====================================================================
ALTER TABLE public.event_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_day_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access event_days" ON public.event_days;
DROP POLICY IF EXISTS "Allow write access event_days" ON public.event_days;
CREATE POLICY "Allow read access event_days" ON public.event_days FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write access event_days" ON public.event_days FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access day_activities" ON public.day_activities;
DROP POLICY IF EXISTS "Allow write access day_activities" ON public.day_activities;
CREATE POLICY "Allow read access day_activities" ON public.day_activities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write access day_activities" ON public.day_activities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access event_day_attendance" ON public.event_day_attendance;
DROP POLICY IF EXISTS "Allow write access event_day_attendance" ON public.event_day_attendance;
CREATE POLICY "Allow read access event_day_attendance" ON public.event_day_attendance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow write access event_day_attendance" ON public.event_day_attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.event_days TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.day_activities TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.event_day_attendance TO anon, authenticated, postgres, service_role;

-- ====================================================================
-- 10f. TARGETED DEMO EVENT DAYS & ATTENDANCE CLEANUP MIGRATION
-- Purges only mock/demo days and mock attendance for demo event
-- PRESERVES: college_events, learners, political_parties, committees, coordinators, accounts
-- ====================================================================
DO $$
DECLARE
    demo_ev RECORD;
BEGIN
    FOR demo_ev IN (
        SELECT id FROM public.college_events 
        WHERE id = '200fdd74-4d21-44d5-9f63-9a07bf267824'
           OR LOWER(college_name) LIKE '%jkkncet%' 
           OR LOWER(slug) LIKE '%jkkncet%'
    ) LOOP
        -- Remove demo day attendance
        DELETE FROM public.event_day_attendance WHERE event_id = demo_ev.id;
        
        -- Remove demo day activities
        DELETE FROM public.day_activities WHERE event_id = demo_ev.id;
        
        -- Remove demo event days
        DELETE FROM public.event_days WHERE event_id = demo_ev.id;

        -- Reset fake attendance flags on learners for this demo event
        UPDATE public.learners
        SET day1_checked_in = false, day2_checked_in = false
        WHERE event_id = demo_ev.id;

        -- Restore original authoritative college name, coordinator email and slug
        UPDATE public.college_events
        SET college_name = 'JKKNCET TN ASSEMBLY 2026',
            assigned_coordinator_email = 'soundaraharigece2025@jkkn.ac.in',
            assigned_coordinator_name = 'Soundarahari',
            slug = 'jkkncet-tn-assembly-2026-tamil-nadu-2026',
            social_coverage = jsonb_set(
                jsonb_set(COALESCE(social_coverage, '{}'::jsonb), '{event_days}', '[]'::jsonb, true),
                '{day_attendance}', '[]'::jsonb, true
            )
        WHERE id = demo_ev.id;
    END LOOP;
END $$;



-- ====================================================================
-- MIGRATION SOURCE: supabase_attendance_migration.sql
-- ====================================================================

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


-- ====================================================================
-- MIGRATION SOURCE: supabase_event_isolation_migration.sql
-- ====================================================================

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


-- ====================================================================
-- MIGRATION SOURCE: supabase_login_records_migration.sql
-- ====================================================================

-- Migration: Create login_records table for TN Assembly Portal
-- Tracks every login attempt (students, volunteers, jury, coordinators)

CREATE TABLE IF NOT EXISTS public.login_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.college_events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    learner_id TEXT,
    volunteer_id TEXT,
    user_name TEXT DEFAULT 'User',
    role TEXT NOT NULL CHECK (role IN ('student', 'volunteer', 'jury', 'coordinator')),
    access_code TEXT NOT NULL,
    logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_type TEXT DEFAULT 'desktop',
    device_info TEXT DEFAULT '',
    ip_address TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if the table was created under an earlier revision
ALTER TABLE public.login_records ADD COLUMN IF NOT EXISTS logged_in_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.login_records ADD COLUMN IF NOT EXISTS login_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.login_records ADD COLUMN IF NOT EXISTS learner_id TEXT;
ALTER TABLE public.login_records ADD COLUMN IF NOT EXISTS volunteer_id TEXT;
ALTER TABLE public.login_records ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT 'User';
ALTER TABLE public.login_records ALTER COLUMN user_name DROP NOT NULL;

-- Indexes for lightning fast lookups & analytical queries
CREATE INDEX IF NOT EXISTS idx_login_records_event_id ON public.login_records(event_id);
CREATE INDEX IF NOT EXISTS idx_login_records_user_id ON public.login_records(user_id);
CREATE INDEX IF NOT EXISTS idx_login_records_learner_id ON public.login_records(learner_id);
CREATE INDEX IF NOT EXISTS idx_login_records_volunteer_id ON public.login_records(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_login_records_role ON public.login_records(role);
CREATE INDEX IF NOT EXISTS idx_login_records_access_code ON public.login_records(access_code);
CREATE INDEX IF NOT EXISTS idx_login_records_logged_in_at ON public.login_records(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_records_login_at ON public.login_records(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_records_created_at ON public.login_records(created_at DESC);

-- Enable RLS & set public/anon access policy for portal operations
ALTER TABLE public.login_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'login_records' AND policyname = 'Allow anonymous read access to login_records'
  ) THEN
    CREATE POLICY "Allow anonymous read access to login_records"
        ON public.login_records FOR SELECT
        TO anon, authenticated
        USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'login_records' AND policyname = 'Allow anonymous insert access to login_records'
  ) THEN
    CREATE POLICY "Allow anonymous insert access to login_records"
        ON public.login_records FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
  END IF;
END $$;

-- Universal Operational Grants
GRANT ALL ON public.login_records TO anon, authenticated, postgres, service_role;

-- Enable Realtime for login_records if publication exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'login_records'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.login_records;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;


-- ====================================================================
-- MIGRATION SOURCE: supabase_allocation_confirmation_migration.sql
-- ====================================================================

-- ====================================================================
-- SUPABASE MIGRATION: STUDENT ALLOCATION CONFIRMATION SYSTEM
-- Tracks explicit student confirmation of their allocated:
-- Party, Committee, Constituency Name, Constituency Number, and Bench.
-- Automatically detects subsequent allocation changes (NEEDS RE-CHECK).
-- ====================================================================

-- 1. Create dedicated allocation confirmation table
CREATE TABLE IF NOT EXISTS public.learner_allocation_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    allocation_hash TEXT NOT NULL,
    confirmed_party TEXT,
    confirmed_committee TEXT,
    confirmed_constituency_name TEXT,
    confirmed_constituency_number INT,
    confirmed_bench TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_learner_allocation_confirmations UNIQUE (event_id, learner_id)
);

-- 2. Indexes for instant lookup by event, learner, and check status
CREATE INDEX IF NOT EXISTS idx_alloc_conf_event_id ON public.learner_allocation_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_alloc_conf_learner_id ON public.learner_allocation_confirmations(learner_id);
CREATE INDEX IF NOT EXISTS idx_alloc_conf_checked_at ON public.learner_allocation_confirmations(checked_at DESC);

-- 3. Row Level Security & Access Policies
ALTER TABLE public.learner_allocation_confirmations ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Allow operational access on learner_allocation_confirmations" ON public.learner_allocation_confirmations;
DROP POLICY IF EXISTS "Allow select learner_allocation_confirmations" ON public.learner_allocation_confirmations;
DROP POLICY IF EXISTS "Allow insert learner_allocation_confirmations" ON public.learner_allocation_confirmations;
DROP POLICY IF EXISTS "Allow update learner_allocation_confirmations" ON public.learner_allocation_confirmations;

-- SELECT policy: Permit reading confirmations for delegates and staff
CREATE POLICY "Allow select learner_allocation_confirmations" 
    ON public.learner_allocation_confirmations 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- INSERT policy: Restrict inserts to valid learner records for the designated event
CREATE POLICY "Allow insert learner_allocation_confirmations" 
    ON public.learner_allocation_confirmations 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learners l
            WHERE l.id = learner_id AND l.event_id = event_id
        )
    );

-- UPDATE policy: Restrict updates to valid learner records for the designated event
CREATE POLICY "Allow update learner_allocation_confirmations" 
    ON public.learner_allocation_confirmations 
    FOR UPDATE TO anon, authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.learners l
            WHERE l.id = learner_id AND l.event_id = event_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learners l
            WHERE l.id = learner_id AND l.event_id = event_id
        )
    );

-- 4. Operational Grants for PostgREST Exposure
GRANT ALL ON public.learner_allocation_confirmations TO anon, authenticated, postgres, service_role;

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';


-- ====================================================================
-- MIGRATION SOURCE: supabase_speaking_floor_migration.sql
-- ====================================================================

-- ====================================================================
-- SUPABASE MIGRATION: ASSEMBLY SPEAKING FLOOR & ALLOCATION AUDIT SYSTEM
-- Implements:
-- 1. Persistent Speaking Requests (Hand-raises / Points of Order)
-- 2. Persistent Speaking Turns (Immutable Hansard turn history)
-- ====================================================================

-- 1. Table: speaking_requests
CREATE TABLE IF NOT EXISTS public.speaking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    session_name TEXT NOT NULL,
    learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    learner_name TEXT NOT NULL,
    constituency_number INT,
    bench TEXT,
    status TEXT NOT NULL CHECK (status IN ('WAITING', 'CALLED', 'SPOKEN', 'CANCELLED')) DEFAULT 'WAITING',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for speaking_requests
CREATE INDEX IF NOT EXISTS idx_spk_req_event_sess ON public.speaking_requests(event_id, session_id, status);
CREATE INDEX IF NOT EXISTS idx_spk_req_learner ON public.speaking_requests(learner_id);
CREATE INDEX IF NOT EXISTS idx_spk_req_requested_at ON public.speaking_requests(requested_at ASC);

-- 2. Table: speaking_turns
CREATE TABLE IF NOT EXISTS public.speaking_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    session_name TEXT NOT NULL,
    learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    learner_name TEXT NOT NULL,
    request_id UUID REFERENCES public.speaking_requests(id) ON DELETE SET NULL,
    sequence_number INT NOT NULL DEFAULT 1,
    called_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    called_by TEXT,
    status TEXT NOT NULL CHECK (status IN ('SPEAKING', 'SPOKEN', 'CANCELLED')) DEFAULT 'SPEAKING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for speaking_turns
CREATE INDEX IF NOT EXISTS idx_spk_turn_event_sess ON public.speaking_turns(event_id, session_id);
CREATE INDEX IF NOT EXISTS idx_spk_turn_learner ON public.speaking_turns(learner_id);
CREATE INDEX IF NOT EXISTS idx_spk_turn_called_at ON public.speaking_turns(called_at DESC);

-- 3. Row Level Security
ALTER TABLE public.speaking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaking_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select speaking_requests" ON public.speaking_requests;
DROP POLICY IF EXISTS "Allow insert speaking_requests" ON public.speaking_requests;
DROP POLICY IF EXISTS "Allow update speaking_requests" ON public.speaking_requests;

CREATE POLICY "Allow select speaking_requests"
    ON public.speaking_requests FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert speaking_requests"
    ON public.speaking_requests FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update speaking_requests"
    ON public.speaking_requests FOR UPDATE TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow select speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow insert speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow update speaking_turns" ON public.speaking_turns;

CREATE POLICY "Allow select speaking_turns"
    ON public.speaking_turns FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert speaking_turns"
    ON public.speaking_turns FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update speaking_turns"
    ON public.speaking_turns FOR UPDATE TO anon, authenticated
    USING (true);

-- 4. Permissions
GRANT ALL ON public.speaking_requests TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.speaking_turns TO anon, authenticated, postgres, service_role;


-- ====================================================================
-- MIGRATION SOURCE: supabase_schema_audit_fixes.sql
-- ====================================================================

-- ====================================================================
-- TN ASSEMBLY AUDIT FIXES MIGRATION
-- Generated: 2026-09-11
-- Resolves: BUG-005, BUG-006, BUG-008, BUG-009, BUG-012
-- ====================================================================

-- 1. BUG-005 & BUG-006: Add missing columns to learners table
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS school_name TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS party_group_link TEXT;
ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS committee_group_link TEXT;

-- 2. BUG-012: Drop duplicate redundant unique constraint from event_day_attendance
ALTER TABLE public.event_day_attendance DROP CONSTRAINT IF EXISTS unique_event_day_id_student;

-- 3. BUG-009: Dedicated tables for Team Members and Checklist Items

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    category TEXT DEFAULT 'Executive',
    phone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.college_events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    completed BOOLEAN DEFAULT FALSE,
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_event_id ON public.team_members(event_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_event_id ON public.checklist_items(event_id);
CREATE INDEX IF NOT EXISTS idx_session_agenda_event_current ON public.session_agenda(event_id, is_current);

-- Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow all operational access team_members'
  ) THEN
    CREATE POLICY "Allow all operational access team_members" ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'checklist_items' AND policyname = 'Allow all operational access checklist_items'
  ) THEN
    CREATE POLICY "Allow all operational access checklist_items" ON public.checklist_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Universal Operational Grants
GRANT ALL ON public.team_members TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.checklist_items TO anon, authenticated, postgres, service_role;

