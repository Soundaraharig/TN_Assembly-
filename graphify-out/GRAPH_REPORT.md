# Graph Report - TN_Assembly-  (2026-09-26)

## Corpus Check
- 98 files · ~236,923 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 886 nodes · 3468 edges · 44 communities (29 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e054e4ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Party
- .setItem
- package.json
- presenceService.ts
- presenceService
- Sidebar.tsx
- Learner
- storageService.ts
- getEventSlug
- .syncEventStateToSupabase
- CsvImportModal.tsx
- index.ts
- App.tsx
- aws
- .invalidateCache
- compilerOptions
- react
- DaysActivitiesTab.tsx
- compilerOptions
- ScoreRecord
- AllocationCheckTab.tsx
- VolunteerDashboard.tsx
- storageService
- .getItem
- .performSyncEventStateToSupabase
- .getEvents
- test_vote_lifecycle.cjs
- .getPartyLeaderElectionParty
- ChatMessage
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- lucide-react
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 341 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 57 edges
5. `lucide-react` - 55 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 47 edges
8. `UserRole` - 29 edges
9. `getEventSlug()` - 29 edges
10. `AgendaItem` - 28 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (44 total, 10 thin omitted)

### Community 0 - "Party"
Cohesion: 0.12
Nodes (32): AddLearnerModal(), AddLearnerModalProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps, CabinetTabProps (+24 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 5 - "Sidebar.tsx"
Cohesion: 0.29
Nodes (6): react-router-dom, SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps, tabToPath()

### Community 7 - "Learner"
Cohesion: 0.20
Nodes (23): EventTabRouteHandlerProps, EventOverviewTabProps, MyEventsDashboardProps, StandaloneProjectorDisplayProps, ControlTabProps, CoordinatorDashboardProps, ProceedingsTabProps, ProjectorTabProps (+15 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (70): runAuditAndLifecycleTests(), store, AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal() (+62 more)

### Community 10 - "getEventSlug"
Cohesion: 0.25
Nodes (11): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), ProceedingsTab(), EventDeadline, findEventBySlug(), getEventSlug(), PATH_TAB_MAP (+3 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 13 - "index.ts"
Cohesion: 0.08
Nodes (30): EditEventModal(), EditEventModalProps, RevealResultControls(), RevealResultControlsProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS (+22 more)

### Community 14 - "App.tsx"
Cohesion: 0.10
Nodes (25): App(), getInitialRouteInfo(), getInitialSavedSession(), DaysActivitiesTab(), EventOverviewTab(), Header(), StandaloneProjectorDisplay(), ToastContainer() (+17 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".invalidateCache"
Cohesion: 0.12
Nodes (7): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, genUuid(), isValidUuid(), JuryMember, Volunteer

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 20 - "react"
Cohesion: 0.10
Nodes (25): papaparse, react, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab() (+17 more)

### Community 21 - "DaysActivitiesTab.tsx"
Cohesion: 0.32
Nodes (6): DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, DayAttendanceStatus, EventDayStatus, STANDARD_TN_ACTIVITIES

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreRecord"
Cohesion: 0.17
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, AggregatedScore (+2 more)

### Community 24 - "AllocationCheckTab.tsx"
Cohesion: 0.43
Nodes (6): AllocationCheckTabProps, formatCheckedDate(), StudentAllocationCard(), getAllocationCheckStatus(), isAllocationComplete(), AllocationCheckStatus

### Community 25 - "VolunteerDashboard.tsx"
Cohesion: 0.17
Nodes (15): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+7 more)

### Community 28 - ".getItem"
Cohesion: 0.07
Nodes (4): LearnerAllocationConfirmation, LoginRecord, SpeakingRequest, SpeakingTurn

### Community 29 - ".performSyncEventStateToSupabase"
Cohesion: 0.07
Nodes (9): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), DayAttendanceRecord, EventDay, getCanonicalQuestionStatus(), getRecordSessionStatuses() (+1 more)

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - ".getPartyLeaderElectionParty"
Cohesion: 0.70
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 40 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "lucide-react"
Cohesion: 0.12
Nodes (16): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, SuperAdminDashboardProps, OrganizerSignInProps, UnifiedLoginPage() (+8 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Party`, `.setItem`, `.getCoordinators`, `Learner`, `.notify`, `storageService.ts`, `getEventSlug`, `.syncEventStateToSupabase`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `.invalidateCache`, `react`, `DaysActivitiesTab.tsx`, `ScoreRecord`, `AllocationCheckTab.tsx`, `VolunteerDashboard.tsx`, `.getItem`, `.performSyncEventStateToSupabase`, `.getEvents`, `.getPartyLeaderElectionParty`?**
  _High betweenness centrality (0.361) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Party`, `package.json`, `Sidebar.tsx`, `Learner`, `ChatMessage`, `storageService.ts`, `getEventSlug`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `.invalidateCache`, `DaysActivitiesTab.tsx`, `ScoreRecord`, `AllocationCheckTab.tsx`, `VolunteerDashboard.tsx`, `lucide-react`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Party`, `package.json`, `Sidebar.tsx`, `Learner`, `ChatMessage`, `storageService.ts`, `getEventSlug`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `.invalidateCache`, `react`, `DaysActivitiesTab.tsx`, `ScoreRecord`, `AllocationCheckTab.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Party` be split into smaller, more focused modules?**
  _Cohesion score 0.11738648947951273 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.11174242424242424 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._