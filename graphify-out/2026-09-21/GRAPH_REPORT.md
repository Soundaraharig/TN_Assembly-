# Graph Report - TN_Assembly-  (2026-09-21)

## Corpus Check
- 152 files · ~232,803 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1263 nodes · 3483 edges · 101 communities (71 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7bada920`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .authenticateAccessCodeAsync
- csvHelper.ts
- package.json
- test_bug_9_systemic_audit.cjs
- .setItem
- index.ts
- test_clean_data_and_leadership_sync.cjs
- storageService.ts
- VolunteersTab.tsx
- .getActiveEventId
- Learner
- ScoreGridTab.tsx
- test_bug_10_supabase_writes.cjs
- check_db.cjs
- aws
- storageService
- compilerOptions
- Party
- getEventSlug
- devDependencies
- test_attendance_409_fix.cjs
- compilerOptions
- test_event_data_integrity.cjs
- ParticipantsTab.tsx
- dependencies
- test_bug_10c_coordinator_save.cjs
- test_routing_logic.js
- .getParties
- @supabase/supabase-js
- parse_exact_records.cjs
- test_supabase_attendance_save.js
- db_audit.cjs
- fix_party1_learners.cjs
- parse_storage_clean.cjs
- restore_voting_history.cjs
- allocationEngine.ts
- verify_question_flow.ts
- compare_learners.cjs
- check_ahs.cjs
- check_all_cabinet.cjs
- check_cabinet_custom.cjs
- check_yuva_db.cjs
- clean_arts_cabinet.cjs
- clean_yuva_db.cjs
- fix_ahs_event.cjs
- inspect_ahs.cjs
- .oxlintrc.json
- parse_utf16.cjs
- read_profile1_elections.cjs
- test_attendance_logic.cjs
- test_batch_attendance_logic.cjs
- test_no_delete_operations.cjs
- Walkthrough & Verification Report
- parse_active_elections.cjs
- read_chrome_storage.js
- search_leveldb_elections.cjs
- Context
- React + TypeScript + Vite
- CsvImportModal.tsx
- diagnose_bugs.cjs
- dump_keys.cjs
- extract_chrome_data.cjs
- investigate_jkkncet_db.cjs
- search_active_chrome.cjs
- search_actual_leveldb.cjs
- inspect_learners.cjs
- sync_to_local.cjs
- import_arts_to_supabase.cjs
- test_rpc.cjs
- test_sync_days.cjs
- scripts
- AGENT_RULES.md
- merge_arts_csv.cjs
- print_jkkncet.cjs
- search_elections_leveldb.cjs
- search_utf16_elections.cjs
- tsconfig.json
- vercel.json
- parse_chrome_learners.cjs
- backup_and_wipe_jkkncet.cjs
- restore_arts.cjs
- rules/graphify.md
- workflows/graphify.md
- App.tsx
- test_live_event_days.cjs
- verify_question_flow.js
- JuryDashboard.tsx
- sync_legit_event_days.cjs
- react
- test_att_payload.cjs
- test_unknown_col.cjs
- dump_13_scores.mjs
- inspect_scores.mjs
- LoginRecord

## God Nodes (most connected - your core abstractions)
1. `storageService` - 299 edges
2. `Learner` - 90 edges
3. `react` - 53 edges
4. `Party` - 53 edges
5. `lucide-react` - 50 edges
6. `CollegeEvent` - 44 edges
7. `Committee` - 43 edges
8. `@supabase/supabase-js` - 34 edges
9. `getEventSlug()` - 28 edges
10. `AgendaItem` - 27 edges

## Surprising Connections (you probably didn't know these)
- `runTests()` --calls--> `findEventBySlug()`  [EXTRACTED]
  scratch/test_multi_event_isolation.mjs → src/utils/slug.ts
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (101 total, 23 thin omitted)

### Community 1 - "csvHelper.ts"
Cohesion: 0.23
Nodes (13): papaparse, xlsx, ReportTab(), generateAccessCode(), CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData() (+5 more)

### Community 2 - "package.json"
Cohesion: 0.12
Nodes (17): name, private, type, version, jspdf, oxlint, @playwright/test, react-dom (+9 more)

### Community 3 - "test_bug_9_systemic_audit.cjs"
Cohesion: 0.06
Nodes (43): assert, authenticateCoordinator(), c1Committees, c1Learners, c1Parties, c2Committees, c2Learners, c2Parties (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.10
Nodes (24): EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory (+16 more)

### Community 6 - "test_clean_data_and_leadership_sync.cjs"
Cohesion: 0.07
Nodes (23): assert, CANONICAL_ROLES, cleanRes, cmOppositionRes, cmReassignRes, cmRulingRes, day1, day1Att (+15 more)

### Community 7 - "storageService.ts"
Cohesion: 0.08
Nodes (42): EventTabRouteHandlerProps, ProceedingsTab(), ProceedingsTabProps, ReportTabProps, ScoreGridTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST (+34 more)

### Community 8 - "VolunteersTab.tsx"
Cohesion: 0.09
Nodes (23): ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+15 more)

### Community 10 - "Learner"
Cohesion: 0.26
Nodes (19): StandaloneProjectorDisplayProps, ControlTabProps, CoordinatorDashboardProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, NominationsTabProps, ProjectorTabProps, JuryDashboardProps (+11 more)

### Community 12 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, SummaryScoreRow, ScoringSession

### Community 13 - "test_bug_10_supabase_writes.cjs"
Cohesion: 0.09
Nodes (23): appContent, appPath, assert, cleanCoord, cleanJury, cleanLearner, cleanVol, dirtyCoord (+15 more)

### Community 14 - "check_db.cjs"
Cohesion: 0.20
Nodes (8): { createClient }, env, fs, key, keyMatch, supabase, url, urlMatch

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "storageService"
Cohesion: 0.05
Nodes (3): storageService, uid(), SecurityAuditLog

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "Party"
Cohesion: 0.12
Nodes (32): lucide-react, DaysActivitiesTab(), DaysActivitiesTabProps, AddLearnerModal(), AddLearnerModalProps, AgendaTab(), AllocationModal(), AllocationModalProps (+24 more)

### Community 19 - "getEventSlug"
Cohesion: 0.10
Nodes (27): storageMap, assert(), runTests(), App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession() (+19 more)

### Community 20 - "devDependencies"
Cohesion: 0.17
Nodes (12): devDependencies, oxlint, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse, @types/react (+4 more)

### Community 21 - "test_attendance_409_fix.cjs"
Cohesion: 0.15
Nodes (10): assert, db, fs, MockDatabase, path, storageContent, storageServicePath, t1() (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "test_event_data_integrity.cjs"
Cohesion: 0.12
Nodes (14): assert, d1, d2, dashboardContent, dashboardPath, fs, migrationContent, migrationPath (+6 more)

### Community 24 - "ParticipantsTab.tsx"
Cohesion: 0.10
Nodes (26): AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatConstituencyName(), matchesLearnerConstituency() (+18 more)

### Community 25 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 26 - "test_bug_10c_coordinator_save.cjs"
Cohesion: 0.17
Nodes (11): appPath, appSrc, assert, dashboardPath, dashboardSrc, fs, modalPath, modalSrc (+3 more)

### Community 27 - "test_routing_logic.js"
Cohesion: 0.20
Nodes (11): adminRedirect, coordGuardResult, coordRedirect, delegateGuardResult, delegateRedirect, getEventSlug(), guardEventsRoute(), learnerMatch (+3 more)

### Community 28 - ".getParties"
Cohesion: 0.17
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 29 - "@supabase/supabase-js"
Cohesion: 0.12
Nodes (9): @supabase/supabase-js, { createClient }, sb, { createClient }, supabase, { createClient }, sb, { createClient } (+1 more)

### Community 30 - "parse_exact_records.cjs"
Cohesion: 0.22
Nodes (7): attRes, coordRes, edRes, evRes, files, fs, lrRes

### Community 31 - "test_supabase_attendance_save.js"
Cohesion: 0.31
Nodes (8): clientAttendanceRecords, memoryStore, mockSupabase, runTests(), saveDayAttendanceToSupabase(), setStudentDayAttendance(), simulatePageRefresh(), supabaseDatabase

### Community 32 - "db_audit.cjs"
Cohesion: 0.25
Nodes (7): envPath, fs, lines, path, schemaPath, storageContent, storageServicePath

### Community 33 - "fix_party1_learners.cjs"
Cohesion: 0.25
Nodes (6): { createClient }, envContent, fs, key, supabase, url

### Community 34 - "parse_storage_clean.cjs"
Cohesion: 0.25
Nodes (6): attendance, eventDays, events, files, fs, learners

### Community 35 - "restore_voting_history.cjs"
Cohesion: 0.25
Nodes (6): { createClient }, envContent, fs, key, supabase, url

### Community 36 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 37 - "verify_question_flow.ts"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedInAdmin

### Community 38 - "compare_learners.cjs"
Cohesion: 0.20
Nodes (8): buf, chromeLearners, { createClient }, fs, idx, rawStr, sb, startBracket

### Community 39 - "check_ahs.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 40 - "check_all_cabinet.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 41 - "check_cabinet_custom.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 42 - "check_yuva_db.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 43 - "clean_arts_cabinet.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 44 - "clean_yuva_db.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 45 - "fix_ahs_event.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 46 - "inspect_ahs.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, env, envFile, fs, supabase

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 48 - "parse_utf16.cjs"
Cohesion: 0.33
Nodes (5): acPos, buf, fs, pos, s16

### Community 49 - "read_profile1_elections.cjs"
Cohesion: 0.33
Nodes (5): buf, fs, jsonStart, slice, str

### Community 50 - "test_attendance_logic.cjs"
Cohesion: 0.40
Nodes (4): assert, { createClient }, runTest(), supabase

### Community 51 - "test_batch_attendance_logic.cjs"
Cohesion: 0.40
Nodes (4): assert, { createClient }, runBatchTest(), supabase

### Community 52 - "test_no_delete_operations.cjs"
Cohesion: 0.20
Nodes (8): { createClient }, env, fs, key, keyMatch, supabase, url, urlMatch

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 54 - "parse_active_elections.cjs"
Cohesion: 0.40
Nodes (3): files, fs, path

### Community 55 - "read_chrome_storage.js"
Cohesion: 0.40
Nodes (4): fs, path, profiles, results

### Community 56 - "search_leveldb_elections.cjs"
Cohesion: 0.40
Nodes (3): fs, path, targetFiles

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 60 - "CsvImportModal.tsx"
Cohesion: 0.38
Nodes (6): CsvImportModal(), CsvImportModalProps, ImportReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile()

### Community 62 - "dump_keys.cjs"
Cohesion: 0.50
Nodes (3): buf, fs, target

### Community 63 - "extract_chrome_data.cjs"
Cohesion: 0.50
Nodes (3): filesToCheck, fs, path

### Community 65 - "search_active_chrome.cjs"
Cohesion: 0.50
Nodes (3): fs, path, profiles

### Community 66 - "search_actual_leveldb.cjs"
Cohesion: 0.50
Nodes (3): fs, levelDirs, path

### Community 68 - "sync_to_local.cjs"
Cohesion: 0.67
Nodes (3): fs, path, sync()

### Community 70 - "import_arts_to_supabase.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, crypto, fs, path, sb

### Community 73 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 75 - "merge_arts_csv.cjs"
Cohesion: 0.29
Nodes (6): dir, files, fs, mergedLines, mergedPath, path

### Community 85 - "parse_chrome_learners.cjs"
Cohesion: 0.29
Nodes (6): buf, fs, idx, rawStr, startBracket, validLearners

### Community 86 - "backup_and_wipe_jkkncet.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, sb

### Community 87 - "restore_arts.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, fs, path, sb

### Community 90 - "App.tsx"
Cohesion: 0.08
Nodes (22): react-router-dom, SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab, ToastContainer(), ToastMessage, ToastProps (+14 more)

### Community 92 - "verify_question_flow.js"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedQ

### Community 93 - "JuryDashboard.tsx"
Cohesion: 0.24
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 95 - "react"
Cohesion: 0.11
Nodes (21): react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, OrganizerSignInProps (+13 more)

## Knowledge Gaps
- **477 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+472 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 560 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `check_db.cjs`, `ParticipantsTab.tsx`, `fix_party1_learners.cjs`, `restore_voting_history.cjs`, `compare_learners.cjs`, `check_ahs.cjs`, `check_all_cabinet.cjs`, `check_cabinet_custom.cjs`, `check_yuva_db.cjs`, `clean_arts_cabinet.cjs`, `clean_yuva_db.cjs`, `fix_ahs_event.cjs`, `inspect_ahs.cjs`, `test_attendance_logic.cjs`, `test_batch_attendance_logic.cjs`, `test_no_delete_operations.cjs`, `diagnose_bugs.cjs`, `investigate_jkkncet_db.cjs`, `inspect_learners.cjs`, `import_arts_to_supabase.cjs`, `test_rpc.cjs`, `test_sync_days.cjs`, `backup_and_wipe_jkkncet.cjs`, `restore_arts.cjs`, `test_live_event_days.cjs`, `sync_legit_event_days.cjs`, `test_att_payload.cjs`, `test_unknown_col.cjs`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **Why does `storageService` connect `storageService` to `.authenticateAccessCodeAsync`, `.setItem`, `index.ts`, `storageService.ts`, `VolunteersTab.tsx`, `.getActiveEventId`, `Learner`, `.notify`, `ScoreGridTab.tsx`, `Party`, `getEventSlug`, `ParticipantsTab.tsx`, `.getParties`, `verify_question_flow.ts`, `.getEventDays`, `CsvImportModal.tsx`, `.addNomination`, `App.tsx`, `verify_question_flow.js`, `JuryDashboard.tsx`, `react`, `LoginRecord`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `index.ts`, `storageService.ts`, `VolunteersTab.tsx`, `Learner`, `ScoreGridTab.tsx`, `Party`, `getEventSlug`, `ParticipantsTab.tsx`, `App.tsx`, `CsvImportModal.tsx`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11695906432748537 - nodes in this community are weakly interconnected._
- **Should `test_bug_9_systemic_audit.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.09325396825396826 - nodes in this community are weakly interconnected._