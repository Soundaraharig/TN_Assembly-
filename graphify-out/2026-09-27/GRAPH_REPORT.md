# Graph Report - TN_Assembly-  (2026-09-27)

## Corpus Check
- 102 files · ~255,370 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 915 nodes · 3657 edges · 48 communities (32 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c3e57913`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- @supabase/supabase-js
- .invalidateCache
- Volunteer
- CsvImportModal.tsx
- CollegeEvent
- devDependencies
- storageService.ts
- ControlTab.tsx
- .notify
- presenceService
- index.ts
- App.tsx
- aws
- .unpackAndApplyEventState
- compilerOptions
- storageService
- dependencies
- VolunteerDashboard.tsx
- scripts
- compilerOptions
- JuryDashboard.tsx
- isSpeakerRole
- getEventSlug
- UserRole
- csvHelper.ts
- SpeakingRequest
- ParticipantsTab.tsx
- allocationEngine.ts
- vite.config.ts
- test_vote_lifecycle.cjs
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
1. `storageService` - 353 edges
2. `Learner` - 104 edges
3. `react` - 60 edges
4. `lucide-react` - 58 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 49 edges
7. `Committee` - 48 edges
8. `getEventSlug()` - 32 edges
9. `UserRole` - 31 edges
10. `AgendaItem` - 30 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (48 total, 11 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.17
Nodes (22): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AnalyticsTab(), AnalyticsTabProps, CabinetTabProps (+14 more)

### Community 2 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+8 more)

### Community 3 - "@supabase/supabase-js"
Cohesion: 0.29
Nodes (3): @supabase/supabase-js, supabase, supabase

### Community 5 - "Volunteer"
Cohesion: 0.09
Nodes (17): formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, computeAllocationHash(), detectDeviceType() (+9 more)

### Community 6 - "CsvImportModal.tsx"
Cohesion: 0.10
Nodes (23): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, EditLearnerModal(), EditLearnerModalProps, TN_CONSTITUENCIES (+15 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.22
Nodes (19): EventTabRouteHandlerProps, EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ElectionsTabProps, ProjectorTabProps, JuryDashboardProps (+11 more)

### Community 8 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 9 - "storageService.ts"
Cohesion: 0.10
Nodes (30): QuestionnaireTab(), QuestionnaireTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS (+22 more)

### Community 10 - "ControlTab.tsx"
Cohesion: 0.18
Nodes (17): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ControlTab(), ProceedingsTab(), ProceedingsTabProps (+9 more)

### Community 13 - "index.ts"
Cohesion: 0.08
Nodes (28): runAuditAndLifecycleTests(), store, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, TeamTab(), TeamTabProps (+20 more)

### Community 14 - "App.tsx"
Cohesion: 0.09
Nodes (27): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), ActiveNavTab, Sidebar(), SidebarProps, AwardsTab() (+19 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".unpackAndApplyEventState"
Cohesion: 0.11
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.10
Nodes (20): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), VolunteerDashboardProps (+12 more)

### Community 21 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "JuryDashboard.tsx"
Cohesion: 0.10
Nodes (17): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, COMM_STEPS (+9 more)

### Community 24 - "isSpeakerRole"
Cohesion: 0.17
Nodes (20): EventTabRouteHandler(), Header(), CabinetTab(), SpeakerDashboard(), StudentDashboard(), getMinisterAssignedMinistry(), isAssemblyRoleMatching(), isChiefMinisterRole() (+12 more)

### Community 25 - "getEventSlug"
Cohesion: 0.20
Nodes (15): EventSlugOnlyRedirector(), MyEventsDashboard(), StandaloneProjectorDisplay(), CONSTITUTIONAL_POSTS, ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+7 more)

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (19): papaparse, SavedAuthSession, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps (+11 more)

### Community 28 - "csvHelper.ts"
Cohesion: 0.23
Nodes (13): DownloadModal(), DownloadModalProps, ReportTab(), CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData(), exportFullParticipantDataToCSV() (+5 more)

### Community 31 - "ParticipantsTab.tsx"
Cohesion: 0.32
Nodes (11): AllocationCheckTab(), AllocationTab(), AllocationTabProps, SearchableDelegateSelect(), ParticipantsTab(), getResolvedCommitteeName(), getResolvedLearnerBench(), getResolvedPartyName() (+3 more)

### Community 32 - "allocationEngine.ts"
Cohesion: 0.25
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 33 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

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
Cohesion: 0.07
Nodes (28): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+20 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **176 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 209 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `.invalidateCache`, `Volunteer`, `CsvImportModal.tsx`, `CollegeEvent`, `storageService.ts`, `ControlTab.tsx`, `.notify`, `index.ts`, `App.tsx`, `.unpackAndApplyEventState`, `VolunteerDashboard.tsx`, `JuryDashboard.tsx`, `isSpeakerRole`, `getEventSlug`, `UserRole`, `csvHelper.ts`, `.getItem`, `SpeakingRequest`, `ParticipantsTab.tsx`, `allocationEngine.ts`, `.getEvents`, `react`?**
  _High betweenness centrality (0.363) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `Volunteer`, `CsvImportModal.tsx`, `CollegeEvent`, `storageService.ts`, `ControlTab.tsx`, `index.ts`, `App.tsx`, `VolunteerDashboard.tsx`, `JuryDashboard.tsx`, `isSpeakerRole`, `getEventSlug`, `UserRole`, `csvHelper.ts`, `ParticipantsTab.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `package.json`, `Volunteer`, `CsvImportModal.tsx`, `CollegeEvent`, `storageService.ts`, `ControlTab.tsx`, `index.ts`, `App.tsx`, `VolunteerDashboard.tsx`, `JuryDashboard.tsx`, `isSpeakerRole`, `getEventSlug`, `UserRole`, `csvHelper.ts`, `ParticipantsTab.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _176 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.135632183908046 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `.invalidateCache` be split into smaller, more focused modules?**
  _Cohesion score 0.09397163120567376 - nodes in this community are weakly interconnected._