-- ====================================================================
-- SUPABASE PRODUCTION SECURITY HARDENING MIGRATION
-- Project: Tamil Nadu Youth Legislative Assembly (TN Assembly)
-- Target Instance: qyijhztjvxansctqhpkd.supabase.co
-- Objective: Eliminate destructive anonymous operations (DELETE),
-- protect critical tables from unauthenticated drops, and enforce
-- data integrity without breaking existing client-side SPA functionality.
-- ====================================================================

-- 1. PREVENT ANONYMOUS HARD DELETION ACROSS ALL OPERATIONAL TABLES
-- While the client uses the anon key for legitimate live operational updates,
-- anonymous clients must NEVER be permitted to DROP or DELETE whole rows.

-- 1.1 college_events: Allow read and update, disallow delete
DROP POLICY IF EXISTS "Allow operational access college_events" ON public.college_events;
DROP POLICY IF EXISTS "Allow all operational access" ON public.college_events;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.college_events;

CREATE POLICY "Allow select college_events" ON public.college_events
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow update college_events" ON public.college_events
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete college_events" ON public.college_events
    FOR DELETE TO anon USING (false);

-- 1.2 learners: Allow read, insert, update; disallow delete
DROP POLICY IF EXISTS "Allow operational access learners" ON public.learners;
DROP POLICY IF EXISTS "Allow all operational access" ON public.learners;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.learners;

CREATE POLICY "Allow select learners" ON public.learners
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert learners" ON public.learners
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update learners" ON public.learners
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete learners" ON public.learners
    FOR DELETE TO anon USING (false);

-- 1.3 coordinators: Disallow delete
DROP POLICY IF EXISTS "Allow all operational access" ON public.coordinators;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.coordinators;

CREATE POLICY "Allow select coordinators" ON public.coordinators
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow update coordinators" ON public.coordinators
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete coordinators" ON public.coordinators
    FOR DELETE TO anon USING (false);

-- 1.4 speaking_turns: Disallow delete (turns are marked SPOKEN/CANCELLED, never hard-deleted)
DROP POLICY IF EXISTS "Allow operational access speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow select speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow insert speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow update speaking_turns" ON public.speaking_turns;

CREATE POLICY "Allow select speaking_turns" ON public.speaking_turns
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert speaking_turns" ON public.speaking_turns
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update speaking_turns" ON public.speaking_turns
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete speaking_turns" ON public.speaking_turns
    FOR DELETE TO anon USING (false);

-- 1.5 jury_speech_recognitions: Disallow delete (recognitions are toggled active=false)
DROP POLICY IF EXISTS "Allow operational access jury_speech_recognitions" ON public.jury_speech_recognitions;
DROP POLICY IF EXISTS "Allow select jury_speech_recognitions" ON public.jury_speech_recognitions;
DROP POLICY IF EXISTS "Allow insert jury_speech_recognitions" ON public.jury_speech_recognitions;
DROP POLICY IF EXISTS "Allow update jury_speech_recognitions" ON public.jury_speech_recognitions;

CREATE POLICY "Allow select jury_speech_recognitions" ON public.jury_speech_recognitions
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert jury_speech_recognitions" ON public.jury_speech_recognitions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update jury_speech_recognitions" ON public.jury_speech_recognitions
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete jury_speech_recognitions" ON public.jury_speech_recognitions
    FOR DELETE TO anon USING (false);

-- 1.6 event_day_attendance: Disallow delete
DROP POLICY IF EXISTS "Allow operational access event_day_attendance" ON public.event_day_attendance;

CREATE POLICY "Allow select event_day_attendance" ON public.event_day_attendance
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert event_day_attendance" ON public.event_day_attendance
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update event_day_attendance" ON public.event_day_attendance
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete event_day_attendance" ON public.event_day_attendance
    FOR DELETE TO anon USING (false);

-- 2. PostgREST Schema Cache Reload
NOTIFY pgrst, 'reload schema';
