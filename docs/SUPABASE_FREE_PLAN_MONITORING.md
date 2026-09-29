# Supabase Free-Plan Health Monitoring Guide & Early-Warning Playbook

**Status:** Permanent Operational Standard  
**Applies To:** TN Assembly Production System  
**Audience:** Platform Architects, Engineers, AI Agents  

---

## 1. Monitoring Strategy & Conservative Thresholds

On the Supabase Free tier, exhausting quotas or disk I/O budgets causes sudden degradation (project locked to Read-Only mode at 500 MB database size, or severe disk throttling under Nano compute baseline).

To ensure zero downtime and prevent surprises during live assembly events, the application must be monitored against **conservative internal early-warning thresholds**, well before Supabase hard limits are approached.

---

## 2. Key Metrics & Warning Threshold Matrix

| Metric Area | Target Metric | Supabase Free Hard Limit | Application Early Warning Threshold | Critical Escalation Threshold | Recommended Verification Frequency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Database Size** | Total database size (`pg_database_size`) | 500 MB | **250 MB (50%)** | **375 MB (75%)** | Daily / Post-Event |
| **Disk I/O %** | Disk I/O budget consumption | 100% (Burst throttled) | **40% budget used** | **70% budget used** | Real-time during Live Sessions |
| **Disk Throughput** | Read/Write throughput (MB/s) | Baseline ~1–2 MB/s | $> 5$ MB/s sustained | $> 10$ MB/s burst | During Live Sessions |
| **Disk IOPS** | Input/Output Operations Per Second | Baseline low IOPS | $> 50$ IOPS sustained | $> 100$ IOPS | During Live Sessions |
| **Cache Hit Rate** | Shared Buffer Hit Ratio | N/A ($> 90\%$ ideal) | $< 95\%$ | $< 90\%$ | Weekly |
| **Uncached Egress**| Monthly bandwidth out | 5.0 GB / month | **2.5 GB / month** | **4.0 GB / month** | Weekly |
| **Cached Egress** | CDN / Edge cached bandwidth | 5.0 GB / month | **2.5 GB / month** | **4.0 GB / month** | Weekly |
| **Realtime Conns** | Active WebSocket connections | 200 concurrent | **120 connections** | **160 connections** | During Peak Assembly |
| **Realtime Rate** | Broadcast / Presence messages/sec | 100 msgs / sec | **25 msgs / sec** | **50 msgs / sec** | During Voting / Countdown |
| **Realtime Monthly**| Total Realtime messages | 2,000,000 / month | **800,000 / month** | **1,500,000 / month**| Bi-weekly |
| **Active Channels** | Realtime channels per connection | 100 channels | **3 channels / client** | **5 channels / client** | Per client connection audit |
| **API Requests** | PostgREST request frequency | 500k edge/month | $> 50$ req/min per client | $> 100$ req/min | Continuous Client Telemetry |

---

## 3. PostgreSQL SQL Diagnostic Queries

Run these queries in the Supabase SQL Editor to measure and verify database health:

### A. Database Size & Table Disk Usage
```sql
-- Check total database size against 500 MB quota
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS db_size,
    pg_database_size(pg_database.datname) AS db_size_bytes,
    ROUND((pg_database_size(pg_database.datname)::numeric / 524288000.0) * 100, 2) AS pct_of_500mb_quota
FROM pg_database
WHERE pg_database.datname = current_database();

-- Top 10 Largest Tables by Total Disk Usage (including indexes and TOAST)
SELECT 
    schemaname,
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

### B. Shared Buffer Cache Hit Ratio (Should be $\ge 98\%$)
```sql
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit)  as heap_hit,
    ROUND((sum(heap_hit)::numeric / NULLIF(sum(heap_hit) + sum(heap_read), 0)) * 100, 2) as buffer_cache_hit_pct
FROM pg_statio_user_tables;
```

### C. Top Database Writes via `pg_stat_statements`
```sql
SELECT 
    queryid,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    rows,
    shared_blks_written,
    shared_blks_dirtied,
    substr(query, 1, 100) AS query_preview
FROM pg_stat_statements
WHERE query ILIKE '%update%' OR query ILIKE '%insert%' OR query ILIKE '%upsert%'
ORDER BY shared_blks_written DESC
LIMIT 10;
```

### D. Top Database Reads & Execution Times
```sql
SELECT 
    queryid,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
    rows,
    shared_blks_read,
    shared_blks_hit,
    substr(query, 1, 100) AS query_preview
FROM pg_stat_statements
WHERE query ILIKE '%select%'
ORDER BY calls DESC
LIMIT 10;
```

### E. Dead Tuple & Bloat Analysis (Vacuum Efficiency)
```sql
SELECT 
    relname AS table_name,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    ROUND((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_tuple_pct,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;
```

---

## 4. Operational Playbook for Threshold Breaches

### Scenario 1: Database Size Approaches Warning (250 MB)
1. **Diagnosis:** Run query in Section 3.A to identify largest tables. Check whether TOAST tables of `college_events.social_coverage` or `login_records` have accumulated historical snapshots.
2. **Action:**
   - Verify if obsolete temporary snapshots exist in client caches.
   - Run `VACUUM (ANALYZE)` to reclaim space from dead tuples.
   - **Do NOT automatically delete core student votes, elections, or attendance without prior administrative approval.**

### Scenario 2: High Disk I/O or IOPS Throttling Detected
1. **Diagnosis:** Run query in Section 3.C to identify top `shared_blks_written`.
2. **Action:**
   - Check if any client has a recurring `setInterval` calling `saveLiveTimerState` or `syncEventStateToSupabase`.
   - Verify that `areJsonbObjectsEqual` is active and that no-op writes are being suppressed.
   - Ensure PostgreSQL BEFORE UPDATE trigger `trg_suppress_redundant_college_events_update` is installed on `college_events`.

### Scenario 3: Realtime Message Rate Approaches Warning ($> 25$ msg/sec)
1. **Diagnosis:** Inspect active clients. Check whether duplicate broadcasts are being sent (e.g., both `timer_update` and `timer_state_update`).
2. **Action:**
   - Verify that timer countdown seconds are purely in-memory and not triggering broadcasts.
   - Ensure attendance mass updates are batched into a single summary broadcast rather than one broadcast per student.

### Scenario 4: Egress Approaches 2.5 GB / Month
1. **Diagnosis:** Check PostgREST logs in Supabase Dashboard.
2. **Action:**
   - Verify that all queries use `SUPABASE_COLUMNS` narrow column lists.
   - Ensure `session_agenda` and `login_records` do not use `.select('*')`.
   - Ensure student login does not fetch volunteers or jury tables.
