# AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS

**CRITICAL MANDATE FOR ALL AI AGENTS:**
> "Before changing database, realtime, polling, synchronization, storage, or API code, the agent MUST evaluate Supabase Free-plan impact."
>
> **Every future AI agent must follow these rules without exception.**
> See also the permanent engineering rulebook at [`docs/SUPABASE_FREE_PLAN_GUARDRAILS.md`](./docs/SUPABASE_FREE_PLAN_GUARDRAILS.md) and health monitoring guide at [`docs/SUPABASE_FREE_PLAN_MONITORING.md`](./docs/SUPABASE_FREE_PLAN_MONITORING.md).

---

## 1. The Free-Plan Safety Principle

> **DATABASE IS FOR AUTHORITATIVE PERSISTENT STATE.**  
> **REALTIME IS FOR LIVE DELIVERY.**  
> **LOCAL REACT STATE IS FOR TEMPORARY UI STATE.**  
> **CACHE IS FOR PERFORMANCE ONLY.**  

- Do not use the database as a per-second UI synchronization bus.
- Do not use Realtime as a database replacement.
- Do not use `localStorage` as the authoritative source of truth.
- Do not repeatedly synchronize the same unchanged state between all three.

---

## 2. Mandatory "Free-Plan Safety Check" for AI Agents

Before modifying any database, realtime, polling, synchronization, storage, or API code, the agent **MUST** explicitly answer these 16 questions:

1. **A.** Does this change add a database write?
2. **B.** How often can that write occur?
3. **C.** Does it happen on render / hydration / reconnect / mount?
4. **D.** Does it rewrite JSONB (`social_coverage`)?
5. **E.** Does it add Realtime messages?
6. **F.** How many clients receive them?
7. **G.** Does it add a Realtime channel?
8. **H.** Does it increase egress?
9. **I.** Does it increase database size?
10. **J.** Does it add polling (`setInterval`, recursive `setTimeout`)?
11. **K.** Does it add duplicate requests or concurrent in-flight fetches?
12. **L.** Can stale state overwrite authoritative state?
13. **M.** Does it affect student voting reliability?
14. **N.** Does it affect attendance accuracy?
15. **O.** Does it affect question persistence or Question Hour state?
16. **P.** Does it affect projector, agenda, or timer synchronization?

**The agent MUST NOT implement the change until these questions are thoroughly considered.**

---

## 3. Database Write Budget Rules

**NEVER write to PostgreSQL:**
- On every timer second / tick
- On every React render
- On every `useEffect` execution
- On every Realtime callback
- On every page hydration
- On every reconnect
- On every projector refresh
- On every agenda refresh
- On every component mount
- On every browser tab synchronization event

**For every UPDATE / UPSERT:**
1. Determine whether the persisted value actually changed.
2. Skip no-op writes (use `areJsonbObjectsEqual`).
3. Update only required fields.
4. Do not rewrite large JSONB documents for small changes.
5. Do not update `updated_at` merely because a read/hydration occurred.

---

## 4. `social_coverage` Write Bus Prohibition

`public.college_events.social_coverage` contains multiple application states (proceedings, flash votes, nominations, questions, projector settings, timer state). Treat this as a high-risk write-amplification area.

- **No timer tick writes.**
- **No hydration writes.**
- **No projector refresh writes.**
- **No realtime echo writes.**
- **No repeated identical JSONB updates.**
- **No full `social_coverage` replacement from partial client state.**
- **No unrelated feature may overwrite another feature's JSONB state.**
- **No partial fetch may be treated as a complete authoritative snapshot.**
- **Always preserve the `areJsonbObjectsEqual` no-op check.**

---

## 5. Live Timer Rules

- Timer countdown **MUST** remain primarily client-memory (`setInterval`) + Realtime.
- Do **NOT** write $75 \to 74 \to 73 \dots$ to PostgreSQL every second.
- Persist only meaningful structural transitions: `START`, `PAUSE`, `RESUME`, `RESET`, `EXPIRE`, or `EXPLICIT DURATION CONFIGURATION CHANGE`.
- Timer configuration and live countdown state must remain conceptually separate.
- Changing agenda **MUST NOT** reset/change timer configuration.
- Timer ticks **MUST NOT** modify agenda.
- Broadcast only single `timer_update` events (no duplicate `timer_state_update`).

---

## 6. Agenda Rules

- Agenda reads are strictly **READ-ONLY** on page load, refresh, reconnect, opening Control Room, or opening Projector.
- Only an explicit administrator action changes current agenda.
- Completed and Current statuses are independent. Resetting completed status must not change current agenda.
- No automatic agenda changes from timer expiry, wall clock, hydration, reconnect, or projector events.

---

## 7. Projector Rules

- Projector display state is separate from bill voting, question calling, timer, agenda, and student voting.
- An active bill vote **MUST NOT** automatically force `displayScene = BILL`. Only explicit "SHOW BILL" may project the bill.
- Opening/refreshing projector displays is strictly read-only (zero writes).

---

## 8. Voting & Electoral Integrity Rules

- Voting is transactional and authoritative. Do **NOT** batch student votes in a way that risks losing votes.
- Student "VOTED" state is derived from the student's own verified vote record in `tn_assembly_user_vote_ledger_${eventId}_${studentId}`.
- Never let another student's vote, stale realtime state, partial payload, `localStorage`, or refresh hydration change `VOTED → NOT VOTED` after confirmation.
- Realtime bill broadcasts must strip full vote arrays (`const { votes, ...compactBill } = bill;`) to keep payloads $< 1$ KB.

---

## 9. Realtime Free-Plan Limits & Connection Rules

- **Design Targets:** Operate comfortably below 200 concurrent connections, 100 messages/sec, and 2,000,000 messages/month.
- Use the existing single multiplexed event channel (`tn_assembly_live_${eventId}`).
- Avoid duplicate channels, channel-per-component, channel-per-button, or channel-per-student.
- Every subscription **MUST** have cleanup (`supabase.removeChannel(ch)`) on unmount.
- Do **NOT** use `postgres_changes` for high-frequency synchronization; use Realtime Broadcast.

---

## 10. Egress & Query Rules

- **Never** use `select('*')` when only specific fields are needed. Always use `SUPABASE_COLUMNS`.
- Do not download all learners, all votes, all questions, or all attendance globally on mount or route changes.
- Student login **MUST NOT** fetch volunteers, jury members, or full event attendance.
- Large tables (`login_records`, `learners`) must be paginated with bounded ranges.
- Zero interval polling: Never poll every second. Any background refresh must pause when `document.hidden` is true and have in-flight guards.