# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 111 files · ~268,918 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 952 nodes · 3764 edges · 41 communities (28 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5312f3fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CsvImportModal.tsx
- storageService
- package.json
- Volunteer
- Learner
- CollegeEvent
- storageService.ts
- .syncEventStateToSupabase
- presenceService
- aws
- compilerOptions
- .getLearners
- UserRole
- VolunteerDashboard.tsx
- compilerOptions
- App.tsx
- permissions.ts
- index.ts
- .hydrateFullEventData
- extract_authentic.cjs
- extract_recovered.js
- test_vote_lifecycle.cjs
- .performSyncEventStateToSupabase
- find_full_text.cjs
- parse_complete.cjs
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

## God Nodes (most connected - your core abstractions)
1. `storageService` - 360 edges
2. `Learner` - 106 edges
3. `react` - 61 edges
4. `lucide-react` - 59 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 49 edges
7. `Committee` - 48 edges
8. `getEventSlug()` - 32 edges
9. `UserRole` - 31 edges
10. `AgendaItem` - 31 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (41 total, 7 thin omitted)

### Community 0 - "CsvImportModal.tsx"
Cohesion: 0.14
Nodes (19): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile(), DuplicateRow (+11 more)

### Community 1 - "storageService"
Cohesion: 0.06
Nodes (3): storageService, uid(), LoginRecord

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 5 - "Volunteer"
Cohesion: 0.27
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

### Community 6 - "Learner"
Cohesion: 0.11
Nodes (40): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+32 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.16
Nodes (28): EventTabRouteHandlerProps, QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, ReportTabProps, ScoreGridTabProps (+20 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (70): runAuditAndLifecycleTests(), store, Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect() (+62 more)

### Community 12 - "presenceService"
Cohesion: 0.08
Nodes (15): @supabase/supabase-js, supabase, supabase, { createClient }, env, envContent, fs, sb (+7 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".getLearners"
Cohesion: 0.06
Nodes (14): genUuid(), isValidUuid(), EventDay, allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, AllocationResult (+6 more)

### Community 19 - "UserRole"
Cohesion: 0.24
Nodes (13): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ProceedingsTabProps, SubmissionListModal(), SubmissionListModalProps (+5 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.10
Nodes (24): DaysActivitiesTab(), CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, COMM_STEPS (+16 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 24 - "App.tsx"
Cohesion: 0.07
Nodes (41): react, react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps (+33 more)

### Community 26 - "permissions.ts"
Cohesion: 0.10
Nodes (17): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, TeamTab() (+9 more)

### Community 29 - "index.ts"
Cohesion: 0.07
Nodes (39): lucide-react, DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, RevealResultControls(), RevealResultControlsProps, AgendaTab(), AgendaTabProps (+31 more)

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - ".performSyncEventStateToSupabase"
Cohesion: 0.10
Nodes (17): EventSlugOnlyRedirector(), EventTabRouteHandler(), ControlTab(), ElectionsTab(), ProceedingsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+9 more)

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

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
Cohesion: 0.17
Nodes (13): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard(), MyEventsDashboardProps (+5 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **195 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+190 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 229 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CsvImportModal.tsx`, `permissions.ts`, `.getCoordinators`, `Volunteer`, `Learner`, `CollegeEvent`, `.performSyncEventStateToSupabase`, `storageService.ts`, `.syncEventStateToSupabase`, `.fetchCached`, `.getLearners`, `UserRole`, `VolunteerDashboard.tsx`, `.setItem`, `App.tsx`, `MyEventsDashboard.tsx`, `index.ts`, `.hydrateFullEventData`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `CsvImportModal.tsx`, `package.json`, `permissions.ts`, `Volunteer`, `Learner`, `CollegeEvent`, `storageService.ts`, `UserRole`, `VolunteerDashboard.tsx`, `MyEventsDashboard.tsx`, `index.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `index.ts` to `CsvImportModal.tsx`, `package.json`, `permissions.ts`, `Volunteer`, `Learner`, `CollegeEvent`, `storageService.ts`, `UserRole`, `VolunteerDashboard.tsx`, `App.tsx`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _195 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CsvImportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `storageService` be split into smaller, more focused modules?**
  _Cohesion score 0.061828952239911146 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._