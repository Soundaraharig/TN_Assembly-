# AGENTS.md — Repository AI Agent Instructions

**PERMANENT MANDATE FOR ALL AI CODING AGENTS:**
> "Before changing database, realtime, polling, synchronization, storage, or API code, the agent MUST evaluate Supabase Free-plan impact."
>
> Every future AI agent must follow these rules. Do NOT violate or bypass these guardrails.
>
> Authoritative Rulebooks:
> 1. Engineering Guardrails: [`docs/SUPABASE_FREE_PLAN_GUARDRAILS.md`](./docs/SUPABASE_FREE_PLAN_GUARDRAILS.md)
> 2. Health Monitoring: [`docs/SUPABASE_FREE_PLAN_MONITORING.md`](./docs/SUPABASE_FREE_PLAN_MONITORING.md)
> 3. Master Agent Rules: [`AGENT_RULES.md`](./AGENT_RULES.md)

---

## The Free-Plan Safety Principle

> **DATABASE IS FOR AUTHORITATIVE PERSISTENT STATE.**  
> **REALTIME IS FOR LIVE DELIVERY.**  
> **LOCAL REACT STATE IS FOR TEMPORARY UI STATE.**  
> **CACHE IS FOR PERFORMANCE ONLY.**  

- Do not use the database as a per-second UI synchronization bus.
- Do not use Realtime as a database replacement.
- Do not use `localStorage` as the authoritative source of truth.
- Do not repeatedly synchronize the same unchanged state between all three.

---

## Free-Plan Safety Checklist (Must Answer Before Any Edit)

Before modifying any database, realtime, polling, synchronization, storage, or API code, the agent **MUST** evaluate:

1. **A.** Does this add a database write?
2. **B.** How often can that write occur?
3. **C.** Does it happen on render / hydration / reconnect / mount?
4. **D.** Does it rewrite JSONB (`social_coverage`)?
5. **E.** Does it add Realtime messages?
6. **F.** How many clients receive them?
7. **G.** Does it add a Realtime channel?
8. **H.** Does it increase egress?
9. **I.** Does it increase database size?
10. **J.** Does it add polling?
11. **K.** Does it add duplicate requests?
12. **L.** Can stale state overwrite authoritative state?
13. **M.** Does it affect student voting reliability?
14. **N.** Does it affect attendance?
15. **O.** Does it affect question persistence?
16. **P.** Does it affect projector / agenda / timer synchronization?

**The agent MUST NOT implement the change until these questions are considered.**

---

## Key Operating Rules at a Glance

1. **Database Writes:** Never write on timer tick, render, hydration, reconnect, projector refresh, agenda refresh, or tab storage events. Skip no-op writes using `areJsonbObjectsEqual`.
2. **`social_coverage` Protection:** Compare candidate JSONB with existing remote state before writing. If semantically identical, skip the write.
3. **Timer:** Live countdown is client memory + Realtime only ($75 \to 74 \to 73 \dots$). Persist only transitions (`START`, `PAUSE`, `RESUME`, `RESET`, `EXPIRE`).
4. **Agenda:** Reads are read-only. Only explicit admin action modifies active agenda. Completed and current are independent.
5. **Projector:** Display scenes are decoupled from voting, questions, timer, agenda, and student voting.
6. **Voting:** Authoritative, transactional, and non-lossy. Student voted state is derived from verified vote ledger and never flickers back to `NOT VOTED`.
7. **Realtime Channels:** Single multiplexed channel per event (`tn_assembly_live_${eventId}`). Clean up subscriptions on unmount.
8. **Egress:** Never use `select('*')`. Query narrow columns with `SUPABASE_COLUMNS`. Paginate large tables.
