# Graph Report - TN_Assembly-  (2026-09-27)

## Corpus Check
- 101 files · ~251,071 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 906 nodes · 3613 edges · 42 communities (26 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c41ce90f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- presenceService.ts
- .invalidateCache
- Volunteer
- csvHelper.ts
- CollegeEvent
- devDependencies
- storageService.ts
- react
- .notify
- presenceService
- index.ts
- App.tsx
- aws
- storageService
- compilerOptions
- VolunteerDashboard.tsx
- dependencies
- EventDay
- scripts
- compilerOptions
- JuryDashboard.tsx
- UserRole
- .performSyncEventStateToSupabase
- SpeakingRequest
- .getEvents
- test_vote_lifecycle.cjs
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
1. `storageService` - 353 edges
2. `Learner` - 103 edges
3. `react` - 60 edges
4. `lucide-react` - 58 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 49 edges
7. `Committee` - 48 edges
8. `getEventSlug()` - 32 edges
9. `UserRole` - 31 edges
10. `AgendaItem` - 30 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (42 total, 13 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.16
Nodes (28): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+20 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+11 more)

### Community 3 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 5 - "Volunteer"
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 6 - "csvHelper.ts"
Cohesion: 0.09
Nodes (33): papaparse, xlsx, CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), TN_CONSTITUENCIES, TNConstituency (+25 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.18
Nodes (25): EventTabRouteHandlerProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ProjectorTabProps (+17 more)

### Community 8 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (72): runAuditAndLifecycleTests(), store, Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect() (+64 more)

### Community 10 - "react"
Cohesion: 0.22
Nodes (13): react, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal(), ProceedingsTab(), SubmissionListModal(), SubmissionListModalProps (+5 more)

### Community 13 - "index.ts"
Cohesion: 0.08
Nodes (28): EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, FeedbackTab() (+20 more)

### Community 14 - "App.tsx"
Cohesion: 0.07
Nodes (35): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+27 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "VolunteerDashboard.tsx"
Cohesion: 0.29
Nodes (10): DaysActivitiesTab(), DaysActivitiesTabProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, DayAttendanceStatus, formatMarkedBy() (+2 more)

### Community 19 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 21 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "JuryDashboard.tsx"
Cohesion: 0.13
Nodes (14): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, COMM_STEPS (+6 more)

### Community 26 - "UserRole"
Cohesion: 0.09
Nodes (23): ArrangeQuestionOrderModalProps, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+15 more)

### Community 29 - ".performSyncEventStateToSupabase"
Cohesion: 0.09
Nodes (17): EventSlugOnlyRedirector(), EventTabRouteHandler(), ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), deduplicateElectionList(), getElectionCanonicalKey() (+9 more)

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

### Community 58 - "lucide-react"
Cohesion: 0.13
Nodes (15): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), MyEventsDashboard(), MyEventsDashboardProps (+7 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `.invalidateCache`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `storageService.ts`, `react`, `.notify`, `index.ts`, `App.tsx`, `VolunteerDashboard.tsx`, `EventDay`, `JuryDashboard.tsx`, `UserRole`, `.performSyncEventStateToSupabase`, `SpeakingRequest`, `.getEvents`, `lucide-react`?**
  _High betweenness centrality (0.365) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `UserRole`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `storageService.ts`, `index.ts`, `App.tsx`, `VolunteerDashboard.tsx`, `JuryDashboard.tsx`, `lucide-react`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `package.json`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `storageService.ts`, `react`, `index.ts`, `App.tsx`, `VolunteerDashboard.tsx`, `JuryDashboard.tsx`, `UserRole`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.07175141242937853 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._
- **Should `.invalidateCache` be split into smaller, more focused modules?**
  _Cohesion score 0.14102564102564102 - nodes in this community are weakly interconnected._