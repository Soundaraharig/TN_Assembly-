-- ====================================================================
-- SUPABASE PRODUCTION SECURITY HARDENING MIGRATION (V2 — STAGED PLAN)
-- Target: qyijhztjvxansctqhpkd.supabase.co
-- WARNING: DO NOT APPLY TO LIVE DATABASE UNTIL PHASE C IS COMPLETE.
-- This script contains ONLY verified tables existing in public schema.
-- It eliminates destructive anonymous DELETEs once server API endpoints
-- (/api/admin/action) are active and verified.
-- ====================================================================

-- ─── 1. TABLE: college_events ───
-- PURPOSE: Protect event configurations and social_coverage JSONB
-- ROLE/ACCESS: Public SELECT/UPDATE; DELETE restricted to service_role
-- DEPENDENCY: /api/admin/action (action: 'delete_event')
-- SAFE TO APPLY ONLY AFTER: SuperAdmin event deletion is routed via API
DROP POLICY IF EXISTS "Allow operational access college_events" ON public.college_events;
DROP POLICY IF EXISTS "Allow all operational access" ON public.college_events;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.college_events;
DROP POLICY IF EXISTS "Allow select college_events" ON public.college_events;
DROP POLICY IF EXISTS "Allow update college_events" ON public.college_events;
DROP POLICY IF EXISTS "Disallow anon delete college_events" ON public.college_events;

CREATE POLICY "Allow select college_events" ON public.college_events
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert college_events" ON public.college_events
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update college_events" ON public.college_events
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete college_events" ON public.college_events
    FOR DELETE TO anon USING (false);

-- ─── 2. TABLE: learners ───
-- PURPOSE: Delegate roster protection
-- ROLE/ACCESS: Public SELECT/INSERT/UPDATE; DELETE restricted to service_role
-- DEPENDENCY: /api/admin/action (action: 'delete_learner')
-- SAFE TO APPLY ONLY AFTER: Roster sync and single-learner deletes use API
DROP POLICY IF EXISTS "Allow operational access learners" ON public.learners;
DROP POLICY IF EXISTS "Allow all operational access" ON public.learners;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.learners;
DROP POLICY IF EXISTS "Allow select learners" ON public.learners;
DROP POLICY IF EXISTS "Allow insert learners" ON public.learners;
DROP POLICY IF EXISTS "Allow update learners" ON public.learners;
DROP POLICY IF EXISTS "Disallow anon delete learners" ON public.learners;

CREATE POLICY "Allow select learners" ON public.learners
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert learners" ON public.learners
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update learners" ON public.learners
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete learners" ON public.learners
    FOR DELETE TO anon USING (false);

-- ─── 3. TABLE: coordinators ───
-- PURPOSE: Coordinator account management
-- ROLE/ACCESS: SELECT, INSERT, UPDATE allowed; DELETE restricted to service_role
-- NOTE: Corrects v1 which omitted INSERT, ensuring onboarding is not broken.
-- DEPENDENCY: Password columns projected safely via COORDINATORS_PUBLIC
-- SAFE TO APPLY ONLY AFTER: Frontend strictly uses server login or safe projection
DROP POLICY IF EXISTS "Allow all operational access" ON public.coordinators;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.coordinators;
DROP POLICY IF EXISTS "Allow select coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Allow insert coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Allow update coordinators" ON public.coordinators;
DROP POLICY IF EXISTS "Disallow anon delete coordinators" ON public.coordinators;

CREATE POLICY "Allow select coordinators" ON public.coordinators
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert coordinators" ON public.coordinators
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update coordinators" ON public.coordinators
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete coordinators" ON public.coordinators
    FOR DELETE TO anon USING (false);

-- ─── 4. TABLE: speaking_turns ───
-- PURPOSE: Floor turns ledger
-- ROLE/ACCESS: SELECT, INSERT, UPDATE allowed; DELETE restricted to service_role
-- DEPENDENCY: /api/admin/action (action: 'reset_test_run')
-- SAFE TO APPLY ONLY AFTER: Test-mode purge runs via API or soft-cancellation
DROP POLICY IF EXISTS "Allow operational access speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow select speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow insert speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Allow update speaking_turns" ON public.speaking_turns;
DROP POLICY IF EXISTS "Disallow anon delete speaking_turns" ON public.speaking_turns;

CREATE POLICY "Allow select speaking_turns" ON public.speaking_turns
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert speaking_turns" ON public.speaking_turns
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update speaking_turns" ON public.speaking_turns
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete speaking_turns" ON public.speaking_turns
    FOR DELETE TO anon USING (false);

-- ─── 5. TABLE: speaking_requests ───
-- PURPOSE: Floor queue requests
-- ROLE/ACCESS: SELECT, INSERT, UPDATE allowed; DELETE restricted to service_role
-- DEPENDENCY: /api/admin/action (action: 'reset_test_run')
-- SAFE TO APPLY ONLY AFTER: Test-mode purge runs via API
DROP POLICY IF EXISTS "Allow select speaking_requests" ON public.speaking_requests;
DROP POLICY IF EXISTS "Allow insert speaking_requests" ON public.speaking_requests;
DROP POLICY IF EXISTS "Allow update speaking_requests" ON public.speaking_requests;

CREATE POLICY "Allow select speaking_requests" ON public.speaking_requests
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert speaking_requests" ON public.speaking_requests
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update speaking_requests" ON public.speaking_requests
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete speaking_requests" ON public.speaking_requests
    FOR DELETE TO anon USING (false);

-- ─── 6. TABLE: event_day_attendance ───
-- PURPOSE: Immutable / append attendance check-ins
-- ROLE/ACCESS: SELECT, INSERT, UPDATE allowed; DELETE restricted to service_role
-- DEPENDENCY: /api/admin/action (action: 'delete_day')
-- SAFE TO APPLY ONLY AFTER: Day deletion runs via API
DROP POLICY IF EXISTS "Allow operational access event_day_attendance" ON public.event_day_attendance;
DROP POLICY IF EXISTS "Allow select event_day_attendance" ON public.event_day_attendance;
DROP POLICY IF EXISTS "Allow insert event_day_attendance" ON public.event_day_attendance;
DROP POLICY IF EXISTS "Allow update event_day_attendance" ON public.event_day_attendance;
DROP POLICY IF EXISTS "Disallow anon delete event_day_attendance" ON public.event_day_attendance;

CREATE POLICY "Allow select event_day_attendance" ON public.event_day_attendance
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert event_day_attendance" ON public.event_day_attendance
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update event_day_attendance" ON public.event_day_attendance
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete event_day_attendance" ON public.event_day_attendance
    FOR DELETE TO anon USING (false);

-- ─── 7. TABLE: session_agenda ───
-- PURPOSE: Event schedule & timeline
-- ROLE/ACCESS: SELECT, INSERT, UPDATE allowed; DELETE restricted to service_role
-- DEPENDENCY: /api/admin/action (action: 'delete_agenda')
-- SAFE TO APPLY ONLY AFTER: Agenda item deletion runs via API
DROP POLICY IF EXISTS "Allow operational access session_agenda" ON public.session_agenda;
DROP POLICY IF EXISTS "Allow read access to all users" ON public.session_agenda;
DROP POLICY IF EXISTS "Allow all operational access" ON public.session_agenda;

CREATE POLICY "Allow select session_agenda" ON public.session_agenda
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow insert session_agenda" ON public.session_agenda
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow update session_agenda" ON public.session_agenda
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Disallow anon delete session_agenda" ON public.session_agenda
    FOR DELETE TO anon USING (false);

-- ─── 8. TABLES WITH FULL OPERATIONAL ACCESS PRESERVED ───
-- These tables remain accessible for standard staff/volunteer workflow
-- (political_parties, committees, jury_members, volunteers, proceedings_motions, event_deadlines)
-- No changes to their current policies to avoid any risk of operational disruption.

-- ─── 9. PostgREST Schema Cache Reload ───
NOTIFY pgrst, 'reload schema';
