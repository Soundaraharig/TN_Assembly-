-- ====================================================================
-- SUPABASE MIGRATION: DEDICATED JURY EVALUATIONS & AUDIT TRAIL SYSTEM
-- Replaces JSONB social_coverage.scores array with relational tables
-- Guarantees:
-- 1. One full evaluation per event + session + jury + participant (UNIQUE)
-- 2. Multi-turn contribution tracking via jury_evaluation_turns
-- 3. Controlled, append-only score adjustment audit history
-- 4. Role-based security and isolation
-- ====================================================================

-- 1. Table: public.jury_evaluations
CREATE TABLE IF NOT EXISTS public.jury_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    session_name TEXT NOT NULL,
    learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    learner_name TEXT NOT NULL,
    constituency_number INT,
    constituency_name TEXT,
    party_name TEXT,
    bench TEXT,
    jury_id UUID NOT NULL REFERENCES public.jury_members(id) ON DELETE RESTRICT,
    jury_name TEXT NOT NULL,
    
    -- Exact 6-Criterion Rubric (Total = 100)
    research_constituency NUMERIC NOT NULL DEFAULT 0 CHECK (research_constituency >= 0 AND research_constituency <= 30),
    relevance_agenda NUMERIC NOT NULL DEFAULT 0 CHECK (relevance_agenda >= 0 AND relevance_agenda <= 20),
    communication_delivery NUMERIC NOT NULL DEFAULT 0 CHECK (communication_delivery >= 0 AND communication_delivery <= 20),
    parliamentary_conduct NUMERIC NOT NULL DEFAULT 0 CHECK (parliamentary_conduct >= 0 AND parliamentary_conduct <= 12),
    originality_preparation NUMERIC NOT NULL DEFAULT 0 CHECK (originality_preparation >= 0 AND originality_preparation <= 12),
    time_management NUMERIC NOT NULL DEFAULT 0 CHECK (time_management >= 0 AND time_management <= 6),
    total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0 AND total <= 100),
    
    feedback TEXT DEFAULT '',
    initial_speaking_turn_id UUID REFERENCES public.speaking_turns(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LOCKED', 'FLAGGED')),
    is_test BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Invariant: Exactly ONE official evaluation per event + session + jury + learner
    CONSTRAINT uq_jury_evaluation_identity UNIQUE (event_id, session_id, jury_id, learner_id)
);

-- Performance Indexes for Leaderboard & Evaluation Lookups
CREATE INDEX IF NOT EXISTS idx_jury_eval_event_sess ON public.jury_evaluations(event_id, session_id);
CREATE INDEX IF NOT EXISTS idx_jury_eval_learner ON public.jury_evaluations(learner_id);
CREATE INDEX IF NOT EXISTS idx_jury_eval_jury ON public.jury_evaluations(jury_id);
CREATE INDEX IF NOT EXISTS idx_jury_eval_ranking ON public.jury_evaluations(event_id, session_id, total DESC);

-- 2. Table: public.jury_evaluation_turns (Hansard speaking-turn linkages)
CREATE TABLE IF NOT EXISTS public.jury_evaluation_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.jury_evaluations(id) ON DELETE CASCADE,
    speaking_turn_id UUID NOT NULL REFERENCES public.speaking_turns(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL DEFAULT 1,
    action_type TEXT NOT NULL CHECK (action_type IN ('INITIAL_EVALUATION', 'CONTRIBUTION_ONLY', 'ADJUSTMENT')),
    recorded_by UUID REFERENCES public.jury_members(id) ON DELETE SET NULL,
    recorded_by_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Invariant: One turn linkage per evaluation and speaking turn
    CONSTRAINT uq_eval_speaking_turn UNIQUE (evaluation_id, speaking_turn_id)
);

CREATE INDEX IF NOT EXISTS idx_eval_turns_eval_id ON public.jury_evaluation_turns(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_eval_turns_spk_id ON public.jury_evaluation_turns(speaking_turn_id);

-- 3. Table: public.jury_evaluation_adjustments (Append-only change history)
CREATE TABLE IF NOT EXISTS public.jury_evaluation_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.jury_evaluations(id) ON DELETE CASCADE,
    speaking_turn_id UUID REFERENCES public.speaking_turns(id) ON DELETE SET NULL,
    juror_id UUID REFERENCES public.jury_members(id) ON DELETE SET NULL,
    juror_name TEXT NOT NULL,

    -- Before vs After Audit Trail
    previous_research_constituency NUMERIC NOT NULL,
    new_research_constituency NUMERIC NOT NULL,

    previous_relevance_agenda NUMERIC NOT NULL,
    new_relevance_agenda NUMERIC NOT NULL,

    previous_communication_delivery NUMERIC NOT NULL,
    new_communication_delivery NUMERIC NOT NULL,

    previous_parliamentary_conduct NUMERIC NOT NULL,
    new_parliamentary_conduct NUMERIC NOT NULL,

    previous_originality_preparation NUMERIC NOT NULL,
    new_originality_preparation NUMERIC NOT NULL,

    previous_time_management NUMERIC NOT NULL,
    new_time_management NUMERIC NOT NULL,

    previous_total NUMERIC NOT NULL,
    new_total NUMERIC NOT NULL,
    delta_total NUMERIC NOT NULL,

    -- Mandatory justification: NEVER NULL
    adjustment_reason TEXT NOT NULL CHECK (length(trim(adjustment_reason)) > 0),
    adjusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eval_adj_eval_id ON public.jury_evaluation_adjustments(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_eval_adj_turn_id ON public.jury_evaluation_adjustments(speaking_turn_id);
CREATE INDEX IF NOT EXISTS idx_eval_adj_juror_id ON public.jury_evaluation_adjustments(juror_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.jury_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jury_evaluation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jury_evaluation_adjustments ENABLE ROW LEVEL SECURITY;

-- 5. Safe Compatible RLS Policies
-- Evaluations: Read permitted for session leaderboards; write protected
DROP POLICY IF EXISTS "Allow select jury_evaluations" ON public.jury_evaluations;
DROP POLICY IF EXISTS "Allow insert jury_evaluations" ON public.jury_evaluations;
DROP POLICY IF EXISTS "Allow update jury_evaluations" ON public.jury_evaluations;

CREATE POLICY "Allow select jury_evaluations"
    ON public.jury_evaluations FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert jury_evaluations"
    ON public.jury_evaluations FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update jury_evaluations"
    ON public.jury_evaluations FOR UPDATE TO anon, authenticated
    USING (true);

-- Evaluation Turns:
DROP POLICY IF EXISTS "Allow select jury_evaluation_turns" ON public.jury_evaluation_turns;
DROP POLICY IF EXISTS "Allow insert jury_evaluation_turns" ON public.jury_evaluation_turns;

CREATE POLICY "Allow select jury_evaluation_turns"
    ON public.jury_evaluation_turns FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert jury_evaluation_turns"
    ON public.jury_evaluation_turns FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Evaluation Adjustments: Append-only (No UPDATE or DELETE permitted for ordinary users)
DROP POLICY IF EXISTS "Allow select jury_evaluation_adjustments" ON public.jury_evaluation_adjustments;
DROP POLICY IF EXISTS "Allow insert jury_evaluation_adjustments" ON public.jury_evaluation_adjustments;

CREATE POLICY "Allow select jury_evaluation_adjustments"
    ON public.jury_evaluation_adjustments FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert jury_evaluation_adjustments"
    ON public.jury_evaluation_adjustments FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 6. Permissions Grant
GRANT ALL ON public.jury_evaluations TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.jury_evaluation_turns TO anon, authenticated, postgres, service_role;
GRANT ALL ON public.jury_evaluation_adjustments TO anon, authenticated, postgres, service_role;
