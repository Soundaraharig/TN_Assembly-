# Graph Report - TN_Assembly-  (2026-09-21)

## Corpus Check
- 90 files · ~208,682 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 815 nodes · 3125 edges · 39 communities (27 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `268b40d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- csvHelper.ts
- package.json
- allocationEngine.ts
- .getLearners
- index.ts
- Volunteer
- storageService.ts
- Committee
- EventDay
- .getEvents
- .setItem
- CsvImportModal.tsx
- getEventSlug
- StudentDashboard.tsx
- aws
- ElectionsTab.tsx
- compilerOptions
- CollegeEvent
- App.tsx
- AgendaTab.tsx
- ChatMessage
- compilerOptions
- ParticipantsTab.tsx
- .getParties
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
- JuryDashboard.tsx
- storageService

## God Nodes (most connected - your core abstractions)
1. `storageService` - 304 edges
2. `Learner` - 95 edges
3. `Party` - 58 edges
4. `react` - 55 edges
5. `lucide-react` - 52 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 46 edges
8. `AgendaItem` - 27 edges
9. `getEventSlug()` - 27 edges
10. `Election` - 26 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (39 total, 10 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.12
Nodes (28): MyEventsDashboardProps, AddLearnerModal(), AddLearnerModalProps, AgendaTab(), AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps (+20 more)

### Community 1 - "csvHelper.ts"
Cohesion: 0.20
Nodes (15): DownloadModal(), DownloadModalProps, ReportTab(), ReportTabProps, CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, ExportColumnDef (+7 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "allocationEngine.ts"
Cohesion: 0.29
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 5 - "index.ts"
Cohesion: 0.08
Nodes (24): EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, EventOverviewTab(), EventOverviewTabProps, FeedbackTab(), FeedbackTabProps (+16 more)

### Community 6 - "Volunteer"
Cohesion: 0.17
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 7 - "storageService.ts"
Cohesion: 0.10
Nodes (31): QuestionnaireTab(), QuestionnaireTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS (+23 more)

### Community 8 - "Committee"
Cohesion: 0.14
Nodes (17): ChecklistTab(), ChecklistTabProps, CommitteesTabProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps (+9 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.11
Nodes (22): papaparse, xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, TN_CONSTITUENCIES, TNConstituency (+14 more)

### Community 13 - "getEventSlug"
Cohesion: 0.23
Nodes (13): EventSlugOnlyRedirector(), EventTabRouteHandler(), StandaloneProjectorDisplay(), LiveTimerState, ProceedingsQuestion, extractEventFromUrl(), extractEventSlugCandidateFromUrl(), findEventBySlug() (+5 more)

### Community 14 - "StudentDashboard.tsx"
Cohesion: 0.22
Nodes (11): ProceedingsTab(), ProceedingsTabProps, StudentDashboard(), StudentDashboardTab, getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), BillProceeding (+3 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "ElectionsTab.tsx"
Cohesion: 0.33
Nodes (10): CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), ElectionCandidate, FlashVoteAudience (+2 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.20
Nodes (23): EventTabRouteHandlerProps, DaysActivitiesTab(), DaysActivitiesTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps (+15 more)

### Community 19 - "App.tsx"
Cohesion: 0.10
Nodes (27): lucide-react, react, react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, OrganizerSignInProps (+19 more)

### Community 20 - "AgendaTab.tsx"
Cohesion: 0.38
Nodes (6): AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 21 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 25 - "ParticipantsTab.tsx"
Cohesion: 0.22
Nodes (20): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), formatCheckedDate(), StudentAllocationCard() (+12 more)

### Community 28 - ".getParties"
Cohesion: 0.11
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

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
Cohesion: 0.27
Nodes (8): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboard(), SuperAdminDashboardProps, Coordinator, generateRandomPassword()

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 90 - "JuryDashboard.tsx"
Cohesion: 0.06
Nodes (31): @supabase/supabase-js, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, CategoryId, getCategoryScoreFromRecord(), isParticipantActive() (+23 more)

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `csvHelper.ts`, `allocationEngine.ts`, `.getLearners`, `index.ts`, `Volunteer`, `storageService.ts`, `Committee`, `EventDay`, `.getEvents`, `.setItem`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `ElectionsTab.tsx`, `CollegeEvent`, `App.tsx`, `AgendaTab.tsx`, `ParticipantsTab.tsx`, `.getParties`, `MyEventsDashboard.tsx`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.348) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `Learner`, `csvHelper.ts`, `package.json`, `MyEventsDashboard.tsx`, `index.ts`, `Volunteer`, `storageService.ts`, `Committee`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `ElectionsTab.tsx`, `CollegeEvent`, `AgendaTab.tsx`, `ChatMessage`, `ParticipantsTab.tsx`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `App.tsx` to `Learner`, `csvHelper.ts`, `package.json`, `MyEventsDashboard.tsx`, `index.ts`, `Volunteer`, `storageService.ts`, `Committee`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `ElectionsTab.tsx`, `CollegeEvent`, `AgendaTab.tsx`, `ChatMessage`, `ParticipantsTab.tsx`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `.getLearners` be split into smaller, more focused modules?**
  _Cohesion score 0.0936408106219427 - nodes in this community are weakly interconnected._