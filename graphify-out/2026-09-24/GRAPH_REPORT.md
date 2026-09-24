# Graph Report - TN_Assembly-  (2026-09-24)

## Corpus Check
- 93 files · ~224,704 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 850 nodes · 3319 edges · 42 communities (30 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37ec21d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Party
- getEventSlug
- package.json
- presenceService.ts
- ChatMessage
- .unpackAndApplyEventState
- VolunteersTab.tsx
- presenceService
- csvHelper.ts
- storageService.ts
- ElectionsTab.tsx
- CsvImportModal.tsx
- DaysActivitiesTab.tsx
- App.tsx
- aws
- .setItem
- compilerOptions
- Learner
- MediaTab.tsx
- UserRole
- Toast.tsx
- compilerOptions
- ScoreGridTab.tsx
- VolunteerDashboard.tsx
- FeedbackEntry
- react
- .getItem
- storageService
- index.ts
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
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (42 total, 9 thin omitted)

### Community 0 - "Party"
Cohesion: 0.16
Nodes (21): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+13 more)

### Community 1 - "getEventSlug"
Cohesion: 0.07
Nodes (18): EventSlugOnlyRedirector(), EventTabRouteHandler(), ProceedingsTab(), ProceedingsTabProps, QuestionnaireTab(), QuestionnaireTabProps, uid(), BillProceeding (+10 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "presenceService.ts"
Cohesion: 0.31
Nodes (7): @supabase/supabase-js, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, PresenceUser

### Community 4 - "ChatMessage"
Cohesion: 0.40
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 5 - ".unpackAndApplyEventState"
Cohesion: 0.18
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 6 - "VolunteersTab.tsx"
Cohesion: 0.17
Nodes (12): JuryTab(), JuryTabProps, SHIFTS, STATIONS, VolunteersTab(), VolunteersTabProps, YuvaAssignment, AccessCodeAuthResult (+4 more)

### Community 8 - "csvHelper.ts"
Cohesion: 0.22
Nodes (14): DownloadModal(), DownloadModalProps, ReportTab(), CSVImportResult, CustomExportOptions, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData() (+6 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (69): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatCheckedDate() (+61 more)

### Community 10 - "ElectionsTab.tsx"
Cohesion: 0.26
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (20): papaparse, xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV() (+12 more)

### Community 13 - "DaysActivitiesTab.tsx"
Cohesion: 0.24
Nodes (10): DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ParticipantsTabProps, VolunteerDashboardProps, DayAttendanceRecord, DayAttendanceStatus, EventDay (+2 more)

### Community 14 - "App.tsx"
Cohesion: 0.15
Nodes (22): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), EventOverviewTab(), EventOverviewTabProps (+14 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "Learner"
Cohesion: 0.26
Nodes (19): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, ReportTabProps, ScoreGridTabProps, JuryDashboardProps, AllocationVerificationModal() (+11 more)

### Community 19 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 20 - "UserRole"
Cohesion: 0.14
Nodes (17): ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps (+9 more)

### Community 21 - "Toast.tsx"
Cohesion: 0.40
Nodes (3): ToastContainer(), ToastMessage, ToastProps

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 24 - "VolunteerDashboard.tsx"
Cohesion: 0.17
Nodes (14): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+6 more)

### Community 25 - "FeedbackEntry"
Cohesion: 0.40
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 26 - "react"
Cohesion: 0.20
Nodes (9): react, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, StudentLoginGatewayProps, Theme (+1 more)

### Community 31 - "index.ts"
Cohesion: 0.11
Nodes (20): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AwardsTab(), AwardsTabProps, AgendaCategory, AgendaDay (+12 more)

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
Cohesion: 0.18
Nodes (14): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+6 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **162 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+157 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 190 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Party`, `getEventSlug`, `ChatMessage`, `.unpackAndApplyEventState`, `VolunteersTab.tsx`, `csvHelper.ts`, `storageService.ts`, `ElectionsTab.tsx`, `.notify`, `CsvImportModal.tsx`, `DaysActivitiesTab.tsx`, `App.tsx`, `.setItem`, `Learner`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`, `FeedbackEntry`, `.getItem`, `index.ts`, `lucide-react`?**
  _High betweenness centrality (0.363) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Party`, `getEventSlug`, `package.json`, `ChatMessage`, `VolunteersTab.tsx`, `csvHelper.ts`, `storageService.ts`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `DaysActivitiesTab.tsx`, `App.tsx`, `Learner`, `MediaTab.tsx`, `UserRole`, `Toast.tsx`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`, `FeedbackEntry`, `index.ts`, `lucide-react`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Party`, `getEventSlug`, `package.json`, `ChatMessage`, `VolunteersTab.tsx`, `csvHelper.ts`, `storageService.ts`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `DaysActivitiesTab.tsx`, `App.tsx`, `Learner`, `MediaTab.tsx`, `UserRole`, `Toast.tsx`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`, `FeedbackEntry`, `react`, `index.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getEventSlug` be split into smaller, more focused modules?**
  _Cohesion score 0.06938020351526364 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `storageService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050061050061050064 - nodes in this community are weakly interconnected._