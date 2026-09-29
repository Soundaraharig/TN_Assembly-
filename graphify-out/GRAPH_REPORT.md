# Graph Report - TN_Assembly-  (2026-09-29)

## Corpus Check
- 131 files · ~307,260 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 987 nodes · 3943 edges · 58 communities (39 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aefde157`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CsvImportModal.tsx
- package.json
- ParticipantsTab.tsx
- index.ts
- storageService
- Learner
- .saveTimerAudioConfig
- UserRole
- storageService.ts
- lucide-react
- .setItem
- VolunteerDashboard.tsx
- LoginRecord
- react
- aws
- .hydrateFullEventData
- compilerOptions
- .getLearners
- ControlTab.tsx
- ScoreRecord
- areJsonbObjectsEqual
- compilerOptions
- StudentDashboard.tsx
- Volunteer
- devDependencies
- dependencies
- CollegeEvent
- .setupRealtimeSync
- scripts
- extract_authentic.cjs
- extract_recovered.js
- allocationEngine.ts
- test_vote_lifecycle.cjs
- JuryDashboard.tsx
- find_full_text.cjs
- parse_complete.cjs
- csvHelper.ts
- vite.config.ts
- @supabase/supabase-js
- ParliamentQuestion
- SpeakingTurn
- SpeakingRequest
- LiveTimerState
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (58 total, 14 thin omitted)

### Community 0 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (20): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile() (+12 more)

### Community 2 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+8 more)

### Community 3 - "ParticipantsTab.tsx"
Cohesion: 0.11
Nodes (25): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatCheckedDate() (+17 more)

### Community 4 - "index.ts"
Cohesion: 0.07
Nodes (27): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab(), ChatTabProps, FeedbackTab(), FeedbackTabProps (+19 more)

### Community 6 - "Learner"
Cohesion: 0.14
Nodes (28): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+20 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.42
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "UserRole"
Cohesion: 0.10
Nodes (27): EventTabRouteHandlerProps, DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ChecklistTab(), ChecklistTabProps, JuryTab(), JuryTabProps (+19 more)

### Community 9 - "storageService.ts"
Cohesion: 0.09
Nodes (33): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+25 more)

### Community 10 - "lucide-react"
Cohesion: 0.13
Nodes (16): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+8 more)

### Community 12 - "VolunteerDashboard.tsx"
Cohesion: 0.12
Nodes (16): formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, supabase, PresenceListener, presenceService, PresenceUser (+8 more)

### Community 14 - "react"
Cohesion: 0.16
Nodes (16): react, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, INITIAL_MEDIA_GALLERY, MediaItem (+8 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "ControlTab.tsx"
Cohesion: 0.21
Nodes (22): QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplay(), ControlTab(), SpeakerDashboard(), activeSourceNodes, getSafeAudioContext(), playBellSequence() (+14 more)

### Community 20 - "ScoreRecord"
Cohesion: 0.16
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, AggregatedScore (+2 more)

### Community 21 - "areJsonbObjectsEqual"
Cohesion: 0.40
Nodes (4): runAuditAndLifecycleTests(), store, areJsonbObjectsEqual(), getComparableTimerState()

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "StudentDashboard.tsx"
Cohesion: 0.17
Nodes (14): Header(), AllocationVerificationModal(), AllocationVerificationModalProps, logVoteStateTrace(), StudentDashboard(), StudentDashboardTab, isSupabaseEnabled, supabaseAnonKey (+6 more)

### Community 24 - "Volunteer"
Cohesion: 0.16
Nodes (11): papaparse, SHIFTS, STATIONS, VolunteersTab(), VolunteersTabProps, YuvaAssignment, AccessCodeAuthResult, StudentJoinView() (+3 more)

### Community 26 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 29 - "CollegeEvent"
Cohesion: 0.17
Nodes (23): EventOverviewTab(), EventOverviewTabProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTab() (+15 more)

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

### Community 36 - "JuryDashboard.tsx"
Cohesion: 0.24
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

### Community 39 - "csvHelper.ts"
Cohesion: 0.17
Nodes (15): DownloadModal(), DownloadModalProps, ProceedingsTabProps, ReportTab(), ReportTabProps, BillProceeding, CSVImportResult, deduplicateLearners() (+7 more)

### Community 40 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 41 - "@supabase/supabase-js"
Cohesion: 0.29
Nodes (3): @supabase/supabase-js, supabase, supabase

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

### Community 58 - "App.tsx"
Cohesion: 0.11
Nodes (30): react-router-dom, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab() (+22 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **193 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+188 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 227 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CsvImportModal.tsx`, `.persistEventDaysToSocialCoverage`, `ParticipantsTab.tsx`, `index.ts`, `Learner`, `.saveTimerAudioConfig`, `UserRole`, `storageService.ts`, `lucide-react`, `.setItem`, `VolunteerDashboard.tsx`, `LoginRecord`, `react`, `.hydrateFullEventData`, `.getLearners`, `ControlTab.tsx`, `ScoreRecord`, `StudentDashboard.tsx`, `Volunteer`, `.getItem`, `CollegeEvent`, `.setupRealtimeSync`, `JuryDashboard.tsx`, `csvHelper.ts`, `ParliamentQuestion`, `SpeakingTurn`, `SpeakingRequest`, `LiveTimerState`, `App.tsx`?**
  _High betweenness centrality (0.357) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `CsvImportModal.tsx`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `JuryDashboard.tsx`, `Learner`, `csvHelper.ts`, `UserRole`, `lucide-react`, `ParliamentQuestion`, `VolunteerDashboard.tsx`, `ControlTab.tsx`, `ScoreRecord`, `StudentDashboard.tsx`, `Volunteer`, `App.tsx`, `CollegeEvent`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `CsvImportModal.tsx`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `JuryDashboard.tsx`, `Learner`, `csvHelper.ts`, `UserRole`, `ParliamentQuestion`, `VolunteerDashboard.tsx`, `react`, `ControlTab.tsx`, `ScoreRecord`, `StudentDashboard.tsx`, `Volunteer`, `App.tsx`, `CollegeEvent`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _193 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CsvImportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `ParticipantsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11265969802555169 - nodes in this community are weakly interconnected._