# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 99 files · ~234,932 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 883 nodes · 3411 edges · 43 communities (29 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5db9d308`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- AddLearnerModal.tsx
- package.json
- presenceService
- Volunteer
- ParticipantsTab.tsx
- ElectionsTab.tsx
- AllocationTab.tsx
- csvHelper.ts
- storageService.ts
- .setItem
- .notify
- CsvImportModal.tsx
- AgendaTab.tsx
- App.tsx
- aws
- .getLearners
- compilerOptions
- CollegeEvent
- test_question_review_workflow.ts
- permissions.ts
- compilerOptions
- ScoreGridTab.tsx
- VolunteerDashboard.tsx
- storageService
- .getItem
- .unpackAndApplyEventState
- .getEvents
- test_vote_lifecycle.cjs
- index.ts
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
1. `storageService` - 335 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 57 edges
5. `lucide-react` - 55 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 47 edges
8. `UserRole` - 29 edges
9. `getEventSlug()` - 29 edges
10. `AgendaItem` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `ActiveNavTab`  [EXTRACTED]
  src/App.tsx → src/components/common/Sidebar.tsx

## Import Cycles
- None detected.

## Communities (43 total, 11 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.17
Nodes (23): SavedAuthSession, DaysActivitiesTabProps, AllocationModal(), AllocationModalProps, AnalyticsTab(), AnalyticsTabProps, AwardsTabProps, CabinetTabProps (+15 more)

### Community 1 - "AddLearnerModal.tsx"
Cohesion: 0.19
Nodes (11): AddLearnerModal(), AddLearnerModalProps, AllocationTabProps, EditLearnerModal(), EditLearnerModalProps, TN_CONSTITUENCIES, TNConstituency, AcademicYear (+3 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService"
Cohesion: 0.12
Nodes (9): @supabase/supabase-js, supabase, supabase, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, presenceService (+1 more)

### Community 4 - "Volunteer"
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 5 - "ParticipantsTab.tsx"
Cohesion: 0.31
Nodes (14): CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, getResolvedLearnerBench(), getResolvedPartyName(), isAssemblyRoleMatching() (+6 more)

### Community 6 - "ElectionsTab.tsx"
Cohesion: 0.24
Nodes (12): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+4 more)

### Community 7 - "AllocationTab.tsx"
Cohesion: 0.24
Nodes (12): AllocationCheckTab(), AllocationCheckTabProps, AllocationTab(), formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, computeAllocationHash(), getAllocationCheckStatus() (+4 more)

### Community 8 - "csvHelper.ts"
Cohesion: 0.22
Nodes (14): DownloadModal(), DownloadModalProps, CSVImportResult, CustomExportOptions, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, ExportColumnDef, exportCustomParticipantData() (+6 more)

### Community 9 - "storageService.ts"
Cohesion: 0.10
Nodes (32): QuestionnaireTab(), QuestionnaireTabProps, StudentDashboard(), INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS (+24 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 13 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 14 - "App.tsx"
Cohesion: 0.12
Nodes (30): react-router-dom, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), DaysActivitiesTab(), MyEventsDashboard() (+22 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getLearners"
Cohesion: 0.06
Nodes (15): genUuid(), isValidUuid(), DayAttendanceRecord, DayAttendanceStatus, EventDay, allocateCommittees(), allocateConstituencies(), allocateParties() (+7 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.24
Nodes (18): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, ReportTab(), ReportTabProps, JuryDashboardProps, AllocationVerificationModal() (+10 more)

### Community 20 - "permissions.ts"
Cohesion: 0.12
Nodes (13): papaparse, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab(), PartiesTab(), SHIFTS, STATIONS (+5 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 25 - "VolunteerDashboard.tsx"
Cohesion: 0.11
Nodes (22): UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS (+14 more)

### Community 29 - ".unpackAndApplyEventState"
Cohesion: 0.11
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "index.ts"
Cohesion: 0.07
Nodes (31): runAuditAndLifecycleTests(), store, EditDayActivitiesModal(), EditDayActivitiesModalProps, ChatTab(), ChatTabProps, ChecklistTab(), ChecklistTabProps (+23 more)

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
Nodes (25): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+17 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 209 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `AddLearnerModal.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `ElectionsTab.tsx`, `AllocationTab.tsx`, `csvHelper.ts`, `storageService.ts`, `.setItem`, `.notify`, `CsvImportModal.tsx`, `AgendaTab.tsx`, `App.tsx`, `.getLearners`, `CollegeEvent`, `permissions.ts`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`, `.getItem`, `.unpackAndApplyEventState`, `.getEvents`, `index.ts`, `react`?**
  _High betweenness centrality (0.353) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `AddLearnerModal.tsx`, `package.json`, `Volunteer`, `index.ts`, `ElectionsTab.tsx`, `AllocationTab.tsx`, `ParticipantsTab.tsx`, `csvHelper.ts`, `storageService.ts`, `CsvImportModal.tsx`, `AgendaTab.tsx`, `App.tsx`, `CollegeEvent`, `permissions.ts`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `AddLearnerModal.tsx`, `package.json`, `Volunteer`, `index.ts`, `ElectionsTab.tsx`, `AllocationTab.tsx`, `ParticipantsTab.tsx`, `csvHelper.ts`, `storageService.ts`, `CsvImportModal.tsx`, `AgendaTab.tsx`, `App.tsx`, `CollegeEvent`, `permissions.ts`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `presenceService` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Should `storageService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09747899159663866 - nodes in this community are weakly interconnected._