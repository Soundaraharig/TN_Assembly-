# Graph Report - TN_Assembly-  (2026-09-24)

## Corpus Check
- 92 files · ~219,357 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 837 nodes · 3230 edges · 45 communities (30 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7512c312`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- index.ts
- package.json
- Header.tsx
- .invalidateCache
- StudentDashboard.tsx
- Volunteer
- react
- ParticipantsTab.tsx
- .hydrateFullEventData
- csvHelper.ts
- SpeakingTurn
- getEventSlug
- aws
- EventDay
- compilerOptions
- CollegeEvent
- MediaTab.tsx
- UserRole
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- JuryDashboard.tsx
- storageService.ts
- presenceService
- Sidebar.tsx
- storageService
- .unpackAndApplyEventState
- allocationEngine.ts
- AgendaTab.tsx
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
- .getEvents

## God Nodes (most connected - your core abstractions)
1. `storageService` - 319 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 56 edges
5. `lucide-react` - 53 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 46 edges
8. `UserRole` - 27 edges
9. `AgendaItem` - 27 edges
10. `getEventSlug()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (45 total, 11 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.19
Nodes (24): AddLearnerModalProps, AllocationCheckTabProps, AllocationModalProps, AllocationTabProps, AnalyticsTabProps, CabinetTabProps, SearchableDelegateSelectProps, CommitteesTabProps (+16 more)

### Community 1 - "index.ts"
Cohesion: 0.08
Nodes (29): EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ProceedingsTabProps, AssemblyElection (+21 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (44): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+36 more)

### Community 3 - "Header.tsx"
Cohesion: 0.18
Nodes (13): @supabase/supabase-js, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, isSupabaseEnabled, supabase, supabaseAnonKey (+5 more)

### Community 5 - "StudentDashboard.tsx"
Cohesion: 0.17
Nodes (15): AllocationVerificationModal(), AllocationVerificationModalProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), StudentDashboardTab, computeAllocationHash() (+7 more)

### Community 6 - "Volunteer"
Cohesion: 0.15
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 8 - "react"
Cohesion: 0.14
Nodes (14): lucide-react, react, EventOverviewTabProps, OrganizerSignInProps, AddLearnerModal(), AllocationModal(), AnalyticsTab(), AwardsTabProps (+6 more)

### Community 9 - "ParticipantsTab.tsx"
Cohesion: 0.16
Nodes (25): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ElectionsTab(), ParticipantsTab() (+17 more)

### Community 12 - "csvHelper.ts"
Cohesion: 0.10
Nodes (29): CsvImportModal(), ImportReportData, UpdateReportData, ReportTab(), generateAccessCode(), CSVImportResult, CSVImportStats, deduplicateLearners() (+21 more)

### Community 14 - "getEventSlug"
Cohesion: 0.19
Nodes (16): App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), MyEventsDashboard(), StandaloneProjectorDisplay(), extractEventFromUrl() (+8 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.23
Nodes (21): EventTabRouteHandlerProps, DaysActivitiesTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, ReportTabProps, JuryDashboardProps, StudentDashboardProps (+13 more)

### Community 19 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 20 - "UserRole"
Cohesion: 0.11
Nodes (21): papaparse, MyEventsDashboardProps, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+13 more)

### Community 21 - "App.tsx"
Cohesion: 0.12
Nodes (16): DaysActivitiesTab(), EventOverviewTab(), ToastContainer(), ToastMessage, ToastProps, AwardsTab(), ChapterAwardsTab(), ChapterAwardsTabProps (+8 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 24 - "JuryDashboard.tsx"
Cohesion: 0.24
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 25 - "storageService.ts"
Cohesion: 0.10
Nodes (28): QuestionnaireTab(), QuestionnaireTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS (+20 more)

### Community 27 - "Sidebar.tsx"
Cohesion: 0.29
Nodes (6): react-router-dom, SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps, tabToPath()

### Community 28 - "storageService"
Cohesion: 0.06
Nodes (3): storageService, uid(), SpeakingRequest

### Community 29 - ".unpackAndApplyEventState"
Cohesion: 0.10
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), AggregatedScore, getRecordSessionStatuses()

### Community 30 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 31 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

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
Cohesion: 0.31
Nodes (7): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, SuperAdminDashboardProps, Coordinator, generateRandomPassword()

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `index.ts`, `.invalidateCache`, `StudentDashboard.tsx`, `Volunteer`, `.getLearners`, `react`, `ParticipantsTab.tsx`, `.hydrateFullEventData`, `.setItem`, `csvHelper.ts`, `SpeakingTurn`, `getEventSlug`, `EventDay`, `CollegeEvent`, `UserRole`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `.unpackAndApplyEventState`, `AgendaTab.tsx`, `MyEventsDashboard.tsx`, `.getEvents`?**
  _High betweenness centrality (0.357) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `index.ts`, `package.json`, `Header.tsx`, `StudentDashboard.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CollegeEvent`, `MediaTab.tsx`, `UserRole`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `MyEventsDashboard.tsx`, `Sidebar.tsx`, `AgendaTab.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `index.ts`, `package.json`, `Header.tsx`, `StudentDashboard.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CollegeEvent`, `MediaTab.tsx`, `UserRole`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `MyEventsDashboard.tsx`, `Sidebar.tsx`, `AgendaTab.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08377896613190731 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04541062801932367 - nodes in this community are weakly interconnected._
- **Should `Volunteer` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._