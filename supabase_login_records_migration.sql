-- Migration: Create login_records table for TN Assembly Portal
-- Tracks every login attempt (students, volunteers, jury, coordinators)

CREATE TABLE IF NOT EXISTS login_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES college_events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'volunteer', 'jury', 'coordinator')),
    access_code TEXT NOT NULL,
    login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_type TEXT DEFAULT 'Other',
    device_info TEXT DEFAULT '',
    ip_address TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast lookups & analytical queries
CREATE INDEX IF NOT EXISTS idx_login_records_event_id ON login_records(event_id);
CREATE INDEX IF NOT EXISTS idx_login_records_user_id ON login_records(user_id);
CREATE INDEX IF NOT EXISTS idx_login_records_role ON login_records(role);
CREATE INDEX IF NOT EXISTS idx_login_records_access_code ON login_records(access_code);
CREATE INDEX IF NOT EXISTS idx_login_records_login_at ON login_records(login_at DESC);

-- Enable RLS & set public access policy for portal operations
ALTER TABLE login_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to login_records"
    ON login_records FOR SELECT
    USING (true);

CREATE POLICY "Allow anonymous insert access to login_records"
    ON login_records FOR INSERT
    WITH CHECK (true);
