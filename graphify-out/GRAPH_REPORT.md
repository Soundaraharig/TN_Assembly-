# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 111 files · ~271,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 959 nodes · 3809 edges · 60 communities (39 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22b96a4a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- csvHelper.ts
- .setItem
- package.json
- ParticipantsTab.tsx
- index.ts
- Volunteer
- Learner
- CollegeEvent
- EventDay
- storageService.ts
- allocationEngine.ts
- presenceService.ts
- audioAlert.ts
- aws
- storageService
- compilerOptions
- .getLearners
- ControlTab.tsx
- JuryDashboard.tsx
- .getItem
- compilerOptions
- AllocationCheckTab.tsx
- App.tsx
- presenceService
- UserRole
- Header.tsx
- react
- .setupRealtimeSync
- VolunteerDashboard
- extract_authentic.cjs
- extract_recovered.js
- Toast.tsx
- test_vote_lifecycle.cjs
- getEventSlug
- find_full_text.cjs
- parse_complete.cjs
- FeedbackEntry
- MediaTab.tsx
- ParliamentQuestion
- LoginRecord
- verify_all_vote_lifecycles.ts
- getMinisterAssignedMinistry
- .getElectionSnapshots
- .oxlintrc.json
- .getVoteAuditLog
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
1. `storageService` - 363 edges
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
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (60 total, 15 thin omitted)

### Community 0 - "csvHelper.ts"
Cohesion: 0.10
Nodes (32): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, ReportTab(), TN_CONSTITUENCIES, TNConstituency, generateAccessCode() (+24 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "ParticipantsTab.tsx"
Cohesion: 0.20
Nodes (22): Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), NominationsTab() (+14 more)

### Community 4 - "index.ts"
Cohesion: 0.11
Nodes (20): EditDayActivitiesModal(), EditDayActivitiesModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay (+12 more)

### Community 5 - "Volunteer"
Cohesion: 0.27
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

### Community 6 - "Learner"
Cohesion: 0.16
Nodes (27): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+19 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.17
Nodes (25): EventTabRouteHandlerProps, DaysActivitiesTabProps, EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProceedingsTabProps, ProjectorTabProps, ReportTabProps (+17 more)

### Community 9 - "storageService.ts"
Cohesion: 0.08
Nodes (35): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+27 more)

### Community 10 - "allocationEngine.ts"
Cohesion: 0.25
Nodes (11): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, AllocationResult, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions (+3 more)

### Community 12 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 14 - "audioAlert.ts"
Cohesion: 0.40
Nodes (10): ControlTab(), TimerAudioConfig, activeSourceNodes, getSafeAudioContext(), playBellSequence(), playChimeSequence(), playCustomAudio(), playGavelSequence() (+2 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "ControlTab.tsx"
Cohesion: 0.17
Nodes (18): QuestionCallingPanel(), QuestionCallingPanelProps, ArrangeQuestionOrderModal(), ProceedingsTab(), SubmissionListModal(), SubmissionListModalProps, SubmittedMemberRecord, getCanonicalQuestionStatus() (+10 more)

### Community 20 - "JuryDashboard.tsx"
Cohesion: 0.13
Nodes (16): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, COMM_STEPS, CONDUCT_STEPS (+8 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "AllocationCheckTab.tsx"
Cohesion: 0.39
Nodes (6): formatCheckedDate(), StudentAllocationCard(), computeAllocationHash(), getAllocationCheckStatus(), isAllocationComplete(), LearnerAllocationConfirmation

### Community 24 - "App.tsx"
Cohesion: 0.12
Nodes (25): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), EventOverviewTab(), ActiveNavTab (+17 more)

### Community 26 - "UserRole"
Cohesion: 0.11
Nodes (19): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, TeamTab() (+11 more)

### Community 28 - "Header.tsx"
Cohesion: 0.43
Nodes (6): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModalProps, Theme, UserSession

### Community 29 - "react"
Cohesion: 0.10
Nodes (19): react, OrganizerSignInProps, RevealResultControls(), RevealResultControlsProps, AwardsTabProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ALL_NOMINATION_ROLES (+11 more)

### Community 30 - ".setupRealtimeSync"
Cohesion: 0.12
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 31 - "VolunteerDashboard"
Cohesion: 0.36
Nodes (7): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard()

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

### Community 36 - "getEventSlug"
Cohesion: 0.50
Nodes (6): EventSlugOnlyRedirector(), EventTabRouteHandler(), EventDeadline, findEventBySlug(), getEventSlug(), slugify()

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

### Community 42 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 45 - "getMinisterAssignedMinistry"
Cohesion: 0.67
Nodes (3): getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey()

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
Cohesion: 0.18
Nodes (14): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+6 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **191 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 224 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `csvHelper.ts`, `.setItem`, `ParticipantsTab.tsx`, `index.ts`, `Volunteer`, `Learner`, `CollegeEvent`, `EventDay`, `storageService.ts`, `allocationEngine.ts`, `.notify`, `.getAgenda`, `.getLearners`, `ControlTab.tsx`, `JuryDashboard.tsx`, `.getItem`, `AllocationCheckTab.tsx`, `App.tsx`, `UserRole`, `react`, `.setupRealtimeSync`, `VolunteerDashboard`, `getEventSlug`, `FeedbackEntry`, `.getScores`, `ParliamentQuestion`, `LoginRecord`, `.getElectionSnapshots`, `.getVoteAuditLog`, `lucide-react`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `csvHelper.ts`, `package.json`, `Toast.tsx`, `index.ts`, `ParticipantsTab.tsx`, `Learner`, `CollegeEvent`, `UserRole`, `FeedbackEntry`, `MediaTab.tsx`, `ParliamentQuestion`, `Volunteer`, `ControlTab.tsx`, `JuryDashboard.tsx`, `AllocationCheckTab.tsx`, `App.tsx`, `lucide-react`, `Header.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `csvHelper.ts`, `package.json`, `Toast.tsx`, `index.ts`, `ParticipantsTab.tsx`, `Learner`, `CollegeEvent`, `FeedbackEntry`, `MediaTab.tsx`, `ParliamentQuestion`, `Volunteer`, `ControlTab.tsx`, `JuryDashboard.tsx`, `AllocationCheckTab.tsx`, `App.tsx`, `UserRole`, `Header.tsx`, `react`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `csvHelper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.07200929152148665 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._