# Graph Report - TN_Assembly-  (2026-09-22)

## Corpus Check
- 90 files · ~209,857 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 818 nodes · 3154 edges · 41 communities (28 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `419980c5`
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
- ElectionsTab
- UserRole
- .setItem
- CsvImportModal.tsx
- getEventSlug
- aws
- DaysActivitiesTab.tsx
- compilerOptions
- CollegeEvent
- App
- VolunteerDashboard.tsx
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- presenceService
- storageService.ts
- TeamMember
- ParliamentQuestion
- .getParties
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
- presenceService.ts
- .getItem

## God Nodes (most connected - your core abstractions)
1. `storageService` - 306 edges
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
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `EventTabRouteHandlerProps` --references--> `ActiveNavTab`  [EXTRACTED]
  src/App.tsx → src/components/common/Sidebar.tsx

## Import Cycles
- None detected.

## Communities (41 total, 10 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.10
Nodes (41): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+33 more)

### Community 1 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.15
Nodes (15): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus, AssemblyElection (+7 more)

### Community 6 - "Volunteer"
Cohesion: 0.11
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 7 - "ElectionsTab"
Cohesion: 1.00
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 8 - "UserRole"
Cohesion: 0.11
Nodes (21): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab() (+13 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.14
Nodes (19): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile(), DuplicateRow (+11 more)

### Community 13 - "getEventSlug"
Cohesion: 0.24
Nodes (12): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), StandaloneProjectorDisplay(), extractEventFromUrl(), extractEventSlugCandidateFromUrl(), findEventBySlug(), getEventSlug() (+4 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "DaysActivitiesTab.tsx"
Cohesion: 0.28
Nodes (8): DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ParticipantsTabProps, VolunteerDashboardProps, DayAttendanceRecord, DayAttendanceStatus, EventDay

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.17
Nodes (26): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, CoordinatorDashboardProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ProceedingsTabProps, ProjectorTabProps (+18 more)

### Community 19 - "App"
Cohesion: 0.18
Nodes (12): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), ActiveNavTab, Sidebar() (+4 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.18
Nodes (14): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+6 more)

### Community 21 - "App.tsx"
Cohesion: 0.12
Nodes (15): EventOverviewTab(), Header(), ToastContainer(), ToastMessage, ToastProps, AwardsTab(), ChapterAwardsTab(), ChapterAwardsTabProps (+7 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 25 - "storageService.ts"
Cohesion: 0.05
Nodes (70): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatCheckedDate() (+62 more)

### Community 26 - "TeamMember"
Cohesion: 0.24
Nodes (5): UnifiedLoginPage(), UnifiedLoginPageProps, Theme, TeamMember, UserSession

### Community 27 - "ParliamentQuestion"
Cohesion: 0.50
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 28 - ".getParties"
Cohesion: 0.14
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

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
Cohesion: 0.12
Nodes (18): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+10 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 90 - "presenceService.ts"
Cohesion: 0.31
Nodes (7): @supabase/supabase-js, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, PresenceUser

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.notify`, `index.ts`, `Volunteer`, `UserRole`, `.batchSetDayAttendance`, `.setItem`, `CsvImportModal.tsx`, `getEventSlug`, `DaysActivitiesTab.tsx`, `CollegeEvent`, `VolunteerDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `TeamMember`, `ParliamentQuestion`, `.getParties`, `react`, `.getItem`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `MediaTab.tsx`, `package.json`, `index.ts`, `Volunteer`, `UserRole`, `CsvImportModal.tsx`, `DaysActivitiesTab.tsx`, `CollegeEvent`, `App`, `VolunteerDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `TeamMember`, `ParliamentQuestion`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `MediaTab.tsx`, `package.json`, `index.ts`, `Volunteer`, `UserRole`, `CsvImportModal.tsx`, `DaysActivitiesTab.tsx`, `CollegeEvent`, `App`, `VolunteerDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `TeamMember`, `ParliamentQuestion`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.10033670033670034 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `storageService` be split into smaller, more focused modules?**
  _Cohesion score 0.07632850241545894 - nodes in this community are weakly interconnected._