# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 98 files · ~226,934 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 870 nodes · 3348 edges · 49 communities (27 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e6c69f18`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- index.ts
- package.json
- storageService
- uid
- .unpackAndApplyEventState
- Volunteer
- csvHelper.ts
- storageService.ts
- ElectionsTab.tsx
- CsvImportModal.tsx
- App.tsx
- aws
- .getLearners
- compilerOptions
- CollegeEvent
- permissions.ts
- BillProceeding
- compilerOptions
- ScoreGridTab.tsx
- SpeakingRequest
- ParticipantsTab.tsx
- SpeakingTurn
- .executeDisplayPortalFetch
- StudentDashboard.tsx
- AgendaTab.tsx
- allocationEngine.ts
- .getActiveEventId
- test_vote_lifecycle.cjs
- ParliamentQuestion
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
1. `storageService` - 330 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 57 edges
5. `lucide-react` - 54 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 46 edges
8. `getEventSlug()` - 29 edges
9. `UserRole` - 27 edges
10. `AgendaItem` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (49 total, 13 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.14
Nodes (29): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+21 more)

### Community 1 - "index.ts"
Cohesion: 0.14
Nodes (15): EditEventModal(), EditEventModalProps, ALL_NOMINATION_ROLES, TeamTab(), TeamTabProps, AssemblyElection, BillVotingStatus, ElectionEligibility (+7 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 5 - ".unpackAndApplyEventState"
Cohesion: 0.11
Nodes (12): EditDayActivitiesModal(), EditDayActivitiesModalProps, deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), DayAttendanceRecord, DayAttendanceStatus (+4 more)

### Community 6 - "Volunteer"
Cohesion: 0.16
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 8 - "csvHelper.ts"
Cohesion: 0.24
Nodes (13): DownloadModal(), DownloadModalProps, CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, ExportColumnDef, exportCustomParticipantData(), exportFullParticipantDataToCSV() (+5 more)

### Community 9 - "storageService.ts"
Cohesion: 0.09
Nodes (32): runAuditAndLifecycleTests(), store, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS (+24 more)

### Community 10 - "ElectionsTab.tsx"
Cohesion: 0.24
Nodes (12): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+4 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 14 - "App.tsx"
Cohesion: 0.05
Nodes (54): react-router-dom, @supabase/supabase-js, supabase, supabase, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo() (+46 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.26
Nodes (17): EventTabRouteHandlerProps, EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps (+9 more)

### Community 20 - "permissions.ts"
Cohesion: 0.13
Nodes (14): papaparse, ChecklistTab(), ChecklistTabProps, JuryTab(), JuryTabProps, NominationsTab(), PartiesTab(), PartiesTabProps (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 25 - "ParticipantsTab.tsx"
Cohesion: 0.09
Nodes (33): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), COMM_STEPS (+25 more)

### Community 30 - "StudentDashboard.tsx"
Cohesion: 0.19
Nodes (14): AllocationVerificationModal(), formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), StudentDashboardTab, computeAllocationHash(), getAllocationCheckStatus() (+6 more)

### Community 31 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 32 - "allocationEngine.ts"
Cohesion: 0.29
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

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
Cohesion: 0.11
Nodes (21): lucide-react, react, CreateEventModal(), CreateEventModalProps, DaysActivitiesTabProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps (+13 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **172 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 204 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `uid`, `.unpackAndApplyEventState`, `Volunteer`, `.fetchAllEvents`, `csvHelper.ts`, `storageService.ts`, `ElectionsTab.tsx`, `.setItem`, `CsvImportModal.tsx`, `.addAgendaItem`, `App.tsx`, `.getLearners`, `CollegeEvent`, `.getCoordinators`, `permissions.ts`, `BillProceeding`, `ScoreGridTab.tsx`, `SpeakingRequest`, `ParticipantsTab.tsx`, `SpeakingTurn`, `.getItem`, `.executeDisplayPortalFetch`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `allocationEngine.ts`, `.performSyncEventStateToSupabase`, `.getActiveEventId`, `ParliamentQuestion`, `react`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `index.ts`, `package.json`, `.unpackAndApplyEventState`, `ParliamentQuestion`, `Volunteer`, `csvHelper.ts`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `App.tsx`, `CollegeEvent`, `permissions.ts`, `ScoreGridTab.tsx`, `ParticipantsTab.tsx`, `StudentDashboard.tsx`, `AgendaTab.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `index.ts`, `package.json`, `.unpackAndApplyEventState`, `ParliamentQuestion`, `Volunteer`, `csvHelper.ts`, `ElectionsTab.tsx`, `CsvImportModal.tsx`, `App.tsx`, `CollegeEvent`, `permissions.ts`, `ScoreGridTab.tsx`, `ParticipantsTab.tsx`, `StudentDashboard.tsx`, `AgendaTab.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.1353658536585366 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._