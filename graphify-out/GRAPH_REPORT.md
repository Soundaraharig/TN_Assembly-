# Graph Report - TN_Assembly-  (2026-09-21)

## Corpus Check
- 90 files · ~206,726 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 812 nodes · 3115 edges · 33 communities (21 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `760ba255`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- csvHelper.ts
- package.json
- .sbUpsert
- index.ts
- storageService.ts
- UserRole
- .getActiveEventId
- .setItem
- CsvImportModal.tsx
- aws
- compilerOptions
- Committee
- App.tsx
- compilerOptions
- .performSyncEventStateToSupabase
- .getEvents
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
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `EventTabRouteHandlerProps` --references--> `ChecklistItem`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (33 total, 8 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.14
Nodes (23): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+15 more)

### Community 1 - "csvHelper.ts"
Cohesion: 0.19
Nodes (15): DownloadModal(), DownloadModalProps, ReportTab(), ReportTabProps, CSVImportResult, CustomExportOptions, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY (+7 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 5 - "index.ts"
Cohesion: 0.13
Nodes (17): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ElectionsTabProps, AgendaCategory, AgendaDay, AgendaStatus (+9 more)

### Community 7 - "storageService.ts"
Cohesion: 0.05
Nodes (57): AllocationCheckTab(), formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, INITIAL_AGENDA (+49 more)

### Community 8 - "UserRole"
Cohesion: 0.10
Nodes (23): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+15 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.11
Nodes (22): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, TN_CONSTITUENCIES, TNConstituency, CSVImportStats (+14 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "Committee"
Cohesion: 0.22
Nodes (16): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ParticipantsTabProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard() (+8 more)

### Community 19 - "App.tsx"
Cohesion: 0.05
Nodes (75): react-router-dom, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), EventTabRouteHandlerProps, getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession (+67 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 25 - ".performSyncEventStateToSupabase"
Cohesion: 0.15
Nodes (16): AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), getResolvedLearnerBench(), getResolvedPartyName(), isAssemblyRoleMatching() (+8 more)

### Community 28 - ".getEvents"
Cohesion: 0.12
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
Cohesion: 0.20
Nodes (8): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), OrganizerSignInProps, StudentLoginGatewayProps, generateRandomPassword()

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 90 - "JuryDashboard.tsx"
Cohesion: 0.06
Nodes (32): @supabase/supabase-js, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, CategoryId, getCategoryScoreFromRecord(), isParticipantActive() (+24 more)

### Community 94 - "storageService"
Cohesion: 0.06
Nodes (3): storageService, uid(), LearnerAllocationConfirmation

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `csvHelper.ts`, `.getLearners`, `.sbUpsert`, `index.ts`, `storageService.ts`, `UserRole`, `.getEventDays`, `.getActiveEventId`, `.setItem`, `CsvImportModal.tsx`, `Committee`, `App.tsx`, `.performSyncEventStateToSupabase`, `JuryDashboard.tsx`, `.getEvents`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `csvHelper.ts`, `package.json`, `index.ts`, `storageService.ts`, `UserRole`, `CsvImportModal.tsx`, `Committee`, `App.tsx`, `.performSyncEventStateToSupabase`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `csvHelper.ts`, `package.json`, `index.ts`, `storageService.ts`, `UserRole`, `CsvImportModal.tsx`, `Committee`, `App.tsx`, `.performSyncEventStateToSupabase`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.14260249554367202 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `.getLearners` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._