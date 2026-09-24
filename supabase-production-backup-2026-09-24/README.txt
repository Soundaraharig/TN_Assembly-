====================================================================
TN ASSEMBLY — EMERGENCY SAFETY BACKUP PACKAGE
====================================================================
Source Project Ref:   svtjphzbuicnirynorlx
Source Project URL:   https://svtjphzbuicnirynorlx.supabase.co
Backup Timestamp:     2026-09-24T11:01:37.026Z
Database Tables:      14
Database Total Rows:  1715
Storage Buckets:      0
Storage Objects:      0
Coordinators Auth:    4
Learner Delegates:    374
Volunteers:           24
Jury Members:         13
====================================================================

1. BACKUP PACKAGE CONTENTS:
- database/
    schema.sql             - Full DDL schema (enums, tables, constraints, indexes, triggers, RLS)
    data.sql               - Complete SQL INSERT statements for all 1,691 rows
    roles.sql              - Cluster roles and standard permission grants
    json-tables/           - Raw JSON exports for each individual database table
- auth/
    coordinators-auth.json - All 4 coordinator accounts with password hashes and emails
    learners-access-codes.json - 374 learner access codes and profile records
    volunteers-access-codes.json - 24 volunteer access codes and phones
    jury-access-codes.json - 13 jury access codes
    auth-audit-report.txt  - Authentication architecture and audit details
- storage/
    storage-audit-report.txt - Storage verification (0 buckets, 0 objects)
- config/
    realtime-inventory.txt - Realtime channels, broadcast topics, and presence config
    functions.txt          - Database functions and procedures
    triggers.txt           - Database triggers
    rls.txt                - Row Level Security policies
    extensions.txt         - Required PostgreSQL extensions
    webhooks.txt           - Webhook configuration inventory
    edge-functions.txt     - Edge functions inventory
- verification/
    data-counts.txt        - Pre-migration baseline entity counts for verification
    database-size.txt      - Database size and payload metrics
    storage-size.txt       - Storage size metrics
    backup-manifest.txt    - SHA-256 checksums of every backup artifact

2. HOW TO VERIFY CHECKSUMS:
In PowerShell:
  cd "c:\Users\sound\Documents\GitHub\TN_Assembly-\supabase-production-backup-2026-09-24"
  Get-FileHash (Get-ChildItem -Recurse -File) -Algorithm SHA256

Compare the output against verification/backup-manifest.txt.

3. HOW TO RESTORE THIS BACKUP TO A NEW SUPABASE PROJECT:
Step A: Execute database/schema.sql in the new project SQL Editor (or via CLI)
Step B: Execute database/roles.sql to ensure proper grants
Step C: Execute database/data.sql in the new project SQL Editor (or via psql)
Step D: Verify counts by comparing new project row counts against verification/data-counts.txt
Step E: Update application VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

4. LIMITATIONS & NOTES:
- Supabase GoTrue Auth (auth.users) internal table is not exposed to PostgREST anon key.
  As detailed in auth/auth-audit-report.txt, the application uses self-contained access codes
  and coordinators credentials, all of which are 100% captured in this backup.
- No production database records were altered, updated, inserted, or deleted during this backup.
