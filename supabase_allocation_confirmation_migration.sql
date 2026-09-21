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

-- 3. Row Level Security
ALTER TABLE public.learner_allocation_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow operational access on learner_allocation_confirmations" ON public.learner_allocation_confirmations;
CREATE POLICY "Allow operational access on learner_allocation_confirmations" 
    ON public.learner_allocation_confirmations 
    FOR ALL TO anon, authenticated 
    USING (true) WITH CHECK (true);
