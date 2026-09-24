# Graph Report - TN_Assembly-  (2026-09-24)

## Corpus Check
- 95 files · ~226,181 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 857 nodes · 3328 edges · 51 communities (36 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37ec21d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- index.ts
- package.json
- presenceService.ts
- .setItem
- EventDay
- JuryMember
- presenceService
- csvHelper.ts
- storageService.ts
- ElectionsTab.tsx
- CsvImportModal.tsx
- VolunteerDashboard.tsx
- App.tsx
- aws
- .getLearners
- compilerOptions
- CollegeEvent
- MediaTab.tsx
- UserRole
- Toast.tsx
- compilerOptions
- ScoreGridTab.tsx
- JuryDashboard.tsx
- .performSyncEventStateToSupabase
- Header.tsx
- AllocationTab.tsx
- .getItem
- storageService
- StudentDashboard.tsx
- AgendaTab.tsx
- allocationEngine.ts
- getEventSlug
- .getActiveEventId
- test_vote_lifecycle.cjs
- ElectionsTab
- ParliamentQuestion
- LoginRecord
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- react
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 329 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 57 edges
5. `lucide-react` - 54 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 46 edges
8. `UserRole` - 27 edges
9. `AgendaItem` - 27 edges
10. `getEventSlug()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `ChatTabProps` --references--> `ChatMessage`  [EXTRACTED]
  src/components/coordinator/ChatTab.tsx → src/types/index.ts
- `FeedbackTabProps` --references--> `FeedbackEntry`  [EXTRACTED]
  src/components/coordinator/FeedbackTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (51 total, 12 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.17
Nodes (22): lucide-react, DaysActivitiesTabProps, AllocationModal(), AllocationModalProps, AnalyticsTab(), AnalyticsTabProps, AwardsTabProps, CabinetTabProps (+14 more)

### Community 1 - "index.ts"
Cohesion: 0.10
Nodes (21): runAuditAndLifecycleTests(), store, ProceedingsTabProps, AggregatedScore, AssemblyElection, BillProceeding, BillVotingStatus, ElectionBackupSnapshot (+13 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "presenceService.ts"
Cohesion: 0.31
Nodes (7): @supabase/supabase-js, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, PresenceUser

### Community 5 - "EventDay"
Cohesion: 0.19
Nodes (5): EditDayActivitiesModal(), EditDayActivitiesModalProps, EventDay, getRecordSessionStatuses(), STANDARD_TN_ACTIVITIES

### Community 6 - "JuryMember"
Cohesion: 0.31
Nodes (4): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember

### Community 8 - "csvHelper.ts"
Cohesion: 0.16
Nodes (18): AddLearnerModal(), AddLearnerModalProps, DownloadModal(), DownloadModalProps, TN_CONSTITUENCIES, TNConstituency, generateAccessCode(), CSVImportResult (+10 more)

### Community 9 - "storageService.ts"
Cohesion: 0.10
Nodes (30): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+22 more)

### Community 10 - "ElectionsTab.tsx"
Cohesion: 0.29
Nodes (8): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, BillVote, ElectionCandidate, FlashVoteAudience, Nomination

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (20): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile() (+12 more)

### Community 13 - "VolunteerDashboard.tsx"
Cohesion: 0.29
Nodes (11): EventTabRouteHandlerProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), VolunteerDashboardProps, YuvaAssignment, ChecklistItem, DayAttendanceRecord (+3 more)

### Community 14 - "App.tsx"
Cohesion: 0.12
Nodes (23): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), ActiveNavTab, Sidebar() (+15 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.31
Nodes (13): EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps, AgendaItem (+5 more)

### Community 19 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 20 - "UserRole"
Cohesion: 0.12
Nodes (21): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab() (+13 more)

### Community 21 - "Toast.tsx"
Cohesion: 0.40
Nodes (3): ToastContainer(), ToastMessage, ToastProps

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 24 - "JuryDashboard.tsx"
Cohesion: 0.24
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 25 - ".performSyncEventStateToSupabase"
Cohesion: 0.12
Nodes (19): AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, deduplicateElectionList(), getElectionCanonicalKey() (+11 more)

### Community 26 - "Header.tsx"
Cohesion: 0.43
Nodes (6): UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, Theme, UserSession

### Community 27 - "AllocationTab.tsx"
Cohesion: 0.26
Nodes (11): AllocationCheckTab(), AllocationCheckTabProps, AllocationTabProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, computeAllocationHash(), getAllocationCheckStatus() (+3 more)

### Community 30 - "StudentDashboard.tsx"
Cohesion: 0.19
Nodes (11): AllocationVerificationModal(), AllocationVerificationModalProps, StudentDashboard(), StudentDashboardTab, getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), AllocationCheckStatus (+3 more)

### Community 31 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 32 - "allocationEngine.ts"
Cohesion: 0.25
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 33 - "getEventSlug"
Cohesion: 0.28
Nodes (9): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), findEventBySlug(), getEventSlug(), PATH_TAB_MAP, pathToTab(), slugify() (+1 more)

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "ElectionsTab"
Cohesion: 1.00
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 37 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "react"
Cohesion: 0.13
Nodes (15): react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboardProps (+7 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **166 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 194 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `index.ts`, `.setItem`, `EventDay`, `JuryMember`, `csvHelper.ts`, `storageService.ts`, `ElectionsTab.tsx`, `.notify`, `CsvImportModal.tsx`, `VolunteerDashboard.tsx`, `App.tsx`, `.getLearners`, `CollegeEvent`, `UserRole`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `.performSyncEventStateToSupabase`, `AllocationTab.tsx`, `.getItem`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `allocationEngine.ts`, `getEventSlug`, `.getActiveEventId`, `ParliamentQuestion`, `LoginRecord`, `react`?**
  _High betweenness centrality (0.359) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `index.ts`, `package.json`, `EventDay`, `JuryMember`, `csvHelper.ts`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `VolunteerDashboard.tsx`, `App.tsx`, `CollegeEvent`, `MediaTab.tsx`, `UserRole`, `Toast.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `.performSyncEventStateToSupabase`, `Header.tsx`, `AllocationTab.tsx`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `ParliamentQuestion`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Learner` to `index.ts`, `package.json`, `EventDay`, `JuryMember`, `csvHelper.ts`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `VolunteerDashboard.tsx`, `App.tsx`, `CollegeEvent`, `MediaTab.tsx`, `UserRole`, `Toast.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `.performSyncEventStateToSupabase`, `Header.tsx`, `AllocationTab.tsx`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `ParliamentQuestion`, `react`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09846153846153846 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._