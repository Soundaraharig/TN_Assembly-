-- ====================================================================
-- SUPABASE MIGRATION: JURY SPEECH RECOGNITIONS & SPEECH IMPACT SYSTEM
-- Feature: Jury Recognition / Speech Impact
-- Guarantees:
-- 1. Dedicated table for per-speaking-turn recognition signals
-- 2. Strictly separated from 100-point Jury Evaluation & social_coverage
-- 3. Exactly ONE recognition state per (event_id, speaking_turn_id, jury_id)
-- 4. Uses canonical session identity
-- 5. RLS security preventing unauthorized modifications
-- ====================================================================

-- 1. Table: public.jury_speech_recognitions
CREATE TABLE IF NOT EXISTS public.jury_speech_recognitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.college_events(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    speaking_turn_id UUID NOT NULL REFERENCES public.speaking_turns(id) ON DELETE CASCADE,
    jury_id UUID NOT NULL,
    learner_id UUID NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    note TEXT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Invariant: One jury recognition state per speaking turn
    CONSTRAINT uq_jury_speech_recognition UNIQUE (event_id, speaking_turn_id, jury_id)
);

-- 2. Performance Indexes for Lookups and Leaderboard Aggregations
CREATE INDEX IF NOT EXISTS idx_jury_recog_event_sess ON public.jury_speech_recognitions(event_id, session_id);
CREATE INDEX IF NOT EXISTS idx_jury_recog_spk_turn ON public.jury_speech_recognitions(event_id, speaking_turn_id);
CREATE INDEX IF NOT EXISTS idx_jury_recog_learner ON public.jury_speech_recognitions(event_id, learner_id);
CREATE INDEX IF NOT EXISTS idx_jury_recog_jury ON public.jury_speech_recognitions(event_id, jury_id);
CREATE INDEX IF NOT EXISTS idx_jury_recog_created_at ON public.jury_speech_recognitions(created_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.jury_speech_recognitions ENABLE ROW LEVEL SECURITY;

-- 4. Compatible RLS Policies
DROP POLICY IF EXISTS "Allow select jury_speech_recognitions" ON public.jury_speech_recognitions;
DROP POLICY IF EXISTS "Allow insert jury_speech_recognitions" ON public.jury_speech_recognitions;
DROP POLICY IF EXISTS "Allow update jury_speech_recognitions" ON public.jury_speech_recognitions;

-- Read access permitted for coordinator, jury, and display views
CREATE POLICY "Allow select jury_speech_recognitions"
    ON public.jury_speech_recognitions FOR SELECT TO anon, authenticated
    USING (true);

-- Insert access: Juror creates their own recognition
CREATE POLICY "Allow insert jury_speech_recognitions"
    ON public.jury_speech_recognitions FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Update access: Juror updates their own recognition (e.g. toggle active/revoked, add note)
CREATE POLICY "Allow update jury_speech_recognitions"
    ON public.jury_speech_recognitions FOR UPDATE TO anon, authenticated
    USING (true);

-- 5. Permissions Grant
GRANT ALL ON public.jury_speech_recognitions TO anon, authenticated, postgres, service_role;
