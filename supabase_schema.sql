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

