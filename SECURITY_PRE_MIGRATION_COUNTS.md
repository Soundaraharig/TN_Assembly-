# SECURITY_PRE_MIGRATION_COUNTS.md
## Baseline Production Database Counts (Pre-Migration)

**Generated At:** 2026-10-05T17:21:38.921Z  
**Source Instance:** `qyijhztjvxansctqhpkd.supabase.co`  
**Verification Method:** Read-only exact count query via Supabase REST API  

---

### 1. Active Event: JKKNCET TN ASSEMBLY 2026
* **Event ID:** `200fdd74-4d21-44d5-9f63-9a07bf267824`
* **Event Slug:** `jkkncet-tn-assembly-2026-tamil-nadu-2026`
* **Status:** Pre-Event / Live Assembly Ready

| Metric / Table | Count | Storage Subsystem | Verified Safe Baseline |
| :--- | :---: | :--- | :---: |
| **Learners (Delegates)** | **122** | `public.learners` | Verified |
| **Questions (Total)** | **63** | `social_coverage.proceedings_questions` | Verified |
| **Approved Questions** | **25** | `status = 'Approved' OR 'Starred'` | Verified |
| **Rejected Questions** | **4** | `status = 'Rejected'` | Verified |
| **Pending / Under Review** | **34** | `status = 'Submitted' OR 'Under Review'` | Verified |
| **Attendance Records** | **539** | `public.event_day_attendance` | Verified |
| **Elections Configured** | **9** | `social_coverage.elections` | Verified |
| **Election Votes Cast** | **0** | `social_coverage.election_votes` | Verified |
| **Bill Votes** | **0** | `social_coverage.bill_votes` | Verified |
| **Flash Vote Casts** | **0** | `social_coverage.flash_vote_casts` | Verified |
| **Speaking Turns** | **79** | `public.speaking_turns` | Verified |
| **Speaking Requests** | **8** | `public.speaking_requests` | Verified |
| **Jury Evaluations (Table)** | **0** | `public.jury_evaluations` | Verified |
| **Jury Evaluation Adjustments** | **0** | `public.jury_evaluation_adjustments` | Verified |
| **Jury Recognitions (Table)** | **0** | `public.jury_speech_recognitions` | Verified |
| **Jury Recognitions (SC)** | **3** | `social_coverage.jury_speech_recognitions` | Verified |
| **Jury Scores (SC)** | **0** | `social_coverage.scores` | Verified |

---

### 2. Comparison Event: JKKN ARTS TN ASSEMBLY 2026
* **Event ID:** `05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8`
* **Event Slug:** `jkkn-arts-tn-assembly-2026`
* **Status:** Completed Assembly (Preserved Historical Archive)

| Metric / Table | Count | Storage Subsystem | Verified Safe Baseline |
| :--- | :---: | :--- | :---: |
| **Learners (Delegates)** | **84** | `public.learners` | Verified |
| **Questions (Total)** | **19** | `social_coverage.proceedings_questions` | Verified |
| **Approved Questions** | **19** | `status = 'Approved'` | Verified |
| **Rejected Questions** | **0** | `status = 'Rejected'` | Verified |
| **Attendance Records** | **668** | `public.event_day_attendance` | Verified |
| **Elections Configured** | **8** | `social_coverage.elections` | Verified |
| **Speaking Turns** | **7** | `public.speaking_turns` | Verified |
| **Speaking Requests** | **86** | `public.speaking_requests` | Verified |
| **Jury Evaluations (Table)** | **0** | `public.jury_evaluations` | Verified |
| **Jury Evaluation Adjustments** | **0** | `public.jury_evaluation_adjustments` | Verified |
| **Jury Recognitions (SC)** | **0** | `social_coverage.jury_speech_recognitions` | Verified |
| **Jury Scores (SC)** | **579** | `social_coverage.scores` | Verified |

---

### 3. All Other Events Baseline
* **JKKN AHS TN ASSEMBLY 2026 (`648790e1-0836-4a29-8a53-74929e7404f3`):** 0 scores, 0 speaking turns.
* **JKKN CNR TN ASSEMBLY 2026 (`35f87a38-62de-4e0c-bffb-59c394f987b1`):** 0 scores, 0 speaking turns.

---

### 4. Zero Data Loss Mandate
Before and after any database policy or code deployment, these counts MUST be re-verified using `node scratch/audit_phase0_comprehensive.mjs`. If any count unexpectedly drops or mutates, deployment is aborted immediately.
