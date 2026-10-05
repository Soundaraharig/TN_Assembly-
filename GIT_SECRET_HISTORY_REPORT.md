# GIT_SECRET_HISTORY_REPORT.md
## Audit of Secrets, Tokens, and Keys in Git History

**Generated At:** 2026-10-05T17:25:00Z  
**Repository:** `https://github.com/Soundaraharig/TN_Assembly-.git`  
**Inspected Refs:** `main`, historical commits (`a845583`, `120e828`, `14f1d1f`, `0ffaa5d`, `261d4e8`)  

---

### 1. Distinction: Public Anon Key vs. Privileged Secrets

* **Supabase Public Anon Key (`role: "anon"`):**
  * Present in `.env` and previously as fallback literals in [src/lib/supabase.ts](file:///c:/Users/sound/Documents/GitHub/TN_Assembly-/src/lib/supabase.ts).
  * **Classification:** **Public Client Configuration Value.**
  * In Supabase architecture, the anon key is designed to reside in the frontend browser client. It has no administrative access, cannot bypass RLS, cannot access the Postgres management API, and cannot run schema migrations.
  * Removing fallback literals from `src/lib/supabase.ts` was performed for clean code hygiene and environment separation, not because anon keys are server secrets.

* **Supabase `service_role` Key:**
  * **Classification:** **Privileged Master Secret.**
  * Bypasses Row Level Security (RLS) and has unrestricted administrative control.
  * **Status in Code / Git:** **NEVER EXPOSED (ZERO INSTANCES FOUND).**
  * Exhaustive search across git logs, diffs, and trees confirmed that `service_role` in git history only appeared as PostgreSQL DDL statements (e.g. `GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role`). No `service_role` JWT secret or key token exists in the repository.

* **PostgreSQL Master Database Passwords:**
  * **Status:** **NOT FOUND.** No database passwords exist in Git history.

* **GitHub Personal Access Tokens (`ghp_`, `github_pat_`):**
  * **Status:** **NOT FOUND.** Zero matches across history.

* **Vercel Access Tokens (`VERCEL_TOKEN`):**
  * **Status:** **NOT FOUND.** Zero matches across history.

* **Private Cryptographic Keys (`BEGIN PRIVATE KEY` / RSA):**
  * **Status:** **NOT FOUND.** Zero matches across history.

---

### 2. Historical Snapshot Inclusions (September 24 Backups)

* **Commits:** `a845583` and `120e828`
* **Affected Paths:** `supabase-production-backup-2026-09-24/`
* **Contents:**
  * `database/json-tables/coordinators.json` (historic coordinator emails & plaintext passwords from initial setup).
  * `auth/learners-access-codes.json` (historic delegate access codes from Sep 24).
* **Current Status in HEAD:**
  * `supabase-production-backup*` was added to `.gitignore` and is **not tracked in the current HEAD**.
  * The local folders on developer disk are ignored and not included in Vite builds or Vercel production deployments.

---

### 3. Recommendations & History Cleanup Plan

1. **Do NOT Force-Push During Live Assembly:**
   * Rewriting git history via `git filter-repo` or `BFG Repo-Cleaner` requires `git push --force`.
   * Force-pushing during a live event creates high operational risk of desynchronizing active developer workstations, CI/CD pipelines, and active Vercel preview environments.
2. **Post-Event Remediation:**
   * After the current Assembly simulation concludes, run a coordinated git history purge for `supabase-production-backup-2026-09-24/` using `git filter-repo --invert-paths --path supabase-production-backup-2026-09-24`.
   * Rotate coordinator access passwords post-event.
