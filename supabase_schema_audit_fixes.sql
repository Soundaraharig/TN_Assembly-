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
