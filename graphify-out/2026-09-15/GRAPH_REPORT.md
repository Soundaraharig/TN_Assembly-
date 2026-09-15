# Graph Report - TN_Assembly-  (2026-09-15)

## Corpus Check
- 137 files · ~193,770 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1130 nodes · 3075 edges · 83 communities (59 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3928b141`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ParticipantsTab.tsx
- package.json
- test_bug_9_systemic_audit.cjs
- AgendaTab.tsx
- Learner
- test_clean_data_and_leadership_sync.cjs
- storageService.ts
- UserRole
- .getEvents
- getEventSlug
- react
- presenceService
- test_bug_10_supabase_writes.cjs
- EventDay
- aws
- App.tsx
- compilerOptions
- Party
- JuryDashboard.tsx
- runAutoAllocation
- test_attendance_409_fix.cjs
- compilerOptions
- test_event_data_integrity.cjs
- storageService
- .sbUpsert
- test_bug_10c_coordinator_save.cjs
- test_routing_logic.js
- .unpackAndApplyEventState
- @supabase/supabase-js
- parse_exact_records.cjs
- test_supabase_attendance_save.js
- db_audit.cjs
- fix_party1_learners.cjs
- parse_storage_clean.cjs
- restore_voting_history.cjs
- verify_question_flow.js
- verify_question_flow.ts
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
- Walkthrough & Verification Report
- parse_active_elections.cjs
- read_chrome_storage.js
- search_leveldb_elections.cjs
- Context
- index.ts
- React + TypeScript + Vite
- diagnose_bugs.cjs
- dump_keys.cjs
- extract_chrome_data.cjs
- investigate_jkkncet_db.cjs
- search_active_chrome.cjs
- search_actual_leveldb.cjs
- sync_legit_event_days.cjs
- sync_to_local.cjs
- test_att_payload.cjs
- test_cols.cjs
- test_rpc.cjs
- test_sync_days.cjs
- test_unknown_col.cjs
- ProceedingsTab.tsx
- print_jkkncet.cjs
- search_elections_leveldb.cjs
- search_utf16_elections.cjs
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 252 edges
2. `Learner` - 87 edges
3. `react` - 53 edges
4. `Party` - 53 edges
5. `lucide-react` - 50 edges
6. `Committee` - 43 edges
7. `CollegeEvent` - 40 edges
8. `@supabase/supabase-js` - 25 edges
9. `EventTabRouteHandlerProps` - 25 edges
10. `UserRole` - 25 edges

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

## Communities (83 total, 19 thin omitted)

### Community 1 - "ParticipantsTab.tsx"
Cohesion: 0.09
Nodes (39): DaysActivitiesTab(), AllocationTab(), CabinetTab(), DEFAULT_CUSTOM_ITEMS, DEFAULT_MINISTRIES, DEFAULT_MINISTRY_ITEMS, DEFAULT_SELECTED_IDS, getStoredCustomMinistries() (+31 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (44): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+36 more)

### Community 3 - "test_bug_9_systemic_audit.cjs"
Cohesion: 0.06
Nodes (43): assert, authenticateCoordinator(), c1Committees, c1Learners, c1Parties, c2Committees, c2Learners, c2Parties (+35 more)

### Community 4 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 5 - "Learner"
Cohesion: 0.26
Nodes (20): EventTabRouteHandlerProps, SuperAdminDashboardProps, StandaloneProjectorDisplayProps, ControlTabProps, CoordinatorDashboardProps, NominationsTabProps, ProjectorTabProps, ReportTabProps (+12 more)

### Community 6 - "test_clean_data_and_leadership_sync.cjs"
Cohesion: 0.07
Nodes (23): assert, CANONICAL_ROLES, cleanRes, cmOppositionRes, cmReassignRes, cmRulingRes, day1, day1Att (+15 more)

### Community 7 - "storageService.ts"
Cohesion: 0.08
Nodes (35): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+27 more)

### Community 8 - "UserRole"
Cohesion: 0.08
Nodes (30): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+22 more)

### Community 10 - "getEventSlug"
Cohesion: 0.23
Nodes (10): storageMap, assert(), runTests(), EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), StudentDashboard(), findEventBySlug() (+2 more)

### Community 11 - "react"
Cohesion: 0.13
Nodes (19): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, OrganizerSignInProps (+11 more)

### Community 12 - "presenceService"
Cohesion: 0.18
Nodes (7): isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, presenceService, PresenceUser

### Community 13 - "test_bug_10_supabase_writes.cjs"
Cohesion: 0.09
Nodes (23): appContent, appPath, assert, cleanCoord, cleanJury, cleanLearner, cleanVol, dirtyCoord (+15 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "App.tsx"
Cohesion: 0.09
Nodes (29): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+21 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "Party"
Cohesion: 0.08
Nodes (44): DaysActivitiesTabProps, AddLearnerModal(), AddLearnerModalProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+36 more)

### Community 19 - "JuryDashboard.tsx"
Cohesion: 0.22
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 20 - "runAutoAllocation"
Cohesion: 0.47
Nodes (6): allocateCommittees(), allocateConstituencies(), allocateParties(), computeAllocationStats(), runAutoAllocation(), shuffleArray()

### Community 21 - "test_attendance_409_fix.cjs"
Cohesion: 0.15
Nodes (10): assert, db, fs, MockDatabase, path, storageContent, storageServicePath, t1() (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "test_event_data_integrity.cjs"
Cohesion: 0.12
Nodes (14): assert, d1, d2, dashboardContent, dashboardPath, fs, migrationContent, migrationPath (+6 more)

### Community 24 - "storageService"
Cohesion: 0.06
Nodes (3): storageService, uid(), LoginRecord

### Community 26 - "test_bug_10c_coordinator_save.cjs"
Cohesion: 0.17
Nodes (11): appPath, appSrc, assert, dashboardPath, dashboardSrc, fs, modalPath, modalSrc (+3 more)

### Community 27 - "test_routing_logic.js"
Cohesion: 0.20
Nodes (11): adminRedirect, coordGuardResult, coordRedirect, delegateGuardResult, delegateRedirect, getEventSlug(), guardEventsRoute(), learnerMatch (+3 more)

### Community 29 - "@supabase/supabase-js"
Cohesion: 0.22
Nodes (5): @supabase/supabase-js, { createClient }, supabase, { createClient }, supabase

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

### Community 36 - "verify_question_flow.js"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedQ

### Community 37 - "verify_question_flow.ts"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedInAdmin

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

### Community 58 - "index.ts"
Cohesion: 0.12
Nodes (18): EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, FeedbackTab(), FeedbackTabProps, QuestionnaireTab(), QuestionnaireTabProps (+10 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

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

### Community 74 - "ProceedingsTab.tsx"
Cohesion: 0.33
Nodes (6): ProceedingsTab(), ProceedingsTabProps, BillProceeding, EventDeadline, ProceedingsMotion, ProceedingsQuestion

## Knowledge Gaps
- **418 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 487 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `.setItem`, `ParticipantsTab.tsx`, `verify_question_flow.js`, `verify_question_flow.ts`, `Learner`, `AgendaTab.tsx`, `UserRole`, `storageService.ts`, `getEventSlug`, `react`, `ProceedingsTab.tsx`, `.getEvents`, `EventDay`, `App.tsx`, `Party`, `.sbUpsert`, `.unpackAndApplyEventState`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `presenceService`, `fix_party1_learners.cjs`, `restore_voting_history.cjs`, `check_ahs.cjs`, `check_all_cabinet.cjs`, `check_cabinet_custom.cjs`, `check_yuva_db.cjs`, `clean_arts_cabinet.cjs`, `clean_yuva_db.cjs`, `fix_ahs_event.cjs`, `inspect_ahs.cjs`, `test_attendance_logic.cjs`, `test_batch_attendance_logic.cjs`, `diagnose_bugs.cjs`, `investigate_jkkncet_db.cjs`, `sync_legit_event_days.cjs`, `test_att_payload.cjs`, `test_cols.cjs`, `test_rpc.cjs`, `test_sync_days.cjs`, `test_unknown_col.cjs`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `ParticipantsTab.tsx`, `package.json`, `AgendaTab.tsx`, `Learner`, `UserRole`, `ProceedingsTab.tsx`, `App.tsx`, `Party`, `JuryDashboard.tsx`, `index.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.13140096618357489 - nodes in this community are weakly interconnected._
- **Should `ParticipantsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08956228956228957 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04541062801932367 - nodes in this community are weakly interconnected._