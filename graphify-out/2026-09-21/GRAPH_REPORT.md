# Graph Report - TN_Assembly-  (2026-09-21)

## Corpus Check
- 155 files · ~239,117 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1283 nodes · 3534 edges · 102 communities (72 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `64bc053e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- allocationEngine.ts
- package.json
- test_bug_9_systemic_audit.cjs
- .getLearners
- index.ts
- test_clean_data_and_leadership_sync.cjs
- storageService.ts
- UserRole
- EventDay
- CsvImportModal.tsx
- test_bug_10_supabase_writes.cjs
- check_db.cjs
- aws
- storageService
- compilerOptions
- AgendaItem
- App.tsx
- Volunteer
- test_attendance_409_fix.cjs
- compilerOptions
- test_event_data_integrity.cjs
- presenceService
- ParticipantsTab.tsx
- test_bug_10c_coordinator_save.cjs
- test_routing_logic.js
- .getParties
- getEventSlug
- parse_exact_records.cjs
- test_supabase_attendance_save.js
- db_audit.cjs
- fix_party1_learners.cjs
- parse_storage_clean.cjs
- restore_voting_history.cjs
- @supabase/supabase-js
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
- lucide-react
- React + TypeScript + Vite
- ElectionsTab.tsx
- diagnose_bugs.cjs
- dump_keys.cjs
- extract_chrome_data.cjs
- investigate_jkkncet_db.cjs
- search_active_chrome.cjs
- search_actual_leveldb.cjs
- inspect_learners.cjs
- sync_to_local.cjs
- test_rpc.cjs
- import_arts_to_supabase.cjs
- AgendaTab.tsx
- test_sync_days.cjs
- MediaTab.tsx
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
- JuryDashboard.tsx
- test_live_event_days.cjs
- verify_question_flow.js
- test_score_grid_logic.mjs
- react
- sync_legit_event_days.cjs
- test_att_payload.cjs
- dump_13_scores.mjs
- inspect_scores.mjs
- test_unknown_col.cjs
- ParliamentQuestion

## God Nodes (most connected - your core abstractions)
1. `storageService` - 300 edges
2. `Learner` - 92 edges
3. `Party` - 57 edges
4. `react` - 53 edges
5. `lucide-react` - 50 edges
6. `Committee` - 47 edges
7. `CollegeEvent` - 44 edges
8. `@supabase/supabase-js` - 34 edges
9. `getEventSlug()` - 28 edges
10. `AgendaItem` - 27 edges

## Surprising Connections (you probably didn't know these)
- `runTests()` --calls--> `processUpdateRows()`  [EXTRACTED]
  test_update_scenarios.ts → src/utils/csvUpdateHelper.ts
- `runTests()` --calls--> `findEventBySlug()`  [EXTRACTED]
  scratch/test_multi_event_isolation.mjs → src/utils/slug.ts
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (102 total, 23 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.10
Nodes (35): AddLearnerModal(), AddLearnerModalProps, AllocationModalProps, AllocationTabProps, AwardsTabProps, CabinetTabProps, SearchableDelegateSelectProps, CommitteesTabProps (+27 more)

### Community 1 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "test_bug_9_systemic_audit.cjs"
Cohesion: 0.06
Nodes (43): assert, authenticateCoordinator(), c1Committees, c1Learners, c1Parties, c2Committees, c2Learners, c2Parties (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.16
Nodes (22): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ParticipantsTabProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard() (+14 more)

### Community 6 - "test_clean_data_and_leadership_sync.cjs"
Cohesion: 0.07
Nodes (23): assert, CANONICAL_ROLES, cleanRes, cmOppositionRes, cmReassignRes, cmRulingRes, day1, day1Att (+15 more)

### Community 7 - "storageService.ts"
Cohesion: 0.10
Nodes (30): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+22 more)

### Community 8 - "UserRole"
Cohesion: 0.11
Nodes (22): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab() (+14 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (20): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+12 more)

### Community 13 - "test_bug_10_supabase_writes.cjs"
Cohesion: 0.09
Nodes (23): appContent, appPath, assert, cleanCoord, cleanJury, cleanLearner, cleanVol, dirtyCoord (+15 more)

### Community 14 - "check_db.cjs"
Cohesion: 0.20
Nodes (8): { createClient }, env, fs, key, keyMatch, supabase, url, urlMatch

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "AgendaItem"
Cohesion: 0.21
Nodes (18): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProceedingsTab(), ProceedingsTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps (+10 more)

### Community 19 - "App.tsx"
Cohesion: 0.09
Nodes (31): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps (+23 more)

### Community 20 - "Volunteer"
Cohesion: 0.16
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 21 - "test_attendance_409_fix.cjs"
Cohesion: 0.15
Nodes (10): assert, db, fs, MockDatabase, path, storageContent, storageServicePath, t1() (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "test_event_data_integrity.cjs"
Cohesion: 0.12
Nodes (14): assert, d1, d2, dashboardContent, dashboardPath, fs, migrationContent, migrationPath (+6 more)

### Community 24 - "presenceService"
Cohesion: 0.18
Nodes (7): isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, presenceService, PresenceUser

### Community 25 - "ParticipantsTab.tsx"
Cohesion: 0.27
Nodes (16): AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, getResolvedCommitteeName(), getResolvedLearnerBench() (+8 more)

### Community 26 - "test_bug_10c_coordinator_save.cjs"
Cohesion: 0.17
Nodes (11): appPath, appSrc, assert, dashboardPath, dashboardSrc, fs, modalPath, modalSrc (+3 more)

### Community 27 - "test_routing_logic.js"
Cohesion: 0.20
Nodes (11): adminRedirect, coordGuardResult, coordRedirect, delegateGuardResult, delegateRedirect, getEventSlug(), guardEventsRoute(), learnerMatch (+3 more)

### Community 28 - ".getParties"
Cohesion: 0.10
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 29 - "getEventSlug"
Cohesion: 0.21
Nodes (11): storageMap, assert(), runTests(), EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), StudentDashboard(), ProceedingsQuestion (+3 more)

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

### Community 36 - "@supabase/supabase-js"
Cohesion: 0.12
Nodes (9): @supabase/supabase-js, { createClient }, sb, { createClient }, supabase, { createClient }, sb, { createClient } (+1 more)

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

### Community 58 - "lucide-react"
Cohesion: 0.17
Nodes (7): lucide-react, OrganizerSignInProps, AllocationModal(), AnalyticsTab(), AnalyticsTabProps, PartiesTab(), StudentLoginGatewayProps

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 60 - "ElectionsTab.tsx"
Cohesion: 0.42
Nodes (8): CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), ElectionCandidate, FlashVoteAudience

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

### Community 71 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 73 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

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

### Community 90 - "JuryDashboard.tsx"
Cohesion: 0.10
Nodes (21): UnifiedLoginPage(), UnifiedLoginPageProps, CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps (+13 more)

### Community 92 - "verify_question_flow.js"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedQ

### Community 95 - "react"
Cohesion: 0.15
Nodes (19): react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, EventOverviewTab() (+11 more)

### Community 101 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

## Knowledge Gaps
- **485 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+480 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 569 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `check_db.cjs`, `presenceService`, `fix_party1_learners.cjs`, `restore_voting_history.cjs`, `compare_learners.cjs`, `check_ahs.cjs`, `check_all_cabinet.cjs`, `check_cabinet_custom.cjs`, `check_yuva_db.cjs`, `clean_arts_cabinet.cjs`, `clean_yuva_db.cjs`, `fix_ahs_event.cjs`, `inspect_ahs.cjs`, `test_attendance_logic.cjs`, `test_batch_attendance_logic.cjs`, `test_no_delete_operations.cjs`, `diagnose_bugs.cjs`, `investigate_jkkncet_db.cjs`, `inspect_learners.cjs`, `test_rpc.cjs`, `import_arts_to_supabase.cjs`, `test_sync_days.cjs`, `backup_and_wipe_jkkncet.cjs`, `restore_arts.cjs`, `test_live_event_days.cjs`, `sync_legit_event_days.cjs`, `test_att_payload.cjs`, `test_unknown_col.cjs`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **Why does `storageService` connect `storageService` to `Learner`, `.getLearners`, `index.ts`, `storageService.ts`, `UserRole`, `EventDay`, `.getEvents`, `.setItem`, `CsvImportModal.tsx`, `AgendaItem`, `App.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `.getParties`, `getEventSlug`, `verify_question_flow.ts`, `lucide-react`, `ElectionsTab.tsx`, `AgendaTab.tsx`, `JuryDashboard.tsx`, `verify_question_flow.js`, `.getScores`, `react`, `ParliamentQuestion`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `lucide-react`, `index.ts`, `ParliamentQuestion`, `AgendaTab.tsx`, `UserRole`, `MediaTab.tsx`, `CsvImportModal.tsx`, `AgendaItem`, `App.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `JuryDashboard.tsx`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _485 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.1014799154334038 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `test_bug_9_systemic_audit.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._