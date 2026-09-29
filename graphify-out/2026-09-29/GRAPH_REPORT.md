# Graph Report - TN_Assembly-  (2026-09-29)

## Corpus Check
- 130 files · ~306,430 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 985 nodes · 3935 edges · 54 communities (38 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3085b7f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- csvHelper.ts
- .getItem
- package.json
- StudentDashboard.tsx
- index.ts
- storageService
- Learner
- .saveTimerAudioConfig
- UserRole
- storageService.ts
- lucide-react
- .syncEventStateToSupabase
- presenceService
- .authenticateAccessCodeAsync
- ProceedingsTab.tsx
- aws
- .setupRealtimeSync
- compilerOptions
- .setItem
- ControlTab.tsx
- ScoreRecord
- ProceedingsMotion
- compilerOptions
- ChatMessage
- Election
- .getEvents
- devDependencies
- dependencies
- ElectionsTab.tsx
- .getAgenda
- scripts
- extract_authentic.cjs
- extract_recovered.js
- allocationEngine.ts
- test_vote_lifecycle.cjs
- FeedbackEntry
- find_full_text.cjs
- parse_complete.cjs
- EventTabRouteHandlerProps
- vite.config.ts
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- App.tsx
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 377 edges
2. `Learner` - 106 edges
3. `react` - 61 edges
4. `lucide-react` - 59 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 49 edges
7. `Committee` - 48 edges
8. `getEventSlug()` - 33 edges
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

## Communities (54 total, 12 thin omitted)

### Community 0 - "csvHelper.ts"
Cohesion: 0.09
Nodes (33): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, DownloadModal(), DownloadModalProps, ReportTab() (+25 more)

### Community 1 - ".getItem"
Cohesion: 0.09
Nodes (3): EventDay, SecurityAuditLog, StudentVoteRecord

### Community 2 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+9 more)

### Community 3 - "StudentDashboard.tsx"
Cohesion: 0.09
Nodes (40): EventTabRouteHandler(), DaysActivitiesTab(), Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect() (+32 more)

### Community 4 - "index.ts"
Cohesion: 0.11
Nodes (21): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AllocationCheckTabProps, AllocationVerificationModalProps, formatCheckedDate(), StudentAllocationCard() (+13 more)

### Community 6 - "Learner"
Cohesion: 0.14
Nodes (32): DaysActivitiesTabProps, StandaloneProjectorDisplayProps, AddLearnerModal(), AddLearnerModalProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+24 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.42
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "UserRole"
Cohesion: 0.08
Nodes (28): papaparse, SavedAuthSession, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab() (+20 more)

### Community 9 - "storageService.ts"
Cohesion: 0.09
Nodes (32): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+24 more)

### Community 10 - "lucide-react"
Cohesion: 0.13
Nodes (15): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboardProps (+7 more)

### Community 12 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 13 - ".authenticateAccessCodeAsync"
Cohesion: 0.23
Nodes (4): detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord

### Community 14 - "ProceedingsTab.tsx"
Cohesion: 0.12
Nodes (22): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ProceedingsTab(), ProceedingsTabProps, SubmissionListModal() (+14 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".setupRealtimeSync"
Cohesion: 0.09
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "ControlTab.tsx"
Cohesion: 0.09
Nodes (38): App(), getInitialRouteInfo(), getInitialSavedSession(), QuestionCallingPanel(), QuestionCallingPanelProps, ActiveNavTab, Sidebar(), SidebarProps (+30 more)

### Community 20 - "ScoreRecord"
Cohesion: 0.17
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, AggregatedScore (+2 more)

### Community 21 - "ProceedingsMotion"
Cohesion: 0.30
Nodes (3): runAuditAndLifecycleTests(), store, ProceedingsMotion

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 25 - ".getEvents"
Cohesion: 0.16
Nodes (6): EventSlugOnlyRedirector(), EventDeadline, ProceedingsQuestion, findEventBySlug(), getEventSlug(), slugify()

### Community 26 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 29 - "ElectionsTab.tsx"
Cohesion: 0.26
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

### Community 31 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 34 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

### Community 39 - "EventTabRouteHandlerProps"
Cohesion: 0.15
Nodes (12): EventTabRouteHandlerProps, VolunteerDashboardProps, uid(), BillProceeding, ChecklistItem, DayAttendanceRecord, DayAttendanceStatus, LiveFlashVote (+4 more)

### Community 40 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "App.tsx"
Cohesion: 0.08
Nodes (26): react, EditDayActivitiesModal(), EditDayActivitiesModalProps, EventOverviewTab(), EventOverviewTabProps, MyEventsDashboard(), ToastContainer(), ToastMessage (+18 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **193 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 227 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `csvHelper.ts`, `.getItem`, `StudentDashboard.tsx`, `index.ts`, `Learner`, `.saveTimerAudioConfig`, `UserRole`, `storageService.ts`, `lucide-react`, `.syncEventStateToSupabase`, `.authenticateAccessCodeAsync`, `ProceedingsTab.tsx`, `.setupRealtimeSync`, `.setItem`, `ControlTab.tsx`, `ScoreRecord`, `ProceedingsMotion`, `ChatMessage`, `Election`, `.getEvents`, `ElectionsTab.tsx`, `.getAgenda`, `FeedbackEntry`, `EventTabRouteHandlerProps`, `.getCoordinators`, `App.tsx`?**
  _High betweenness centrality (0.358) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `csvHelper.ts`, `package.json`, `StudentDashboard.tsx`, `index.ts`, `Learner`, `UserRole`, `lucide-react`, `ProceedingsTab.tsx`, `ControlTab.tsx`, `ScoreRecord`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `csvHelper.ts`, `package.json`, `StudentDashboard.tsx`, `index.ts`, `Learner`, `UserRole`, `ProceedingsTab.tsx`, `ControlTab.tsx`, `ScoreRecord`, `App.tsx`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `csvHelper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08961593172119488 - nodes in this community are weakly interconnected._
- **Should `.getItem` be split into smaller, more focused modules?**
  _Cohesion score 0.08943089430894309 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._