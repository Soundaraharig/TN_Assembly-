# Graph Report - TN_Assembly-  (2026-09-17)

## Corpus Check
- 150 files · ~224,103 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1232 nodes · 3366 edges · 90 communities (64 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ec1f0628`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .notify
- package.json
- test_bug_9_systemic_audit.cjs
- storageService
- lucide-react
- test_clean_data_and_leadership_sync.cjs
- storageService.ts
- UserRole
- .setItem
- CollegeEvent
- getEventSlug
- ScoreGridTab.tsx
- test_bug_10_supabase_writes.cjs
- check_db.cjs
- aws
- .getParties
- compilerOptions
- Learner
- App.tsx
- test_attendance_409_fix.cjs
- compilerOptions
- test_event_data_integrity.cjs
- Volunteer
- test_bug_10c_coordinator_save.cjs
- test_routing_logic.js
- .getEvents
- @supabase/supabase-js
- parse_exact_records.cjs
- test_supabase_attendance_save.js
- db_audit.cjs
- fix_party1_learners.cjs
- parse_storage_clean.cjs
- restore_voting_history.cjs
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
- index.ts
- React + TypeScript + Vite
- presenceService
- diagnose_bugs.cjs
- dump_keys.cjs
- extract_chrome_data.cjs
- investigate_jkkncet_db.cjs
- search_active_chrome.cjs
- search_actual_leveldb.cjs
- sync_legit_event_days.cjs
- sync_to_local.cjs
- test_att_payload.cjs
- import_arts_to_supabase.cjs
- test_rpc.cjs
- test_sync_days.cjs
- test_unknown_col.cjs
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
- inspect_learners.cjs
- test_live_event_days.cjs
- verify_question_flow.js
- react

## God Nodes (most connected - your core abstractions)
1. `storageService` - 280 edges
2. `Learner` - 89 edges
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (90 total, 21 thin omitted)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (44): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+36 more)

### Community 3 - "test_bug_9_systemic_audit.cjs"
Cohesion: 0.06
Nodes (43): assert, authenticateCoordinator(), c1Committees, c1Learners, c1Parties, c2Committees, c2Learners, c2Parties (+35 more)

### Community 5 - "lucide-react"
Cohesion: 0.18
Nodes (14): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+6 more)

### Community 6 - "test_clean_data_and_leadership_sync.cjs"
Cohesion: 0.07
Nodes (23): assert, CANONICAL_ROLES, cleanRes, cmOppositionRes, cmReassignRes, cmRulingRes, day1, day1Att (+15 more)

### Community 7 - "storageService.ts"
Cohesion: 0.05
Nodes (72): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedInAdmin, AllocationTab() (+64 more)

### Community 8 - "UserRole"
Cohesion: 0.11
Nodes (21): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+13 more)

### Community 10 - "CollegeEvent"
Cohesion: 0.17
Nodes (26): EventTabRouteHandlerProps, EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps (+18 more)

### Community 11 - "getEventSlug"
Cohesion: 0.29
Nodes (8): storageMap, assert(), runTests(), EventSlugOnlyRedirector(), EventTabRouteHandler(), findEventBySlug(), getEventSlug(), slugify()

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

### Community 16 - ".getParties"
Cohesion: 0.15
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "Learner"
Cohesion: 0.10
Nodes (47): AddLearnerModal(), AddLearnerModalProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps, CommitteesTabProps (+39 more)

### Community 19 - "App.tsx"
Cohesion: 0.06
Nodes (39): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps (+31 more)

### Community 21 - "test_attendance_409_fix.cjs"
Cohesion: 0.15
Nodes (10): assert, db, fs, MockDatabase, path, storageContent, storageServicePath, t1() (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "test_event_data_integrity.cjs"
Cohesion: 0.12
Nodes (14): assert, d1, d2, dashboardContent, dashboardPath, fs, migrationContent, migrationPath (+6 more)

### Community 25 - "Volunteer"
Cohesion: 0.29
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

### Community 26 - "test_bug_10c_coordinator_save.cjs"
Cohesion: 0.17
Nodes (11): appPath, appSrc, assert, dashboardPath, dashboardSrc, fs, modalPath, modalSrc (+3 more)

### Community 27 - "test_routing_logic.js"
Cohesion: 0.20
Nodes (11): adminRedirect, coordGuardResult, coordRedirect, delegateGuardResult, delegateRedirect, getEventSlug(), guardEventsRoute(), learnerMatch (+3 more)

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

### Community 58 - "index.ts"
Cohesion: 0.13
Nodes (23): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS (+15 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 60 - "presenceService"
Cohesion: 0.18
Nodes (7): isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, presenceService, PresenceUser

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

### Community 92 - "verify_question_flow.js"
Cohesion: 0.25
Nodes (7): closedDeadline, foundInAdmin, initialDeadline, openDeadline, questionsInAdmin, testQuestion, updatedQ

### Community 95 - "react"
Cohesion: 0.12
Nodes (18): react, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, COMM_STEPS, CONDUCT_STEPS (+10 more)

## Knowledge Gaps
- **473 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+468 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 553 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `check_db.cjs`, `fix_party1_learners.cjs`, `restore_voting_history.cjs`, `compare_learners.cjs`, `check_ahs.cjs`, `check_all_cabinet.cjs`, `check_cabinet_custom.cjs`, `check_yuva_db.cjs`, `clean_arts_cabinet.cjs`, `clean_yuva_db.cjs`, `fix_ahs_event.cjs`, `inspect_ahs.cjs`, `test_attendance_logic.cjs`, `test_batch_attendance_logic.cjs`, `test_no_delete_operations.cjs`, `presenceService`, `diagnose_bugs.cjs`, `investigate_jkkncet_db.cjs`, `sync_legit_event_days.cjs`, `test_att_payload.cjs`, `import_arts_to_supabase.cjs`, `test_rpc.cjs`, `test_sync_days.cjs`, `test_unknown_col.cjs`, `backup_and_wipe_jkkncet.cjs`, `restore_arts.cjs`, `inspect_learners.cjs`, `test_live_event_days.cjs`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Why does `storageService` connect `storageService` to `.notify`, `.getEventDays`, `lucide-react`, `storageService.ts`, `UserRole`, `.setItem`, `CollegeEvent`, `getEventSlug`, `ScoreGridTab.tsx`, `.getEvents`, `.getParties`, `Learner`, `App.tsx`, `Volunteer`, `index.ts`, `verify_question_flow.js`, `react`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `lucide-react`, `storageService.ts`, `UserRole`, `CollegeEvent`, `ScoreGridTab.tsx`, `Learner`, `App.tsx`, `Volunteer`, `index.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _473 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.notify` be split into smaller, more focused modules?**
  _Cohesion score 0.12580943570767808 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04541062801932367 - nodes in this community are weakly interconnected._
- **Should `test_bug_9_systemic_audit.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._