# Graph Report - TN_Assembly-  (2026-09-24)

## Corpus Check
- 92 files · ~222,719 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 841 nodes · 3255 edges · 45 communities (33 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72376c53`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- index.ts
- package.json
- presenceService
- .setItem
- StudentDashboard.tsx
- Volunteer
- storageService
- csvHelper.ts
- ParticipantsTab.tsx
- ElectionsTab.tsx
- CsvImportModal.tsx
- VolunteerDashboard.tsx
- getEventSlug
- aws
- .invalidateCache
- compilerOptions
- CollegeEvent
- MediaTab.tsx
- UserRole
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- JuryDashboard.tsx
- storageService.ts
- Header.tsx
- Sidebar.tsx
- .getParties
- allocationEngine.ts
- AgendaItem
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
- .getActiveEventId

## God Nodes (most connected - your core abstractions)
1. `storageService` - 323 edges
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
- `EditCoordinatorModalProps` --references--> `Coordinator`  [EXTRACTED]
  src/components/admin/EditCoordinatorModal.tsx → src/types/index.ts
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `ChatTabProps` --references--> `ChatMessage`  [EXTRACTED]
  src/components/coordinator/ChatTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (45 total, 8 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.18
Nodes (21): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+13 more)

### Community 1 - "index.ts"
Cohesion: 0.12
Nodes (20): ProceedingsTabProps, AggregatedScore, AssemblyElection, BillProceeding, BillVotingStatus, ElectionBackupSnapshot, ElectionEligibility, EventDayStatus (+12 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "presenceService"
Cohesion: 0.17
Nodes (8): @supabase/supabase-js, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, presenceService, PresenceUser

### Community 5 - "StudentDashboard.tsx"
Cohesion: 0.24
Nodes (9): StudentDashboard(), StudentDashboardTab, getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), AllocationCheckStatus, NominationPosition, SpeakingRequest (+1 more)

### Community 6 - "Volunteer"
Cohesion: 0.14
Nodes (7): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), LoginRecord, Volunteer

### Community 8 - "csvHelper.ts"
Cohesion: 0.21
Nodes (14): DownloadModal(), DownloadModalProps, ReportTab(), ReportTabProps, CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData() (+6 more)

### Community 9 - "ParticipantsTab.tsx"
Cohesion: 0.16
Nodes (25): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatCheckedDate() (+17 more)

### Community 10 - "ElectionsTab.tsx"
Cohesion: 0.29
Nodes (11): CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), BillVote, ElectionCandidate (+3 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 13 - "VolunteerDashboard.tsx"
Cohesion: 0.29
Nodes (10): EventTabRouteHandlerProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), VolunteerDashboardProps, YuvaAssignment, ChecklistItem, DayAttendanceRecord (+2 more)

### Community 14 - "getEventSlug"
Cohesion: 0.23
Nodes (15): App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), StandaloneProjectorDisplay(), extractEventFromUrl(), extractEventSlugCandidateFromUrl() (+7 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".invalidateCache"
Cohesion: 0.12
Nodes (4): genUuid(), isValidUuid(), EventDay, getRecordSessionStatuses()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.30
Nodes (11): EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, StudentDashboardProps, CollegeEvent, Election (+3 more)

### Community 19 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 20 - "UserRole"
Cohesion: 0.11
Nodes (23): papaparse, DaysActivitiesTabProps, MyEventsDashboardProps, ChecklistTab(), ChecklistTabProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+15 more)

### Community 21 - "App.tsx"
Cohesion: 0.14
Nodes (13): DaysActivitiesTab(), ToastContainer(), ToastMessage, ToastProps, AwardsTab(), ChapterAwardsTab(), ChapterAwardsTabProps, ChatTab() (+5 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.32
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES

### Community 24 - "JuryDashboard.tsx"
Cohesion: 0.22
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboardProps, ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, JuryMember (+1 more)

### Community 25 - "storageService.ts"
Cohesion: 0.11
Nodes (29): SuperAdminDashboardProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+21 more)

### Community 26 - "Header.tsx"
Cohesion: 0.29
Nodes (9): UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, JuryDashboard(), applyTheme(), Theme, useTheme() (+1 more)

### Community 27 - "Sidebar.tsx"
Cohesion: 0.29
Nodes (6): react-router-dom, SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps, tabToPath()

### Community 29 - ".getParties"
Cohesion: 0.10
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 30 - "allocationEngine.ts"
Cohesion: 0.18
Nodes (15): EditLearnerModalProps, TN_CONSTITUENCIES, TNConstituency, AcademicYear, allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode (+7 more)

### Community 31 - "AgendaItem"
Cohesion: 0.31
Nodes (8): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaItem, AgendaStatus

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
Cohesion: 0.09
Nodes (22): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditDayActivitiesModal(), EditDayActivitiesModalProps (+14 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `index.ts`, `.setItem`, `StudentDashboard.tsx`, `Volunteer`, `csvHelper.ts`, `ParticipantsTab.tsx`, `ElectionsTab.tsx`, `.notify`, `CsvImportModal.tsx`, `VolunteerDashboard.tsx`, `.invalidateCache`, `CollegeEvent`, `UserRole`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `storageService.ts`, `.getItem`, `.getParties`, `allocationEngine.ts`, `AgendaItem`, `react`, `.getActiveEventId`?**
  _High betweenness centrality (0.359) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `index.ts`, `package.json`, `StudentDashboard.tsx`, `Volunteer`, `csvHelper.ts`, `ParticipantsTab.tsx`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `MediaTab.tsx`, `UserRole`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `Header.tsx`, `Sidebar.tsx`, `allocationEngine.ts`, `AgendaItem`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `index.ts`, `package.json`, `StudentDashboard.tsx`, `Volunteer`, `csvHelper.ts`, `ParticipantsTab.tsx`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `MediaTab.tsx`, `UserRole`, `App.tsx`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `Header.tsx`, `Sidebar.tsx`, `allocationEngine.ts`, `AgendaItem`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.08097165991902834 - nodes in this community are weakly interconnected._