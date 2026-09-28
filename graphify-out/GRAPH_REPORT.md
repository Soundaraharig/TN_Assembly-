# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 112 files · ~274,364 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 973 nodes · 3880 edges · 53 communities (42 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bda63b12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CsvImportModal.tsx
- storageService
- package.json
- ParticipantsTab.tsx
- index.ts
- StudentDashboard.tsx
- Learner
- .saveTimerAudioConfig
- permissions.ts
- storageService.ts
- csvHelper.ts
- .notify
- presenceService
- Volunteer
- VolunteerDashboard.tsx
- aws
- .setupRealtimeSync
- compilerOptions
- .getLearners
- ControlTab.tsx
- ScoreRecord
- .getEvents
- compilerOptions
- ChatMessage
- App.tsx
- MyEventsDashboard.tsx
- devDependencies
- dependencies
- CollegeEvent
- .getAgenda
- scripts
- extract_authentic.cjs
- extract_recovered.js
- Toast.tsx
- test_vote_lifecycle.cjs
- MediaTab.tsx
- find_full_text.cjs
- parse_complete.cjs
- TeamMember
- vite.config.ts
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
1. `storageService` - 370 edges
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

## Communities (53 total, 8 thin omitted)

### Community 0 - "CsvImportModal.tsx"
Cohesion: 0.14
Nodes (18): CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow, exportExistingParticipantsUpdateTemplate() (+10 more)

### Community 1 - "storageService"
Cohesion: 0.05
Nodes (3): storageService, uid(), LearnerAllocationConfirmation

### Community 2 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+9 more)

### Community 3 - "ParticipantsTab.tsx"
Cohesion: 0.24
Nodes (19): EventTabRouteHandler(), Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal() (+11 more)

### Community 4 - "index.ts"
Cohesion: 0.07
Nodes (31): runAuditAndLifecycleTests(), store, EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, AgendaTab(), AgendaTabProps (+23 more)

### Community 5 - "StudentDashboard.tsx"
Cohesion: 0.17
Nodes (16): AllocationVerificationModal(), AllocationVerificationModalProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), StudentDashboardTab, computeAllocationHash() (+8 more)

### Community 6 - "Learner"
Cohesion: 0.13
Nodes (31): DaysActivitiesTabProps, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+23 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.42
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "permissions.ts"
Cohesion: 0.13
Nodes (13): papaparse, ChecklistTab(), CommitteesTab(), JuryTab(), ALL_NOMINATION_ROLES, NominationsTab(), PartiesTab(), SHIFTS (+5 more)

### Community 9 - "storageService.ts"
Cohesion: 0.08
Nodes (41): QuestionnaireTab(), QuestionnaireTabProps, ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS (+33 more)

### Community 10 - "csvHelper.ts"
Cohesion: 0.20
Nodes (15): DownloadModal(), DownloadModalProps, ReportTab(), CSVImportResult, CustomExportOptions, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, ExportColumnDef (+7 more)

### Community 12 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 13 - "Volunteer"
Cohesion: 0.16
Nodes (9): JuryTabProps, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord (+1 more)

### Community 14 - "VolunteerDashboard.tsx"
Cohesion: 0.16
Nodes (15): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+7 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".setupRealtimeSync"
Cohesion: 0.09
Nodes (6): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getCanonicalQuestionStatus(), getRecordSessionStatuses()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".getLearners"
Cohesion: 0.08
Nodes (3): genUuid(), isValidUuid(), EventDay

### Community 19 - "ControlTab.tsx"
Cohesion: 0.10
Nodes (35): EventSlugOnlyRedirector(), MyEventsDashboard(), QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplay(), ArrangeQuestionOrderModal(), ControlTab(), ProceedingsTab() (+27 more)

### Community 20 - "ScoreRecord"
Cohesion: 0.16
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, AggregatedScore (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 24 - "App.tsx"
Cohesion: 0.17
Nodes (20): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), ActiveNavTab, Sidebar() (+12 more)

### Community 25 - "MyEventsDashboard.tsx"
Cohesion: 0.26
Nodes (9): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, HeaderProps, Coordinator (+1 more)

### Community 26 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 29 - "CollegeEvent"
Cohesion: 0.17
Nodes (27): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, ProceedingsTabProps, getProjectorSettings() (+19 more)

### Community 31 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 34 - "Toast.tsx"
Cohesion: 0.40
Nodes (3): ToastContainer(), ToastMessage, ToastProps

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

### Community 39 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

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

### Community 58 - "react"
Cohesion: 0.11
Nodes (17): lucide-react, react, EventOverviewTab(), EventOverviewTabProps, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, RevealResultControls() (+9 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **191 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 225 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CsvImportModal.tsx`, `ParticipantsTab.tsx`, `index.ts`, `StudentDashboard.tsx`, `Learner`, `.saveTimerAudioConfig`, `permissions.ts`, `storageService.ts`, `csvHelper.ts`, `.notify`, `Volunteer`, `VolunteerDashboard.tsx`, `.setupRealtimeSync`, `.getLearners`, `ControlTab.tsx`, `ScoreRecord`, `.getEvents`, `App.tsx`, `MyEventsDashboard.tsx`, `CollegeEvent`, `.getAgenda`, `react`?**
  _High betweenness centrality (0.355) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `CsvImportModal.tsx`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `StudentDashboard.tsx`, `Learner`, `permissions.ts`, `storageService.ts`, `csvHelper.ts`, `Volunteer`, `VolunteerDashboard.tsx`, `ControlTab.tsx`, `ScoreRecord`, `ChatMessage`, `App.tsx`, `MyEventsDashboard.tsx`, `CollegeEvent`, `Toast.tsx`, `MediaTab.tsx`, `TeamMember`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `CsvImportModal.tsx`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `StudentDashboard.tsx`, `Learner`, `permissions.ts`, `storageService.ts`, `csvHelper.ts`, `Volunteer`, `VolunteerDashboard.tsx`, `ControlTab.tsx`, `ScoreRecord`, `ChatMessage`, `App.tsx`, `MyEventsDashboard.tsx`, `CollegeEvent`, `Toast.tsx`, `MediaTab.tsx`, `TeamMember`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CsvImportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14210526315789473 - nodes in this community are weakly interconnected._
- **Should `storageService` be split into smaller, more focused modules?**
  _Cohesion score 0.05393939393939394 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._