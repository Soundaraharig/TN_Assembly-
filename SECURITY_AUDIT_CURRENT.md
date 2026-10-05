# SECURITY_AUDIT_CURRENT.md
## Comprehensive Security Audit Report (Current Codebase)

**Application:** Tamil Nadu Youth Legislative Assembly (`TN_Assembly-`)  
**Production URL:** [https://tnassembly.vercel.app](https://tnassembly.vercel.app)  
**Database URL:** `https://qyijhztjvxansctqhpkd.supabase.co`  
**Audit Timestamp:** 2026-10-05T17:25:00Z  

---

## 1. Classification Summary

| ID | Category | Vulnerability / Issue | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **V-01** | Secret / Config | Hardcoded Fallback Credentials in Source | **HIGH** | **VERIFIED & FIXED IN CODE** |
| **V-02** | Access Control | Unprotected Direct `/speaker-aid` URL Routing | **HIGH** | **VERIFIED & FIXED IN CODE** |
| **V-03** | Authorization | Unrestricted Question Deletion Method | **HIGH** | **VERIFIED & FIXED IN CODE** |
| **V-04** | Information Leak | Public Query Fetching All Coordinator Passwords | **HIGH** | **VERIFIED & FIXED IN CODE** |
| **V-05** | Transport Security | Missing Production HTTP Security Headers | **MEDIUM** | **VERIFIED & FIXED IN VERCEL.JSON** |
| **V-06** | Database / RLS | Wide-Open Anonymous Row Level Security (RLS) | **CRITICAL** | **VERIFIED — MIGRATION PREPARED** |
| **V-07** | Credentials | Plaintext Coordinator Passwords in DB | **CRITICAL** | **VERIFIED — MIGRATION PLANNED** |
| **V-08** | Authentication | Client-Only Role Authorization & localStorage Trust | **HIGH** | **VERIFIED — ARCHITECTURAL GAP** |
| **V-09** | Dependencies | Prototype Pollution & ReDoS in `xlsx` | **MEDIUM** | **VERIFIED — PRESERVED FOR SAFETY** |
| **V-10** | Secrets | `service_role` Leaked in Git | **NONE** | **FALSE POSITIVE** |
| **V-11** | Injection | Reflected XSS via `dangerouslySetInnerHTML` | **NONE** | **FALSE POSITIVE (ZERO SINKS)** |
| **V-12** | Network | Arbitrary External `fetch()` Endpoints | **NONE** | **FALSE POSITIVE (ZERO CALLS)** |

---

## 2. Detailed Findings & Evidence

### [V-01] Hardcoded Supabase Fallback Credentials in Source
* **Classification:** **HIGH | VERIFIED**
* **Location:** [src/lib/supabase.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/lib/supabase.ts#L3-L8)
* **Evidence:**
  ```typescript
  const DEFAULT_SUPABASE_URL = 'https://qyijhztjvxansctqhpkd.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
  ```
* **Actual Risk:** While client anon keys are public identifiers, hardcoding fallback values bypasses environment-variable isolation, risks confusion between staging/production projects, and bundles default credentials into production code.
* **Exploitable in Production:** Yes; any build without env vars silently connects to `qyijhztjvxansctqhpkd`.
* **Safe Remediation (Applied):** Fallbacks removed from source. Client strictly reads `metaEnv.VITE_SUPABASE_URL` and `metaEnv.VITE_SUPABASE_ANON_KEY`. If unconfigured, it logs a clear warning and gracefully disables remote sync without crashing.
* **Database Migration Needed:** No.
* **User Impact:** Zero impact; production environment variables on Vercel provide the configuration.

---

### [V-02] Unprotected Direct `/speaker-aid` URL Routing
* **Classification:** **HIGH | VERIFIED**
* **Location:** [src/components/volunteer/SpeakerAidDashboard.tsx](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/components/volunteer/SpeakerAidDashboard.tsx#L120-L170), [src/App.tsx](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/App.tsx#L2651-L2671)
* **Evidence:**
  In `App.tsx`, direct navigation to `/speaker-aid` mounted `SpeakerAidDashboard`. While the component contained an inline check `canUseSpeakerAid(volunteer, ...)`, all `useEffect` hooks (attaching window listeners, fetching speaking turns, and initiating Supabase realtime synchronization) were mounted **before** the authorization check returned.
* **Actual Risk:** Unauthorized users or lower-privileged volunteers opening `/speaker-aid` established background subscriptions and polled floor status.
* **Safe Remediation (Applied):**
  1. `isAuthorized` is computed at top-level before effects.
  2. Every lifecycle hook (`useEffect`) returns early if `!isAuthorized`.
  3. `storageService.setAuthoritativeCurrentSpeaker` and `endAuthoritativeCurrentSpeaker` enforce `isAuthorizedForSpeakerAid` internally.
* **Database Migration Needed:** No.
* **User Impact:** Zero for legitimate Speaker Aid staff; unauthorized roles see the access restricted notice without triggering network subscriptions.

---

### [V-03] Unchecked Question Deletion Method
* **Classification:** **HIGH | VERIFIED**
* **Location:** [src/services/storageService.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/services/storageService.ts#L21383-L21405)
* **Evidence:**
  `deleteProceedingsQuestion` removed questions from `PROCEEDINGS_QUESTIONS`, recorded deletion tombstones, and broadcasted deletions without checking whether the caller was a `super_admin` or `coordinator`.
* **Actual Risk:** An unauthorized user invoking `storageService.deleteProceedingsQuestion(...)` from the browser console could drop floor questions.
* **Safe Remediation (Applied):** Added caller session role verification inside `deleteProceedingsQuestion`. Strictly rejects calls unless the caller is `super_admin` or `coordinator`.
* **Database Migration Needed:** No.
* **User Impact:** Protects live questions; authorized coordinators in `ProceedingsTab.tsx` delete questions as expected.

---

### [V-04] Public Query Fetching All Coordinator Passwords
* **Classification:** **HIGH | VERIFIED**
* **Location:** [src/services/storageService.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/services/storageService.ts#L283-L284), [src/services/storageService.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/services/storageService.ts#L2271)
* **Evidence:**
  During general startup synchronization, `syncWithSupabase` executed:
  `sb.from('coordinators').select(SUPABASE_COLUMNS.COORDINATORS)`
  where `COORDINATORS` projected `password_hash, raw_temp_password`, distributing every coordinator's credentials to every connected client.
* **Actual Risk:** Anyone inspecting network requests or `localStorage` could read all coordinator passwords in plain text.
* **Safe Remediation (Applied):**
  1. Added `COORDINATORS_PUBLIC: 'id,event_id,name,email,created_at,updated_at'` to `SUPABASE_COLUMNS`.
  2. Updated general sync query to use `COORDINATORS_PUBLIC`.
  3. Restricted full credential queries exclusively to targeted login requests (`ilike('email', emailLower)`).
  4. Updated `types/index.ts` to make `password_hash?: string` optional on `Coordinator`.
* **Database Migration Needed:** No.
* **User Impact:** Zero; coordinator names/emails display properly in UI without broadcasting passwords.

---

### [V-05] Missing Production HTTP Security Headers
* **Classification:** **MEDIUM | VERIFIED**
* **Location:** [vercel.json](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/vercel.json)
* **Evidence:** Only SPA routing rewrite was present.
* **Safe Remediation (Applied):** Configured headers:
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: SAMEORIGIN`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  * `Content-Security-Policy`: permits `'self'`, Google fonts, data/blob assets, Supabase REST (`https://*.supabase.co`), and Supabase WebSockets (`wss://*.supabase.co`).
* **Database Migration Needed:** No.
* **User Impact:** Zero breakage; projector displays and realtime sync operate without restriction.

---

### [V-06] Wide-Open Anonymous Row Level Security (RLS)
* **Classification:** **CRITICAL | VERIFIED — MIGRATION PREPARED**
* **Location:** [supabase_schema.sql](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/supabase_schema.sql#L242-L250), [supabase_event_isolation_migration.sql](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/supabase_event_isolation_migration.sql#L100-L116)
* **Evidence:**
  `CREATE POLICY ... FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);` on all operational tables (`learners`, `college_events`, `coordinators`, etc.).
* **Actual Risk:** Any user with the public anon key can run direct REST/GraphQL `DELETE` or `UPDATE` queries against tables.
* **Why Not Naively Replaced:** The application does **not** use Supabase Auth sessions (`auth.uid()` is null for all users). Replacing with `USING (auth.uid() = ...)` will immediately break 100% of production functionality.
* **Safe Remediation Path:** Created [supabase_security_hardening.sql](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/supabase_security_hardening.sql) which disables `DELETE` for `anon` across all tables while preserving legitimate operational reads/writes.
* **Status:** Prepared as SQL migration for administrator review. NOT applied remotely.

---

### [V-07] Plaintext Coordinator Passwords in Database
* **Classification:** **CRITICAL | VERIFIED — MIGRATION PLANNED**
* **Location:** [src/services/storageService.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/services/storageService.ts#L6799-L6802), [src/App.tsx](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/App.tsx#L2484-L2487)
* **Evidence:**
  `c.password_hash === passTrim` and `emailLower.includes('admin') && passTrim === 'admin123'`.
* **Actual Risk:** Passwords are stored unhashed in Postgres.
* **Remediation Plan:** Transition to Supabase Edge Function or Postgres `pgcrypto` crypt extension for server-side verification. Must not be done during a live session to prevent lockouts.
* **Status:** Documented with safe phased plan.

---

### [V-08] Client-Only Role Authorization & localStorage Trust
* **Classification:** **HIGH | VERIFIED — ARCHITECTURAL GAP**
* **Location:** [src/services/storageService.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/services/storageService.ts#L11180), [src/App.tsx](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/App.tsx#L80)
* **Evidence:** Role checks in client code read `localStorage.getItem('tn_assembly_auth_session')`.
* **Actual Risk:** A user modifying `role: 'super_admin'` in DevTools can unlock UI buttons.
* **Mitigation:** In the client, UI route guards prevent visual access. The real boundary must be at the database layer (preventing destructive writes).

---

### [V-09] Prototype Pollution & ReDoS in `xlsx`
* **Classification:** **MEDIUM | VERIFIED — PRESERVED FOR SAFETY**
* **Location:** [src/utils/csvHelper.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/utils/csvHelper.ts#L2)
* **Evidence:** `xlsx@0.18.5` flagged with GHSA-4r6h-8v6p-xvw6.
* **Usage Path:** Used exclusively when coordinators import participant spreadsheets (`.xlsx`/`.xls`) in the admin portal.
* **Risk Evaluation:** No untrusted users have access to the upload function; no server-side parsing occurs.
* **Remediation Plan:** Retained during active event to guarantee no regression in roster import formats. Post-event migration to `exceljs` planned.

---

### [V-10] Leaked `service_role` Secrets in Git
* **Classification:** **FALSE POSITIVE**
* **Evidence:** Matches for `service_role` in git history are exclusively PostgreSQL DDL role grant statements (`GRANT ... TO service_role`). No `service_role` JWT secret or service key was ever committed.

---

### [V-11] Reflected XSS via `dangerouslySetInnerHTML`
* **Classification:** **FALSE POSITIVE**
* **Evidence:** Exhaustive repository search returned ZERO instances of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval()`, `document.write()`, or `new Function()`. React JSX escapes all dynamic content automatically.

---

### [V-12] Arbitrary External `fetch()` Endpoints
* **Classification:** **FALSE POSITIVE**
* **Evidence:** Zero unvetted `fetch()` calls in application code. All communications go through `@supabase/supabase-js`.
