# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 112 files · ~273,213 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 970 nodes · 3852 edges · 49 communities (35 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2b3796f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- csvHelper.ts
- storageService
- package.json
- StudentDashboard.tsx
- AgendaTab.tsx
- getEventSlug
- Learner
- audioAlert.ts
- index.ts
- storageService.ts
- allocationEngine.ts
- .notify
- presenceService
- .authenticateAccessCodeAsync
- VolunteerDashboard.tsx
- aws
- .unpackAndApplyEventState
- compilerOptions
- .getLearners
- CollegeEvent
- ScoreGridTab.tsx
- compilerOptions
- ChatMessage
- App.tsx
- ParliamentQuestion
- Nomination
- ElectionsTab.tsx
- extract_authentic.cjs
- extract_recovered.js
- test_vote_lifecycle.cjs
- find_full_text.cjs
- parse_complete.cjs
- FeedbackEntry
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
1. `storageService` - 367 edges
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

## Communities (49 total, 8 thin omitted)

### Community 0 - "csvHelper.ts"
Cohesion: 0.09
Nodes (33): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), EditLearnerModal(), ReportTab(), TN_CONSTITUENCIES (+25 more)

### Community 1 - "storageService"
Cohesion: 0.06
Nodes (4): storageService, uid(), SpeakingRequest, SpeakingTurn

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "StudentDashboard.tsx"
Cohesion: 0.12
Nodes (34): EventTabRouteHandler(), Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab() (+26 more)

### Community 4 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 5 - "getEventSlug"
Cohesion: 0.15
Nodes (12): EventSlugOnlyRedirector(), MyEventsDashboard(), ProceedingsTab(), SubmissionListModal(), SubmissionListModalProps, SubmittedMemberRecord, EventDeadline, getCanonicalQuestionStatus() (+4 more)

### Community 6 - "Learner"
Cohesion: 0.14
Nodes (35): EventTabRouteHandlerProps, DaysActivitiesTabProps, MyEventsDashboardProps, AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps (+27 more)

### Community 7 - "audioAlert.ts"
Cohesion: 0.20
Nodes (16): ControlTab(), TimerAudioConfig, activeSourceNodes, getSafeAudioContext(), playBellSequence(), playChimeSequence(), playCustomAudio(), playGavelSequence() (+8 more)

### Community 8 - "index.ts"
Cohesion: 0.06
Nodes (39): papaparse, EditDayActivitiesModal(), EditDayActivitiesModalProps, ChecklistTab(), ChecklistTabProps, JuryTab(), ALL_NOMINATION_ROLES, NominationsTab() (+31 more)

### Community 9 - "storageService.ts"
Cohesion: 0.08
Nodes (33): runAuditAndLifecycleTests(), store, ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS (+25 more)

### Community 10 - "allocationEngine.ts"
Cohesion: 0.24
Nodes (12): AcademicYear, allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, AllocationResult, CommitteeAllocationOptions, computeAllocationStats() (+4 more)

### Community 12 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 14 - "VolunteerDashboard.tsx"
Cohesion: 0.39
Nodes (8): DaysActivitiesTab(), formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, formatMarkedBy(), getRecordSessionStatuses(), canReviewQuestions()

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".unpackAndApplyEventState"
Cohesion: 0.08
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), LearnerAllocationConfirmation

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".getLearners"
Cohesion: 0.06
Nodes (9): JuryTabProps, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, genUuid(), isValidUuid(), EventDay, JuryMember (+1 more)

### Community 19 - "CollegeEvent"
Cohesion: 0.17
Nodes (23): QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplayProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ControlTabProps, ProjectorTabProps, ScoreGridTabProps (+15 more)

### Community 20 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 24 - "App.tsx"
Cohesion: 0.09
Nodes (30): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+22 more)

### Community 25 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 29 - "ElectionsTab.tsx"
Cohesion: 0.22
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

### Community 39 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

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
Cohesion: 0.08
Nodes (31): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+23 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **191 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 224 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `csvHelper.ts`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `getEventSlug`, `Learner`, `audioAlert.ts`, `index.ts`, `storageService.ts`, `allocationEngine.ts`, `.notify`, `.authenticateAccessCodeAsync`, `VolunteerDashboard.tsx`, `.unpackAndApplyEventState`, `.getLearners`, `CollegeEvent`, `ScoreGridTab.tsx`, `.setItem`, `ChatMessage`, `App.tsx`, `ParliamentQuestion`, `Nomination`, `.getCoordinators`, `ElectionsTab.tsx`, `.getAgenda`, `FeedbackEntry`, `react`?**
  _High betweenness centrality (0.352) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `csvHelper.ts`, `package.json`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `getEventSlug`, `Learner`, `FeedbackEntry`, `index.ts`, `VolunteerDashboard.tsx`, `.getLearners`, `CollegeEvent`, `ScoreGridTab.tsx`, `ChatMessage`, `App.tsx`, `ParliamentQuestion`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `csvHelper.ts`, `package.json`, `StudentDashboard.tsx`, `AgendaTab.tsx`, `getEventSlug`, `Learner`, `FeedbackEntry`, `index.ts`, `VolunteerDashboard.tsx`, `.getLearners`, `CollegeEvent`, `ScoreGridTab.tsx`, `ChatMessage`, `App.tsx`, `ParliamentQuestion`, `ElectionsTab.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `csvHelper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08846153846153847 - nodes in this community are weakly interconnected._
- **Should `storageService` be split into smaller, more focused modules?**
  _Cohesion score 0.06220095693779904 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._