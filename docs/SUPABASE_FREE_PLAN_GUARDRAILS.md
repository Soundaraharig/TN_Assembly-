# Supabase Free-Plan Engineering Guardrails & Architecture Rulebook

**Status:** Authoritative / Permanent  
**Applies To:** TN Assembly Application (Production Educational Platform)  
**Target Infrastructure:** Supabase Free Tier (Nano Compute, Shared Micro Instance)  

---

## 1. Executive Summary & Free-Plan Safety Principle

This document defines the permanent architectural constraints, write budgets, realtime limits, and egress guardrails required to operate the TN Assembly application continuously, safely, and comfortably within the official Supabase Free-Plan limits.

### The Fundamental Free-Plan Safety Principle:
> **DATABASE IS FOR AUTHORITATIVE PERSISTENT STATE.**  
> **REALTIME IS FOR LIVE DELIVERY.**  
> **LOCAL REACT STATE IS FOR TEMPORARY UI STATE.**  
> **CACHE IS FOR PERFORMANCE ONLY.**  

- **Never** use the database as a per-second UI synchronization bus.
- **Never** use Realtime as a database replacement.
- **Never** use `localStorage` as the authoritative source of truth.
- **Never** repeatedly synchronize unchanged state between all three.

---

## 2. Supabase Free-Plan Quotas & Safety Margins

All application features must be designed to run comfortably **BELOW** these quotas. **Do NOT design the system to run at 95–100% of any threshold.**

| Resource | Official Supabase Free Quota | Application Engineering Safety Target | Failure Consequence if Exceeded |
| :--- | :--- | :--- | :--- |
| **Database Disk Size** | 500 MB | $\le$ 250 MB | Project automatically enters **READ-ONLY** mode |
| **Total Disk Storage** | ~1 GB (included) | $\le$ 500 MB | Disk space exhaustion |
| **Uncached Egress** | 5 GB / month | $\le$ 2.5 GB / month | Service disruption / overage restriction |
| **Cached Egress** | 5 GB / month | $\le$ 2.5 GB / month | Edge cache throttling |
| **Realtime Connections** | 200 concurrent WebSocket connections | $\le$ 150 concurrent connections | Client connection rejections |
| **Realtime Message Rate** | 100 messages / second | $\le$ 25 messages / second | Message drop / connection disconnects |
| **Realtime Channel Joins** | 100 channel joins / second | $\le$ 20 joins / second | Throttled WebSocket joins |
| **Realtime Monthly Volume**| 2,000,000 messages / month | $\le$ 800,000 messages / month | Realtime service throttling |
| **Channels Per Connection**| 100 channels | $\le$ 2 channels per client | Leaked subscriptions crash client |
| **Broadcast Payload Size** | 256 KB max payload | $\le$ 10 KB per message | WebSocket payload drop |
| **Postgres Changes Limit** | 1 MB payload limit | 0 (Use Realtime Broadcast instead) | Postgres WAL lag & write lockups |
| **File Storage** | 1 GB | $\le$ 200 MB | Upload failures |
| **Edge Function Invocations**| 500,000 / month | $\le$ 100,000 / month | Function 429 errors |
| **Compute / Disk IOPS** | Nano compute (baseline ~0.5 IOPS, temporary burst) | Zero per-second writes; no WAL churn | Disk I/O budget exhausted; severe I/O throttling |

---

## 3. Database Write Budget & Anti-Amplification Rules

Writing to PostgreSQL generates disk writes, Write-Ahead Logs (WAL), index updates, and HOT tuple churn. On Free/Nano compute, disk throughput is strictly capped.

### Strict Non-Negotiable Prohibition:
**NEVER write to PostgreSQL:**
- On every timer second / tick
- On every React render cycle
- On every `useEffect` trigger or dependency change
- On every Realtime message callback
- On every page hydration or mount
- On every network reconnect
- On every projector display refresh
- On every agenda viewing / refresh
- On every browser tab synchronization (`storage` event)

### Write Verification Checklist:
For **every** database `UPDATE` or `UPSERT`:
1. **Semantic Value Check:** Determine whether the functional data actually changed.
2. **No-Op Suppression:** If the incoming payload matches the current remote/stored state, abort the write immediately (zero I/O).
3. **Narrow Field Updates:** Update only the specific columns that changed. Never rewrite entire rows or unrelated JSONB fields.
4. **No Timestamp Churn:** Do not update `updated_at` or `updatedAt` merely because a read, mount, or hydration occurred.
5. **Debouncing & In-Flight Coalescing:** Any rapidly recurring write (e.g., student attendance check-ins) must be coalesced and deduplicated.

---

## 4. `social_coverage` High-Risk JSONB Document Rules

The `public.college_events.social_coverage` column contains multi-feature states (proceedings, flash votes, nominations, questions, projector settings, timer state). It represents the single highest risk for database write amplification and disk exhaustion.

### Mandatory Rules for `social_coverage`:
1. **Semantic Deep-Equality Guard:** Before writing to `social_coverage`, compare the candidate object with the authoritative remote state using `areJsonbObjectsEqual(candidate, existing, ['updated_at', 'updatedAt'])`. If equal, **SKIP THE WRITE COMPLETELY**.
2. **No Full Replacement from Partial Clients:** Never overwrite `social_coverage` using a partial client snapshot. All mutations must safely merge with remote authoritative fields.
3. **No Cross-Feature Overwrites:** A change in agenda progress must never overwrite bill voting or question state.
4. **No Timer Tick Writes:** A running timer countdown must **NEVER** write to `social_coverage`.
5. **Database Trigger Defense:** Maintain the `trg_suppress_redundant_college_events_update` BEFORE UPDATE trigger on `college_events` in PostgreSQL to cancel no-op updates at the database engine level (returning `NULL`).

---

## 5. Timer Architecture Rules

1. **Client Memory + Realtime Only:** Live countdown ($75 \to 74 \to 73 \dots$) is calculated strictly from authoritative timestamps (`targetEndTime`, `startedAt`, `durationSec`) inside client memory (`setInterval`). It is **NEVER** persisted to PostgreSQL per second.
2. **Persist Only Structural Transitions:**
   Database writes are permitted **ONLY** on explicit state transitions:
   - `START`
   - `PAUSE`
   - `RESUME`
   - `RESET`
   - `EXPIRE`
   - `EXPLICIT DURATION CONFIGURATION CHANGE`
3. **Single Realtime Broadcast:** Broadcast only `timer_update` with a compact payload `{ eventId, timerState }`. Never send redundant duplicate broadcasts (`timer_state_update`).
4. **Decoupled Agenda & Timer:** Changing the agenda item must not reset timer configuration. Timer ticks must never modify agenda state.

---

## 6. Agenda Architecture Rules

1. **Agenda Reads are Strictly Read-Only:**
   - Page load: READ
   - Refresh: READ
   - Reconnect: READ
   - Control Room open: READ
   - Projector open: READ
2. **Explicit Admin Action Required:** Only an explicit user interaction from the Coordinator/Speaker dashboard can modify the active agenda.
3. **Completed vs. Current Independence:** Marking an agenda item completed or resetting completed status must not alter the active agenda selection.
4. **Zero Automatic Shifts:** No automatic agenda changes may trigger from wall clocks, timer expiries, hydrations, or reconnects.

---

## 7. Projector Studio Rules

1. **Decoupled Display State:** The Projector Studio display scene (`SESSION`, `BILL`, `QUESTION`, `PROJECTION_BLANK`) is completely independent from voting states, question calling status, and timer state.
2. **No Automatic Bill Projection:** An open bill vote does **NOT** automatically set `displayScene = BILL`. Only an explicit administrator action ("SHOW BILL ON PROJECTOR") may project the bill.
3. **Projector Displays are Read-Only:** Opening or refreshing a projector display window (`StandaloneProjectorDisplay.tsx`) performs **0 database writes**. Multiple projector screens must converge authoritatively via Realtime broadcasts.

---

## 8. Voting & Electoral Integrity Rules

1. **Transactional Student Votes:**
   - Every student vote (bill, election candidate, flash vote) is authoritative.
   - Do **NOT** batch student votes in a way that introduces vote loss risks during concurrent voting.
2. **Permanent Student Vote Ledger:**
   - Student "VOTED" state is derived directly from the student's own verified vote record in `tn_assembly_user_vote_ledger_${eventId}_${studentId}`.
   - Never allow stale realtime broadcasts, partial payloads, or page refreshes to flip a verified vote from `VOTED` back to `NOT VOTED`.
3. **Compact Delta Broadcasts:**
   - When broadcasting bill or flash vote updates, strip full vote arrays (`const { votes, ...compactBill } = bill;`) so that other clients receive only aggregate counts and status, keeping payloads $< 1$ KB.

---

## 9. Realtime Architecture & Connection Rules

1. **Single Multiplexed Event Channel:**
   - Use exactly **one** multiplexed WebSocket channel per event (`tn_assembly_live_${eventId}`).
   - Prohibit component-level, button-level, or per-query channels.
2. **Strict Lifecycle Cleanup:**
   - Every `channel.subscribe()` must have an unconditional cleanup (`supabase.removeChannel(ch)`) on React component unmount.
   - Guard against duplicate channel creation when props or state change without event ID changes.
3. **No `postgres_changes` For Rapid UI Sync:**
   - Realtime Broadcast (`channel.send({ type: 'broadcast', ... })`) runs purely in memory via the Elixir cluster without touching PostgreSQL disk or generating WAL.
   - Do **NOT** subscribe to Postgres Changes for rapid operational updates.
4. **Message Budgeting:**
   - Target message frequency: Maximum 1-2 messages per discrete administrative action.
   - Zero per-second broadcasts.
   - Eliminate duplicate broadcast events for the same state change.

---

## 10. Egress & PostgREST Query Rules

Free-tier egress is capped at 5 GB/month. Excessive queries and unbounded row fetching can exhaust this quota rapidly.

1. **Mandatory Narrow Column Queries:**
   - **Never** use `select('*')` on production queries.
   - Always query specific named columns defined in `SUPABASE_COLUMNS` (e.g., `SUPABASE_COLUMNS.SESSION_AGENDA`, `SUPABASE_COLUMNS.LEARNERS`).
2. **Role-Based Query Scoping:**
   - **Student Portal:** Fetch ONLY the single matching student record (`.eq('access_code', code)`), single active event row, and active flash votes. Never fetch `volunteers`, `jury_members`, or full `event_day_attendance`.
   - **Volunteer Portal:** Fetch only active event attendees and event days.
   - **Jury Portal:** Fetch only scoring sessions and active event criteria.
3. **Pagination & Bounded Results:**
   - Large tables (`login_records`, `learners`, `audit_logs`) must be queried with pagination (`.range(from, to)`) and strict page sizes ($\le 50$).
4. **Local Memory Caching:**
   - Cache static configuration, event metadata, and party definitions in memory with reasonable TTLs ($\ge 60$ seconds).

---

## 11. Student Login Critical Path Rules

1. **Minimal Critical Join Path:**
   - Student authentication must only query the single learner row from `learners` and basic event metadata (`id, college_name, event_stage, status, slug`) from `college_events`.
   - Login must **NOT** await Realtime connection, timer state, projector settings, bill state, question lists, or attendance data.
2. **Asynchronous Secondary Hydration:**
   - Secondary portal data (allocation confirmation, personal attendance record) must be loaded non-blockingly *after* the dashboard has successfully rendered.
3. **No Retry Storms:** Login failures must display clear feedback without rapid automated retry loops.

---

## 12. Polling Rules

1. **Realtime-First Architecture:** Always use Supabase Realtime Broadcast or event-driven invalidation.
2. **Polling Constraints:** If periodic fetching is strictly unavoidable:
   - Minimum interval: $\ge 30$ seconds (recommended 60 seconds).
   - **Must** pause when the browser tab is hidden (`document.hidden`).
   - **Must** cancel on component unmount (`clearInterval`).
   - **Must** feature in-flight execution guards (`isFetchingRef`) to prevent overlapping requests.
   - **Never** poll every second to simulate live updates.
