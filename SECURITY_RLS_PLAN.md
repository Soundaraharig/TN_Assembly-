# SECURITY_RLS_PLAN.md
## Supabase Row Level Security (RLS) & Authorization Architecture Plan

**Application:** Tamil Nadu Youth Legislative Assembly (`TN_Assembly-`)  
**Target Database:** `qyijhztjvxansctqhpkd.supabase.co`  
**Architecture Context:** Pure Client-Side SPA communicating via Supabase JavaScript Client with `anon` public key.  

---

### 1. Fundamental Architectural Constraint

> **CRITICAL REALITY:**  
> The application does NOT execute `supabase.auth.signInWithPassword()` or establish Supabase Auth sessions.  
> In PostgreSQL, `auth.uid()` evaluates to `NULL` for EVERY incoming client request (Student, Volunteer, Jury, Coordinator, Projector, Admin).  
> **Mandate:** Replacing policies with `USING (auth.uid() = ...)` will immediately break 100% of production functionality.  

---

### 2. Table-by-Table Security Matrix

| Table Name | RLS Status | SELECT Access | INSERT Access | UPDATE Access | DELETE Access | Risk Level | Required Security Change |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **`college_events`** | Enabled | Public (All) | Admin / Coordinator | Anon (Sync `social_coverage`) | **DROP / FORBIDDEN** | High | Prevent anonymous `DELETE`. Allow public reads & operational updates. |
| **`learners`** | Enabled | Public (All) | Anon (Registration) | Anon (Check-in/Status) | **DROP / FORBIDDEN** | High | Prevent anonymous `DELETE`. |
| **`coordinators`** | Enabled | Public (Omit Passwords) | Admin Only | Admin Only | **DROP / FORBIDDEN** | High | Disallow anonymous `DELETE`. Sanitize client `SELECT` projection. |
| **`speaking_turns`** | Enabled | Public (All) | Speaker Aid | Speaker Aid (Status) | **DROP / FORBIDDEN** | High | Prevent anonymous `DELETE`. Allow `SPOKEN` / `CANCELLED` updates. |
| **`speaking_requests`**| Enabled | Public (All) | Student (Delegates) | Speaker Aid (Called/Resolved)| **DROP / FORBIDDEN** | Medium | Prevent anonymous `DELETE`. |
| **`jury_speech_recognitions`** | Enabled | Public (All) | Jury | Jury (Toggle Active) | **DROP / FORBIDDEN** | High | Prevent anonymous `DELETE`. Recognitions toggle `active = false`. |
| **`jury_evaluations`** | Enabled | Public (All) | Jury | Jury | **DROP / FORBIDDEN** | High | Prevent anonymous `DELETE`. |
| **`jury_evaluation_turns`** | Enabled | Public (All) | Jury | Append-Only | **DROP / FORBIDDEN** | Medium | Prevent update/delete. |
| **`jury_evaluation_adjustments`** | Enabled | Public (All) | Jury / Coord | Append-Only | **DROP / FORBIDDEN** | Medium | Prevent update/delete. |
| **`event_day_attendance`** | Enabled | Public (All) | Volunteers | Volunteers (Marking) | **DROP / FORBIDDEN** | High | Prevent anonymous `DELETE`. |
| **`session_agenda`** | Enabled | Public (All) | Admin / Coord | Admin / Coord | **DROP / FORBIDDEN** | Medium | Prevent anonymous `DELETE`. |
| **`political_parties`** | Enabled | Public (All) | Admin / Coord | Admin / Coord | **DROP / FORBIDDEN** | Low | Prevent anonymous `DELETE`. |
| **`committees`** | Enabled | Public (All) | Admin / Coord | Admin / Coord | **DROP / FORBIDDEN** | Low | Prevent anonymous `DELETE`. |
| **`event_days`** | Enabled | Public (All) | Admin / Coord | Admin / Coord | **DROP / FORBIDDEN** | Low | Prevent anonymous `DELETE`. |
| **`day_activities`** | Enabled | Public (All) | Admin / Coord | Admin / Coord | **DROP / FORBIDDEN** | Low | Prevent anonymous `DELETE`. |
| **`login_records`** | Enabled | Admin / Coord | Append-Only (Audit)| None | None | Low | Disallow modification/deletion. |

---

### 3. Phased Implementation Plan

#### Phase A (Non-Breaking Hardening — Prepared in `supabase_security_hardening.sql`)
1. **Disable Anonymous `DELETE` Everywhere:**  
   Replace `CREATE POLICY ... FOR ALL` with explicit `FOR SELECT`, `FOR INSERT`, and `FOR UPDATE` policies. Explicitly define `FOR DELETE TO anon USING (false)`.
   * **Result:** No anonymous actor or console injection can delete records from `college_events`, `learners`, `speaking_turns`, `event_day_attendance`, or `jury_speech_recognitions`.
   * **Zero Breakage:** All existing frontend operational reads, inserts, and updates continue working uninterrupted.

#### Phase B (Server-Side Credential Verification — Post-Event)
1. **Move Coordinator Authentication to Postgres RPC / Edge Function:**
   * Create `public.verify_coordinator_credentials(email, candidate_password)` with `SECURITY DEFINER`.
   * Hashes passwords using PostgreSQL `pgcrypto` (`crypt(candidate_password, gen_salt('bf'))`).
   * Never exposes password hashes to client `SELECT` queries.
   * Eliminates hardcoded `admin123` / `coord123` fallbacks.

---

### 4. Rollback Strategy
If any policy in Phase A causes an operational regression during the live event, execute:
```sql
-- ROLLBACK TO PREVIOUS OPERATIONAL POLICIES:
CREATE POLICY "Allow operational access college_events" ON public.college_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow operational access learners" ON public.learners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow operational access speaking_turns" ON public.speaking_turns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow operational access jury_speech_recognitions" ON public.jury_speech_recognitions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow operational access event_day_attendance" ON public.event_day_attendance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
NOTIFY pgrst, 'reload schema';
```
*(This rollback restores the immediate working baseline within 5 seconds without data loss).*
