# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 112 files · ~272,633 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 968 nodes · 3842 edges · 46 communities (35 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `328f7012`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CsvImportModal.tsx
- .getItem
- package.json
- ParticipantsTab.tsx
- index.ts
- Learner
- csvHelper.ts
- VolunteerDashboard.tsx
- storageService.ts
- presenceService.ts
- aws
- storageService
- compilerOptions
- .getLearners
- CollegeEvent
- JuryDashboard.tsx
- .getEvents
- compilerOptions
- App.tsx
- presenceService
- VolunteersTab.tsx
- Header.tsx
- Nomination
- .setupRealtimeSync
- extract_authentic.cjs
- extract_recovered.js
- test_vote_lifecycle.cjs
- isSpeakerRole
- find_full_text.cjs
- parse_complete.cjs
- FeedbackEntry
- MediaTab.tsx
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
1. `storageService` - 365 edges
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

## Communities (46 total, 7 thin omitted)

### Community 0 - "CsvImportModal.tsx"
Cohesion: 0.14
Nodes (19): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile(), DuplicateRow (+11 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "ParticipantsTab.tsx"
Cohesion: 0.27
Nodes (15): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), NominationsTab(), ParticipantsTab() (+7 more)

### Community 4 - "index.ts"
Cohesion: 0.10
Nodes (23): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, QuestionnaireTab(), QuestionnaireTabProps, AgendaCategory, AgendaDay (+15 more)

### Community 6 - "Learner"
Cohesion: 0.15
Nodes (27): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+19 more)

### Community 7 - "csvHelper.ts"
Cohesion: 0.21
Nodes (14): DownloadModal(), DownloadModalProps, ReportTab(), ReportTabProps, CSVImportResult, CustomExportOptions, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY (+6 more)

### Community 8 - "VolunteerDashboard.tsx"
Cohesion: 0.09
Nodes (29): EventTabRouteHandlerProps, DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ChecklistTab(), ChecklistTabProps, ParticipantsTabProps (+21 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (57): runAuditAndLifecycleTests(), store, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT (+49 more)

### Community 12 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "storageService"
Cohesion: 0.08
Nodes (3): storageService, LearnerAllocationConfirmation, LoginRecord

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".getLearners"
Cohesion: 0.07
Nodes (9): JuryTabProps, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, genUuid(), isValidUuid(), ElectionCandidate, JuryMember (+1 more)

### Community 19 - "CollegeEvent"
Cohesion: 0.06
Nodes (57): EventOverviewTab(), EventOverviewTabProps, QuestionCallingPanel(), QuestionCallingPanelProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, ArrangeQuestionOrderModal() (+49 more)

### Community 20 - "JuryDashboard.tsx"
Cohesion: 0.11
Nodes (16): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, COMM_STEPS (+8 more)

### Community 21 - ".getEvents"
Cohesion: 0.14
Nodes (3): EventSlugOnlyRedirector(), findEventBySlug(), getEventSlug()

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 24 - "App.tsx"
Cohesion: 0.11
Nodes (26): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps (+18 more)

### Community 26 - "VolunteersTab.tsx"
Cohesion: 0.20
Nodes (10): papaparse, CommitteesTab(), JuryTab(), SHIFTS, STATIONS, VolunteersTab(), VolunteersTabProps, YuvaAssignment (+2 more)

### Community 28 - "Header.tsx"
Cohesion: 0.24
Nodes (9): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModalProps, JuryDashboard(), applyTheme(), Theme, useTheme() (+1 more)

### Community 29 - "Nomination"
Cohesion: 0.40
Nodes (5): ElectionsTabProps, ALL_NOMINATION_ROLES, NominationsTabProps, Nomination, NominationPosition

### Community 30 - ".setupRealtimeSync"
Cohesion: 0.10
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), EventAgendaProgress

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "isSpeakerRole"
Cohesion: 0.43
Nodes (7): EventTabRouteHandler(), Header(), SpeakerDashboard(), StudentDashboard(), isDeputySpeakerRole(), isPresidingOfficerRole(), isSpeakerRole()

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

### Community 39 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 40 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

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
Nodes (19): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+11 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **191 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 224 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CsvImportModal.tsx`, `.getItem`, `ParticipantsTab.tsx`, `index.ts`, `Learner`, `csvHelper.ts`, `VolunteerDashboard.tsx`, `storageService.ts`, `.setItem`, `.getLearners`, `CollegeEvent`, `JuryDashboard.tsx`, `.getEvents`, `App.tsx`, `VolunteersTab.tsx`, `Header.tsx`, `.setupRealtimeSync`, `isSpeakerRole`, `FeedbackEntry`, `react`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `CsvImportModal.tsx`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `Learner`, `csvHelper.ts`, `VolunteerDashboard.tsx`, `FeedbackEntry`, `MediaTab.tsx`, `storageService.ts`, `.getLearners`, `CollegeEvent`, `JuryDashboard.tsx`, `App.tsx`, `VolunteersTab.tsx`, `Header.tsx`, `Nomination`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `CsvImportModal.tsx`, `package.json`, `ParticipantsTab.tsx`, `index.ts`, `Learner`, `csvHelper.ts`, `VolunteerDashboard.tsx`, `FeedbackEntry`, `MediaTab.tsx`, `storageService.ts`, `.getLearners`, `CollegeEvent`, `JuryDashboard.tsx`, `App.tsx`, `VolunteersTab.tsx`, `Header.tsx`, `Nomination`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CsvImportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `.getItem` be split into smaller, more focused modules?**
  _Cohesion score 0.09803921568627451 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._