# Graph Report - TN_Assembly-  (2026-09-22)

## Corpus Check
- 90 files · ~213,975 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 819 nodes · 3168 edges · 43 communities (28 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fa6f306e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Party
- AgendaTab.tsx
- package.json
- .setItem
- index.ts
- Volunteer
- ElectionsTab.tsx
- UserRole
- ParticipantsTab.tsx
- csvHelper.ts
- CsvImportModal.tsx
- ScoreRecord
- StudentDashboard.tsx
- aws
- DaysActivitiesTab.tsx
- compilerOptions
- AgendaItem
- .confirmStudentAllocation
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- storageService.ts
- ParliamentQuestion
- storageService
- .getParties
- allocationEngine.ts
- react
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- Learner
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md
- .performSyncEventStateToSupabase

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
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (43 total, 10 thin omitted)

### Community 0 - "Party"
Cohesion: 0.17
Nodes (20): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTabProps, CabinetTabProps (+12 more)

### Community 1 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.16
Nodes (15): EditEventModal(), EditEventModalProps, formatCheckedDate(), StudentAllocationCard(), computeAllocationHash(), getAllocationCheckStatus(), isAllocationComplete(), AllocationCheckStatus (+7 more)

### Community 6 - "Volunteer"
Cohesion: 0.14
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 7 - "ElectionsTab.tsx"
Cohesion: 0.31
Nodes (9): CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), BillVote, ElectionCandidate (+1 more)

### Community 8 - "UserRole"
Cohesion: 0.10
Nodes (24): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+16 more)

### Community 9 - "ParticipantsTab.tsx"
Cohesion: 0.09
Nodes (29): @supabase/supabase-js, AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab() (+21 more)

### Community 10 - "csvHelper.ts"
Cohesion: 0.23
Nodes (13): DownloadModal(), DownloadModalProps, ReportTab(), CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData(), exportFullParticipantDataToCSV() (+5 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 14 - "StudentDashboard.tsx"
Cohesion: 0.43
Nodes (6): StudentDashboard(), StudentDashboardTab, getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), NominationPosition

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "DaysActivitiesTab.tsx"
Cohesion: 0.15
Nodes (13): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, VolunteerDashboardProps, DayAttendanceRecord, DayAttendanceStatus, EventDay (+5 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "AgendaItem"
Cohesion: 0.31
Nodes (12): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, StudentDashboardProps, AgendaItem, BillProceeding, ChecklistItem (+4 more)

### Community 21 - "App.tsx"
Cohesion: 0.05
Nodes (55): react-router-dom, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, MyEventsDashboard() (+47 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 25 - "storageService.ts"
Cohesion: 0.10
Nodes (29): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+21 more)

### Community 27 - "ParliamentQuestion"
Cohesion: 0.50
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 29 - ".getParties"
Cohesion: 0.10
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), uid()

### Community 30 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 31 - "react"
Cohesion: 0.17
Nodes (11): lucide-react, react, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, AnalyticsTab(), PartiesTab() (+3 more)

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "Learner"
Cohesion: 0.17
Nodes (16): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EventOverviewTab(), EventOverviewTabProps, MyEventsDashboardProps, SuperAdminDashboardProps (+8 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Party`, `AgendaTab.tsx`, `.addAgendaItem`, `.setItem`, `index.ts`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `.getItem`, `CsvImportModal.tsx`, `ScoreRecord`, `StudentDashboard.tsx`, `DaysActivitiesTab.tsx`, `AgendaItem`, `.confirmStudentAllocation`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `.getCoordinators`, `ParliamentQuestion`, `.getParties`, `react`, `Learner`, `.performSyncEventStateToSupabase`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Party`, `AgendaTab.tsx`, `package.json`, `index.ts`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CsvImportModal.tsx`, `StudentDashboard.tsx`, `DaysActivitiesTab.tsx`, `AgendaItem`, `App.tsx`, `ScoreGridTab.tsx`, `Learner`, `ParliamentQuestion`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Party`, `AgendaTab.tsx`, `package.json`, `index.ts`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CsvImportModal.tsx`, `StudentDashboard.tsx`, `DaysActivitiesTab.tsx`, `AgendaItem`, `App.tsx`, `ScoreGridTab.tsx`, `Learner`, `ParliamentQuestion`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.09013914095583787 - nodes in this community are weakly interconnected._
- **Should `Volunteer` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._