# Graph Report - TN_Assembly-  (2026-09-29)

## Corpus Check
- 130 files · ~304,520 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 979 nodes · 3905 edges · 55 communities (39 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27b72459`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- csvHelper.ts
- .setItem
- package.json
- ParticipantsTab.tsx
- index.ts
- storageService
- Learner
- .saveTimerAudioConfig
- UserRole
- storageService.ts
- .syncEventStateToSupabase
- presenceService
- .authenticateAccessCodeAsync
- VolunteerDashboard.tsx
- aws
- .setupRealtimeSync
- compilerOptions
- .invalidateCache
- CollegeEvent
- ScoreRecord
- compilerOptions
- ChatMessage
- App.tsx
- getEventSlug
- devDependencies
- dependencies
- ElectionsTab.tsx
- scripts
- extract_authentic.cjs
- extract_recovered.js
- allocationEngine.ts
- test_vote_lifecycle.cjs
- AgendaTab.tsx
- find_full_text.cjs
- parse_complete.cjs
- EventTabRouteHandlerProps
- vite.config.ts
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
1. `storageService` - 373 edges
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
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (55 total, 9 thin omitted)

### Community 0 - "csvHelper.ts"
Cohesion: 0.09
Nodes (32): CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), ReportTab(), TN_CONSTITUENCIES, TNConstituency, generateAccessCode() (+24 more)

### Community 2 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+9 more)

### Community 3 - "ParticipantsTab.tsx"
Cohesion: 0.21
Nodes (21): EventTabRouteHandler(), Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal() (+13 more)

### Community 4 - "index.ts"
Cohesion: 0.07
Nodes (28): runAuditAndLifecycleTests(), store, EditDayActivitiesModal(), EditDayActivitiesModalProps, FeedbackTab(), FeedbackTabProps, AggregatedScore, AssemblyElection (+20 more)

### Community 6 - "Learner"
Cohesion: 0.13
Nodes (32): DaysActivitiesTabProps, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+24 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.42
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "UserRole"
Cohesion: 0.10
Nodes (24): papaparse, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModalProps, ChecklistTab(), ChecklistTabProps, JuryTab() (+16 more)

### Community 9 - "storageService.ts"
Cohesion: 0.11
Nodes (27): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+19 more)

### Community 11 - ".syncEventStateToSupabase"
Cohesion: 0.10
Nodes (3): uid(), ElectionBackupSnapshot, ProjectorStudioSettings

### Community 12 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 14 - "VolunteerDashboard.tsx"
Cohesion: 0.18
Nodes (14): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+6 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".setupRealtimeSync"
Cohesion: 0.11
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "CollegeEvent"
Cohesion: 0.07
Nodes (54): EventOverviewTab(), EventOverviewTabProps, QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplay(), StandaloneProjectorDisplayProps, ArrangeQuestionOrderModal(), ControlTab() (+46 more)

### Community 20 - "ScoreRecord"
Cohesion: 0.24
Nodes (9): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoreRecord (+1 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 24 - "App.tsx"
Cohesion: 0.14
Nodes (22): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), ActiveNavTab, Sidebar() (+14 more)

### Community 25 - "getEventSlug"
Cohesion: 0.09
Nodes (24): EventSlugOnlyRedirector(), CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+16 more)

### Community 26 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 29 - "ElectionsTab.tsx"
Cohesion: 0.20
Nodes (9): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, BillVote, ElectionCandidate, FlashVoteAudience, LoginRecord (+1 more)

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

### Community 36 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

### Community 39 - "EventTabRouteHandlerProps"
Cohesion: 0.23
Nodes (12): EventTabRouteHandlerProps, AccessCodeAuthResult, StudentJoinViewProps, VolunteerDashboardProps, BillProceeding, ChecklistItem, DayAttendanceRecord, DayAttendanceStatus (+4 more)

### Community 40 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 42 - "ParliamentQuestion"
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
Cohesion: 0.12
Nodes (13): lucide-react, react, OrganizerSignInProps, AwardsTab(), AwardsTabProps, ChapterAwardsTab(), ChapterAwardsTabProps, INITIAL_MEDIA_GALLERY (+5 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **193 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 227 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `csvHelper.ts`, `.setItem`, `ParticipantsTab.tsx`, `index.ts`, `Learner`, `.saveTimerAudioConfig`, `UserRole`, `storageService.ts`, `.performSyncEventStateToSupabase`, `.syncEventStateToSupabase`, `.authenticateAccessCodeAsync`, `VolunteerDashboard.tsx`, `.setupRealtimeSync`, `.invalidateCache`, `CollegeEvent`, `ScoreRecord`, `.getEvents`, `App.tsx`, `getEventSlug`, `ElectionsTab.tsx`, `.getAgenda`, `AgendaTab.tsx`, `EventTabRouteHandlerProps`, `.getCoordinators`, `ParliamentQuestion`, `react`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `csvHelper.ts`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `AgendaTab.tsx`, `Learner`, `EventTabRouteHandlerProps`, `UserRole`, `ParliamentQuestion`, `VolunteerDashboard.tsx`, `CollegeEvent`, `ScoreRecord`, `ChatMessage`, `App.tsx`, `getEventSlug`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `csvHelper.ts`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `AgendaTab.tsx`, `Learner`, `EventTabRouteHandlerProps`, `UserRole`, `ParliamentQuestion`, `VolunteerDashboard.tsx`, `CollegeEvent`, `ScoreRecord`, `ChatMessage`, `App.tsx`, `getEventSlug`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `csvHelper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09176788124156546 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.07344632768361582 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._