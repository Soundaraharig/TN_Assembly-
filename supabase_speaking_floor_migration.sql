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
