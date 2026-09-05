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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Political Parties Table
CREATE TABLE political_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
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
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    topic TEXT NOT NULL,
    chairperson TEXT,
    max_capacity INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Learners (Participants) Table
CREATE TABLE learners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
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
CREATE INDEX idx_parties_event_id ON political_parties(event_id);
CREATE INDEX idx_committees_event_id ON committees(event_id);

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

-- Extra columns for college_events (chief guests & social coverage as JSONB)
ALTER TABLE college_events
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
    ADD COLUMN IF NOT EXISTS social_coverage JSONB DEFAULT '{}'::jsonb;

-- Extra indexes
CREATE INDEX idx_jury_event_id ON jury_members(event_id);
CREATE INDEX idx_volunteers_event_id ON volunteers(event_id);
CREATE INDEX idx_events_coordinator_email ON college_events(assigned_coordinator_email);

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

-- Drop existing policies if any to prevent conflicts
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

-- Universal Write/ALL Policies for operational tables
DROP POLICY IF EXISTS "Allow all operational access" ON learners;
DROP POLICY IF EXISTS "Allow all operational access" ON volunteers;
DROP POLICY IF EXISTS "Allow all operational access" ON college_events;

CREATE POLICY "Allow all operational access" ON public.learners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.volunteers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operational access" ON public.college_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

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



