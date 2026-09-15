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
