# SUPABASE & ARCHITECTURE STRICT GUARDRAILS (DO NOT VIOLATE)

1. ZERO GLOBAL FETCHING ON ROUTE MOUNT:
   - NEVER query all child tables (`learners`, `volunteers`, `event_day_attendance`, `session_agenda`, `committees`) globally in `App.tsx` or on route changes.
   - Child tables must only be queried on demand inside their dedicated view components.

2. STRICT ROLE-BASED QUERY SCOPING:
   - STUDENT PORTAL:
     * NEVER fetch `volunteers`, `jury_members`, or `event_day_attendance` for a student.
     * Fetch ONLY:
       1. The single matching student record from `learners` using `.eq('access_code', code)`.
       2. The single active `college_events` row matching that student's `event_id`.
       3. Active elections/flash votes from Realtime or event payload.
   - VOLUNTEER PORTAL:
     * Fetch ONLY the active event's `learners`, `event_days`, and `event_day_attendance`. Never fetch unrelated tables.
   - ADMIN PORTAL:
     * Super Admin and Coordinator tables load strictly inside `/admin/*` routes.

3. ZERO INTERVAL POLLING:
   - NEVER use `setInterval`, recurring timers, or `forceRefresh()` loops.
   - All live updates (voting state, attendance stats) MUST use Supabase Realtime WebSocket subscriptions (`channel.on('postgres_changes')` or `channel.send('broadcast')`).

4. SCHEMA INTEGRITY:
   - NEVER invent or guess column names in `.select(...)`.
   - Use verified types or `.select('*')` only when strictly necessary for small, scoped tables.
   - NEVER execute destructive `DELETE` queries on core tables. Use soft deletes (`is_archived: true`).