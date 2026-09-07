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
    bench bench_type,
    role TEXT,
    committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
    committee_name TEXT,
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
        'event_participants'
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





