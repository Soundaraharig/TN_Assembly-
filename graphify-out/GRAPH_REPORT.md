# Graph Report - TN_Assembly-  (2026-09-23)

## Corpus Check
- 92 files · ~219,331 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 837 nodes · 3236 edges · 47 communities (33 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fab318a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- index.ts
- package.json
- Header.tsx
- .sbUpsert
- StudentDashboard.tsx
- Volunteer
- ElectionsTab
- react
- ParticipantsTab.tsx
- .hydrateFullEventData
- .setItem
- csvHelper.ts
- BillProceeding
- getEventSlug
- aws
- .getItem
- compilerOptions
- CollegeEvent
- MediaTab.tsx
- TeamMember
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
- ChatMessage
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
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (47 total, 11 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.16
Nodes (26): MyEventsDashboardProps, AddLearnerModalProps, AllocationCheckTabProps, AllocationModalProps, AllocationTabProps, AnalyticsTabProps, AwardsTabProps, CabinetTabProps (+18 more)

### Community 1 - "index.ts"
Cohesion: 0.08
Nodes (29): EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ALL_NOMINATION_ROLES, NominationsTab() (+21 more)

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
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 7 - "ElectionsTab"
Cohesion: 1.00
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 8 - "react"
Cohesion: 0.10
Nodes (24): lucide-react, papaparse, react, OrganizerSignInProps, AddLearnerModal(), AllocationModal(), AnalyticsTab(), ChecklistTab() (+16 more)

### Community 9 - "ParticipantsTab.tsx"
Cohesion: 0.14
Nodes (23): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatConstituencyName() (+15 more)

### Community 12 - "csvHelper.ts"
Cohesion: 0.10
Nodes (29): CsvImportModal(), ImportReportData, UpdateReportData, ReportTab(), generateAccessCode(), CSVImportResult, CSVImportStats, deduplicateLearners() (+21 more)

### Community 13 - "BillProceeding"
Cohesion: 0.32
Nodes (6): ProceedingsTabProps, ReportTabProps, BillProceeding, EventDeadline, ProceedingsMotion, ProceedingsQuestion

### Community 14 - "getEventSlug"
Cohesion: 0.30
Nodes (9): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), findEventBySlug(), getEventSlug(), PATH_TAB_MAP, pathToTab(), slugify() (+1 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getItem"
Cohesion: 0.10
Nodes (3): EventDay, SpeakingRequest, SpeakingTurn

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.23
Nodes (20): EventTabRouteHandlerProps, DaysActivitiesTabProps, EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps (+12 more)

### Community 19 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 20 - "TeamMember"
Cohesion: 0.26
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 21 - "App.tsx"
Cohesion: 0.13
Nodes (20): App(), getInitialRouteInfo(), getInitialSavedSession(), DaysActivitiesTab(), EventOverviewTab(), StandaloneProjectorDisplay(), ToastContainer(), ToastMessage (+12 more)

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

### Community 29 - ".unpackAndApplyEventState"
Cohesion: 0.13
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), getRecordSessionStatuses()

### Community 30 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 31 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 33 - "ChatMessage"
Cohesion: 0.50
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

- **Why does `storageService` connect `storageService` to `Learner`, `index.ts`, `.sbUpsert`, `StudentDashboard.tsx`, `Volunteer`, `react`, `ParticipantsTab.tsx`, `.hydrateFullEventData`, `.setItem`, `csvHelper.ts`, `BillProceeding`, `getEventSlug`, `.getItem`, `CollegeEvent`, `TeamMember`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `.unpackAndApplyEventState`, `AgendaTab.tsx`, `.addAgendaItem`, `ChatMessage`, `MyEventsDashboard.tsx`, `.getEvents`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `index.ts`, `package.json`, `Header.tsx`, `StudentDashboard.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `csvHelper.ts`, `BillProceeding`, `CollegeEvent`, `MediaTab.tsx`, `TeamMember`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `Sidebar.tsx`, `AgendaTab.tsx`, `ChatMessage`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `index.ts`, `package.json`, `Header.tsx`, `StudentDashboard.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `csvHelper.ts`, `BillProceeding`, `CollegeEvent`, `MediaTab.tsx`, `TeamMember`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `Sidebar.tsx`, `AgendaTab.tsx`, `ChatMessage`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08377896613190731 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04541062801932367 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.09595959595959595 - nodes in this community are weakly interconnected._