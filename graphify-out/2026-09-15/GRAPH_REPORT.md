# Graph Report - TN_Assembly-  (2026-09-14)

## Corpus Check
- 137 files · ~187,682 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1123 nodes · 3044 edges · 90 communities (63 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ab0e447`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- storageService
- CabinetTab.tsx
- package.json
- test_bug_9_systemic_audit.cjs
- AgendaTab.tsx
- index.ts
- test_clean_data_and_leadership_sync.cjs
- storageService.ts
- UserRole
- .getEvents
- lucide-react
- react
- presenceService
- test_bug_10_supabase_writes.cjs
- ElectionsTab
- aws
- App.tsx
- compilerOptions
- Learner
- .recordLogin
- allocationEngine.ts
- test_attendance_409_fix.cjs
- compilerOptions
- test_event_data_integrity.cjs
- .setItem
- .notify
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
- Volunteer
- Walkthrough & Verification Report
- parse_active_elections.cjs
- read_chrome_storage.js
- search_leveldb_elections.cjs
- Context
- ChatMessage
- React + TypeScript + Vite
- MediaTab.tsx
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
- FeedbackEntry
- ParliamentQuestion
- print_jkkncet.cjs
- search_elections_leveldb.cjs
- search_utf16_elections.cjs
- tsconfig.json
- vercel.json
- setup_localStorage.mjs
- EventOverviewTab.tsx
- ScoreGridTab.tsx
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 248 edges
2. `Learner` - 87 edges
3. `react` - 53 edges
4. `Party` - 53 edges
5. `lucide-react` - 50 edges
6. `Committee` - 41 edges
7. `CollegeEvent` - 40 edges
8. `@supabase/supabase-js` - 25 edges
9. `EventTabRouteHandlerProps` - 25 edges
10. `UserRole` - 25 edges

## Surprising Connections (you probably didn't know these)
- `runTests()` --calls--> `findEventBySlug()`  [EXTRACTED]
  scratch/test_multi_event_isolation.mjs → src/utils/slug.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `ActiveNavTab`  [EXTRACTED]
  src/App.tsx → src/components/common/Sidebar.tsx

## Import Cycles
- None detected.

## Communities (90 total, 22 thin omitted)

### Community 1 - "CabinetTab.tsx"
Cohesion: 0.18
Nodes (20): AllocationTab(), CabinetTab(), DEFAULT_CUSTOM_ITEMS, DEFAULT_MINISTRIES, DEFAULT_MINISTRY_ITEMS, DEFAULT_SELECTED_IDS, getStoredCustomMinistries(), MinistryItem (+12 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (44): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+36 more)

### Community 3 - "test_bug_9_systemic_audit.cjs"
Cohesion: 0.06
Nodes (43): assert, authenticateCoordinator(), c1Committees, c1Learners, c1Parties, c2Committees, c2Learners, c2Parties (+35 more)

### Community 4 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 5 - "index.ts"
Cohesion: 0.17
Nodes (29): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ProceedingsTab(), ProceedingsTabProps, ProjectorTabProps (+21 more)

### Community 6 - "test_clean_data_and_leadership_sync.cjs"
Cohesion: 0.07
Nodes (23): assert, CANONICAL_ROLES, cleanRes, cmOppositionRes, cmReassignRes, cmRulingRes, day1, day1Att (+15 more)

### Community 7 - "storageService.ts"
Cohesion: 0.10
Nodes (29): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+21 more)

### Community 8 - "UserRole"
Cohesion: 0.11
Nodes (21): papaparse, SavedAuthSession, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+13 more)

### Community 10 - "lucide-react"
Cohesion: 0.16
Nodes (14): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboardProps (+6 more)

### Community 11 - "react"
Cohesion: 0.14
Nodes (17): react, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard() (+9 more)

### Community 12 - "presenceService"
Cohesion: 0.18
Nodes (7): isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, presenceService, PresenceUser

### Community 13 - "test_bug_10_supabase_writes.cjs"
Cohesion: 0.09
Nodes (23): appContent, appPath, assert, cleanCoord, cleanJury, cleanLearner, cleanVol, dirtyCoord (+15 more)

### Community 14 - "ElectionsTab"
Cohesion: 1.00
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "App.tsx"
Cohesion: 0.11
Nodes (28): react-router-dom, assert(), runTests(), App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession() (+20 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "Learner"
Cohesion: 0.07
Nodes (64): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, AddLearnerModal(), AddLearnerModalProps, AllocationModal(), AllocationModalProps (+56 more)

### Community 19 - ".recordLogin"
Cohesion: 0.50
Nodes (3): detectDeviceType(), getDeviceInfo(), LoginRecord

### Community 20 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 21 - "test_attendance_409_fix.cjs"
Cohesion: 0.15
Nodes (10): assert, db, fs, MockDatabase, path, storageContent, storageServicePath, t1() (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "test_event_data_integrity.cjs"
Cohesion: 0.12
Nodes (14): assert, d1, d2, dashboardContent, dashboardPath, fs, migrationContent, migrationPath (+6 more)

### Community 26 - "test_bug_10c_coordinator_save.cjs"
Cohesion: 0.17
Nodes (11): appPath, appSrc, assert, dashboardPath, dashboardSrc, fs, modalPath, modalSrc (+3 more)

### Community 27 - "test_routing_logic.js"
Cohesion: 0.20
Nodes (11): adminRedirect, coordGuardResult, coordRedirect, delegateGuardResult, delegateRedirect, getEventSlug(), guardEventsRoute(), learnerMatch (+3 more)

### Community 28 - ".getParties"
Cohesion: 0.11
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

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

### Community 52 - "Volunteer"
Cohesion: 0.33
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

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

### Community 58 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 60 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

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

### Community 74 - "FeedbackEntry"
Cohesion: 0.67
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 75 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

## Knowledge Gaps
- **415 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+410 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 484 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CabinetTab.tsx`, `verify_question_flow.js`, `verify_question_flow.ts`, `index.ts`, `AgendaTab.tsx`, `UserRole`, `storageService.ts`, `lucide-react`, `.getCoordinators`, `.getEvents`, `App.tsx`, `Learner`, `.recordLogin`, `Volunteer`, `ScoreGridTab.tsx`, `.setItem`, `.notify`, `.getParties`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `presenceService`, `fix_party1_learners.cjs`, `restore_voting_history.cjs`, `check_ahs.cjs`, `check_all_cabinet.cjs`, `check_cabinet_custom.cjs`, `check_yuva_db.cjs`, `clean_arts_cabinet.cjs`, `clean_yuva_db.cjs`, `fix_ahs_event.cjs`, `inspect_ahs.cjs`, `test_attendance_logic.cjs`, `test_batch_attendance_logic.cjs`, `diagnose_bugs.cjs`, `investigate_jkkncet_db.cjs`, `sync_legit_event_days.cjs`, `test_att_payload.cjs`, `test_cols.cjs`, `test_rpc.cjs`, `test_sync_days.cjs`, `test_unknown_col.cjs`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `CabinetTab.tsx`, `package.json`, `AgendaTab.tsx`, `index.ts`, `UserRole`, `lucide-react`, `FeedbackEntry`, `ParliamentQuestion`, `App.tsx`, `Learner`, `Volunteer`, `EventOverviewTab.tsx`, `ScoreGridTab.tsx`, `ChatMessage`, `MediaTab.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _415 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `storageService` be split into smaller, more focused modules?**
  _Cohesion score 0.10730804810360776 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04541062801932367 - nodes in this community are weakly interconnected._
- **Should `test_bug_9_systemic_audit.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._