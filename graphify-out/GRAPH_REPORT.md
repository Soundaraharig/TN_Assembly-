# Graph Report - TN_Assembly-  (2026-09-22)

## Corpus Check
- 90 files · ~213,425 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 819 nodes · 3167 edges · 50 communities (35 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89395dea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- MediaTab.tsx
- package.json
- storageService
- .notify
- index.ts
- Volunteer
- ElectionsTab.tsx
- UserRole
- ParticipantsTab.tsx
- csvHelper.ts
- .setItem
- CsvImportModal.tsx
- getEventSlug
- StudentDashboard.tsx
- aws
- VolunteerDashboard.tsx
- compilerOptions
- CollegeEvent
- slug.ts
- JuryDashboard.tsx
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- presenceService
- storageService.ts
- TeamMember
- ParliamentQuestion
- .getParties
- allocationEngine.ts
- react
- AddLearnerModal.tsx
- ChatMessage
- FeedbackEntry
- BillProceeding
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- MyEventsDashboard.tsx
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md
- presenceService.ts
- .getItem

## God Nodes (most connected - your core abstractions)
1. `storageService` - 307 edges
2. `Learner` - 95 edges
3. `Party` - 58 edges
4. `react` - 55 edges
5. `lucide-react` - 52 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 46 edges
8. `UserRole` - 27 edges
9. `AgendaItem` - 27 edges
10. `getEventSlug()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (50 total, 12 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.19
Nodes (20): AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps, CabinetTabProps, SearchableDelegateSelectProps (+12 more)

### Community 1 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.09
Nodes (22): EditEventModal(), EditEventModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay (+14 more)

### Community 6 - "Volunteer"
Cohesion: 0.12
Nodes (10): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LearnerAllocationConfirmation, LoginRecord (+2 more)

### Community 7 - "ElectionsTab.tsx"
Cohesion: 0.36
Nodes (9): CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), BillVote, ElectionCandidate (+1 more)

### Community 8 - "UserRole"
Cohesion: 0.12
Nodes (21): papaparse, ChecklistTab(), ChecklistTabProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps (+13 more)

### Community 9 - "ParticipantsTab.tsx"
Cohesion: 0.21
Nodes (19): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatConstituencyName() (+11 more)

### Community 10 - "csvHelper.ts"
Cohesion: 0.21
Nodes (14): DownloadModal(), DownloadModalProps, ReportTab(), ReportTabProps, CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData() (+6 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 13 - "getEventSlug"
Cohesion: 0.23
Nodes (6): EventSlugOnlyRedirector(), EventDeadline, ProceedingsQuestion, findEventBySlug(), getEventSlug(), slugify()

### Community 14 - "StudentDashboard.tsx"
Cohesion: 0.19
Nodes (13): formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), StudentDashboardTab, computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry() (+5 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "VolunteerDashboard.tsx"
Cohesion: 0.14
Nodes (14): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, VolunteerDashboardProps, YuvaAssignment, DayAttendanceRecord, DayAttendanceStatus (+6 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.29
Nodes (15): EventTabRouteHandlerProps, EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps (+7 more)

### Community 19 - "slug.ts"
Cohesion: 0.24
Nodes (9): EventTabRouteHandler(), SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps, PATH_TAB_MAP, pathToTab(), TAB_PATH_MAP (+1 more)

### Community 20 - "JuryDashboard.tsx"
Cohesion: 0.17
Nodes (13): UnifiedLoginPage(), UnifiedLoginPageProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS (+5 more)

### Community 21 - "App.tsx"
Cohesion: 0.14
Nodes (18): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), MyEventsDashboard(), Header(), StandaloneProjectorDisplay(), ToastContainer() (+10 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.32
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES

### Community 25 - "storageService.ts"
Cohesion: 0.11
Nodes (28): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+20 more)

### Community 27 - "ParliamentQuestion"
Cohesion: 0.40
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 29 - ".getParties"
Cohesion: 0.25
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 30 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 31 - "react"
Cohesion: 0.24
Nodes (5): lucide-react, react, OrganizerSignInProps, AwardsTabProps, StudentLoginGatewayProps

### Community 32 - "AddLearnerModal.tsx"
Cohesion: 0.29
Nodes (6): AddLearnerModal(), AddLearnerModalProps, EditLearnerModalProps, TN_CONSTITUENCIES, TNConstituency, generateAccessCode()

### Community 33 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 34 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "MyEventsDashboard.tsx"
Cohesion: 0.23
Nodes (10): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, HeaderProps, Coordinator (+2 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 90 - "presenceService.ts"
Cohesion: 0.31
Nodes (7): @supabase/supabase-js, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, PresenceUser

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.notify`, `index.ts`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `.setItem`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `JuryDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `TeamMember`, `ParliamentQuestion`, `.getEvents`, `.getParties`, `AddLearnerModal.tsx`, `ChatMessage`, `FeedbackEntry`, `BillProceeding`, `MyEventsDashboard.tsx`, `.getItem`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `MediaTab.tsx`, `package.json`, `index.ts`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CsvImportModal.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `slug.ts`, `JuryDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `ParliamentQuestion`, `AddLearnerModal.tsx`, `ChatMessage`, `FeedbackEntry`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `MediaTab.tsx`, `package.json`, `index.ts`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CsvImportModal.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `slug.ts`, `JuryDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `ParliamentQuestion`, `AddLearnerModal.tsx`, `ChatMessage`, `FeedbackEntry`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `storageService` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
- **Should `.notify` be split into smaller, more focused modules?**
  _Cohesion score 0.12488436632747456 - nodes in this community are weakly interconnected._