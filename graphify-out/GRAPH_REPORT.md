# Graph Report - TN_Assembly-  (2026-09-19)

## Corpus Check
- 150 files · ~229,621 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1252 nodes · 3466 edges · 107 communities (79 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c0fa821`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Volunteer
- csvHelper.ts
- package.json
- test_bug_9_systemic_audit.cjs
- .getLearners
- index.ts
- test_clean_data_and_leadership_sync.cjs
- storageService.ts
- UserRole
- .getEvents
- CollegeEvent
- ScoreGridTab.tsx
- test_bug_10_supabase_writes.cjs
- check_db.cjs
- aws
- .getItem
- compilerOptions
- Learner
- getEventSlug
- storageService
- test_attendance_409_fix.cjs
- compilerOptions
- test_event_data_integrity.cjs
- ParticipantsTab.tsx
- react
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
- VolunteerDashboard.tsx
- React + TypeScript + Vite
- presenceService
- diagnose_bugs.cjs
- dump_keys.cjs
- extract_chrome_data.cjs
- investigate_jkkncet_db.cjs
- search_active_chrome.cjs
- search_actual_leveldb.cjs
- inspect_learners.cjs
- sync_to_local.cjs
- StudentDashboard.tsx
- import_arts_to_supabase.cjs
- test_rpc.cjs
- test_sync_days.cjs
- AddLearnerModal.tsx
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
- Coordinator
- test_att_payload.cjs
- test_unknown_col.cjs
- Header.tsx
- ProjectorTab.tsx
- presenceService.ts
- ChatMessage
- MediaTab.tsx
- ParliamentQuestion
- TeamMember
- LoginRecord
- setup_localStorage.mjs

## God Nodes (most connected - your core abstractions)
1. `storageService` - 297 edges
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
- `CsvImportModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CsvImportModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (107 total, 23 thin omitted)

### Community 0 - "Volunteer"
Cohesion: 0.27
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

### Community 1 - "csvHelper.ts"
Cohesion: 0.18
Nodes (17): CsvImportModal(), CsvImportModalProps, ImportReportData, DownloadModal(), ReportTab(), ReportTabProps, CSVImportResult, CSVImportStats (+9 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (44): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+36 more)

### Community 3 - "test_bug_9_systemic_audit.cjs"
Cohesion: 0.06
Nodes (43): assert, authenticateCoordinator(), c1Committees, c1Learners, c1Parties, c2Committees, c2Learners, c2Parties (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.11
Nodes (21): EditEventModal(), AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus (+13 more)

### Community 6 - "test_clean_data_and_leadership_sync.cjs"
Cohesion: 0.07
Nodes (23): assert, CANONICAL_ROLES, cleanRes, cmOppositionRes, cmReassignRes, cmRulingRes, day1, day1Att (+15 more)

### Community 7 - "storageService.ts"
Cohesion: 0.13
Nodes (25): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+17 more)

### Community 8 - "UserRole"
Cohesion: 0.13
Nodes (18): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab() (+10 more)

### Community 10 - "CollegeEvent"
Cohesion: 0.20
Nodes (21): EventTabRouteHandlerProps, EditEventModalProps, EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTabProps (+13 more)

### Community 12 - "ScoreGridTab.tsx"
Cohesion: 0.25
Nodes (6): CategoryId, ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

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

### Community 18 - "Learner"
Cohesion: 0.20
Nodes (17): DaysActivitiesTabProps, AllocationModalProps, AnalyticsTabProps, AwardsTabProps, CabinetTabProps, SearchableDelegateSelectProps, CommitteesTabProps, SearchableChairpersonSelectProps (+9 more)

### Community 19 - "getEventSlug"
Cohesion: 0.22
Nodes (14): assert(), runTests(), EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), StandaloneProjectorDisplay(), extractEventFromUrl(), extractEventSlugCandidateFromUrl() (+6 more)

### Community 20 - "storageService"
Cohesion: 0.07
Nodes (3): detectDeviceType(), getDeviceInfo(), storageService

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
Cohesion: 0.27
Nodes (16): AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, getResolvedCommitteeName(), getResolvedLearnerBench() (+8 more)

### Community 25 - "react"
Cohesion: 0.21
Nodes (8): lucide-react, react, OrganizerSignInProps, AllocationModal(), AnalyticsTab(), PartiesTab(), StudentLoginGatewayProps, AcademicYear

### Community 26 - "test_bug_10c_coordinator_save.cjs"
Cohesion: 0.17
Nodes (11): appPath, appSrc, assert, dashboardPath, dashboardSrc, fs, modalPath, modalSrc (+3 more)

### Community 27 - "test_routing_logic.js"
Cohesion: 0.20
Nodes (11): adminRedirect, coordGuardResult, coordRedirect, delegateGuardResult, delegateRedirect, getEventSlug(), guardEventsRoute(), learnerMatch (+3 more)

### Community 28 - ".getParties"
Cohesion: 0.15
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

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

### Community 58 - "VolunteerDashboard.tsx"
Cohesion: 0.14
Nodes (14): DaysActivitiesTab(), EditDayActivitiesModal(), EditDayActivitiesModalProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, DayAttendanceRecord (+6 more)

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

### Community 69 - "StudentDashboard.tsx"
Cohesion: 0.21
Nodes (8): ProceedingsTab(), ProceedingsTabProps, StudentDashboardTab, BillProceeding, EventDeadline, NominationPosition, ProceedingsMotion, ProceedingsQuestion

### Community 70 - "import_arts_to_supabase.cjs"
Cohesion: 0.29
Nodes (5): { createClient }, crypto, fs, path, sb

### Community 73 - "AddLearnerModal.tsx"
Cohesion: 0.23
Nodes (9): AddLearnerModal(), AddLearnerModalProps, AllocationTabProps, EditLearnerModal(), EditLearnerModalProps, TN_CONSTITUENCIES, TNConstituency, BenchType (+1 more)

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
Cohesion: 0.12
Nodes (20): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps (+12 more)

### Community 92 - "verify_question_flow.js"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedQ

### Community 93 - "JuryDashboard.tsx"
Cohesion: 0.22
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 95 - "Coordinator"
Cohesion: 0.26
Nodes (8): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, Coordinator, generateRandomPassword()

### Community 98 - "Header.tsx"
Cohesion: 0.42
Nodes (6): UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, Theme, UserSession

### Community 99 - "ProjectorTab.tsx"
Cohesion: 0.46
Nodes (6): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), LiveTimerState, ProjectorStudioSettings

### Community 100 - "presenceService.ts"
Cohesion: 0.32
Nodes (6): isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, PresenceUser

### Community 101 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 102 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 103 - "ParliamentQuestion"
Cohesion: 0.50
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 104 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

## Knowledge Gaps
- **474 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+469 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 555 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `check_db.cjs`, `fix_party1_learners.cjs`, `restore_voting_history.cjs`, `compare_learners.cjs`, `check_ahs.cjs`, `check_all_cabinet.cjs`, `check_cabinet_custom.cjs`, `check_yuva_db.cjs`, `clean_arts_cabinet.cjs`, `clean_yuva_db.cjs`, `fix_ahs_event.cjs`, `inspect_ahs.cjs`, `test_attendance_logic.cjs`, `test_batch_attendance_logic.cjs`, `test_no_delete_operations.cjs`, `diagnose_bugs.cjs`, `investigate_jkkncet_db.cjs`, `inspect_learners.cjs`, `import_arts_to_supabase.cjs`, `test_rpc.cjs`, `test_sync_days.cjs`, `backup_and_wipe_jkkncet.cjs`, `restore_arts.cjs`, `test_live_event_days.cjs`, `sync_legit_event_days.cjs`, `test_att_payload.cjs`, `test_unknown_col.cjs`, `presenceService.ts`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `storageService` connect `storageService` to `Volunteer`, `csvHelper.ts`, `.getLearners`, `index.ts`, `storageService.ts`, `UserRole`, `.getEvents`, `CollegeEvent`, `.setItem`, `ScoreGridTab.tsx`, `.getItem`, `Learner`, `getEventSlug`, `ParticipantsTab.tsx`, `react`, `.getParties`, `verify_question_flow.ts`, `VolunteerDashboard.tsx`, `StudentDashboard.tsx`, `AddLearnerModal.tsx`, `App.tsx`, `verify_question_flow.js`, `JuryDashboard.tsx`, `ProjectorTab.tsx`, `ChatMessage`, `ParliamentQuestion`, `LoginRecord`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Volunteer`, `csvHelper.ts`, `package.json`, `index.ts`, `UserRole`, `CollegeEvent`, `ScoreGridTab.tsx`, `Learner`, `getEventSlug`, `ParticipantsTab.tsx`, `VolunteerDashboard.tsx`, `StudentDashboard.tsx`, `AddLearnerModal.tsx`, `App.tsx`, `JuryDashboard.tsx`, `Coordinator`, `Header.tsx`, `ProjectorTab.tsx`, `ChatMessage`, `MediaTab.tsx`, `ParliamentQuestion`, `TeamMember`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _474 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04541062801932367 - nodes in this community are weakly interconnected._
- **Should `test_bug_9_systemic_audit.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `.getLearners` be split into smaller, more focused modules?**
  _Cohesion score 0.07019230769230769 - nodes in this community are weakly interconnected._