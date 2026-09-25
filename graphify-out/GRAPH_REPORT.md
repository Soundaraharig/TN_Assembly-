# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 101 files · ~238,482 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 898 nodes · 3482 edges · 56 communities (41 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0c7a7934`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- ElectionsTab.tsx
- package.json
- presenceService
- Volunteer
- ParticipantsTab.tsx
- VolunteerDashboard.tsx
- CollegeEvent
- .setItem
- storageService.ts
- getEventSlug
- .syncEventStateToSupabase
- CsvImportModal.tsx
- index.ts
- App.tsx
- aws
- .getLearners
- compilerOptions
- csvHelper.ts
- allocationEngine.ts
- UserRole
- DaysActivitiesTab.tsx
- compilerOptions
- ScoreGridTab.tsx
- StudentAllocationCard.tsx
- JuryDashboard.tsx
- storageService
- .getItem
- .getParties
- .callSpeaker
- align_forwarded_question.cjs
- verify_supabase_db_state.cjs
- Toast.tsx
- test_vote_lifecycle.cjs
- ProjectorTab.tsx
- AgendaTab.tsx
- MediaTab.tsx
- TeamMember
- ChatMessage
- FeedbackEntry
- ParliamentQuestion
- EventOverviewTab.tsx
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
1. `storageService` - 340 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 57 edges
5. `lucide-react` - 55 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 47 edges
8. `UserRole` - 29 edges
9. `getEventSlug()` - 29 edges
10. `AgendaItem` - 28 edges

## Surprising Connections (you probably didn't know these)
- `runCompleteMatrix()` --calls--> `getCanonicalQuestionStatus()`  [EXTRACTED]
  scratch/test_complete_matrix.ts → src/types/index.ts
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (56 total, 11 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.15
Nodes (26): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+18 more)

### Community 1 - "ElectionsTab.tsx"
Cohesion: 0.36
Nodes (6): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ElectionCandidate, FlashVoteAudience

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 4 - "Volunteer"
Cohesion: 0.21
Nodes (7): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, Volunteer

### Community 5 - "ParticipantsTab.tsx"
Cohesion: 0.26
Nodes (17): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, getResolvedCommitteeName() (+9 more)

### Community 6 - "VolunteerDashboard.tsx"
Cohesion: 0.43
Nodes (5): formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, canReviewQuestions()

### Community 7 - "CollegeEvent"
Cohesion: 0.31
Nodes (16): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps, StudentDashboardTab, VolunteerDashboardProps (+8 more)

### Community 9 - "storageService.ts"
Cohesion: 0.13
Nodes (25): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+17 more)

### Community 10 - "getEventSlug"
Cohesion: 0.28
Nodes (10): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), ProceedingsTab(), ProceedingsTabProps, BillProceeding, ProceedingsQuestion, findEventBySlug() (+2 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.12
Nodes (21): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, TN_CONSTITUENCIES, TNConstituency, CSVImportStats (+13 more)

### Community 13 - "index.ts"
Cohesion: 0.08
Nodes (24): runAuditAndLifecycleTests(), store, EditEventModal(), EditEventModalProps, AggregatedScore, AssemblyElection, BillVote, BillVotingStatus (+16 more)

### Community 14 - "App.tsx"
Cohesion: 0.16
Nodes (21): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, Header(), ActiveNavTab, Sidebar() (+13 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getLearners"
Cohesion: 0.08
Nodes (5): genUuid(), isValidUuid(), DayAttendanceRecord, DayAttendanceStatus, EventDay

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "csvHelper.ts"
Cohesion: 0.21
Nodes (14): DownloadModal(), DownloadModalProps, ReportTab(), ReportTabProps, CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData() (+6 more)

### Community 19 - "allocationEngine.ts"
Cohesion: 0.27
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 20 - "UserRole"
Cohesion: 0.09
Nodes (25): papaparse, DaysActivitiesTabProps, EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, HeaderProps, ChecklistTab(), ChecklistTabProps (+17 more)

### Community 21 - "DaysActivitiesTab.tsx"
Cohesion: 0.23
Nodes (8): DaysActivitiesTab(), EditDayActivitiesModal(), EditDayActivitiesModalProps, EventDayStatus, formatMarkedBy(), LoginRecord, STANDARD_TN_ACTIVITIES, canManageSessionAttendance()

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.32
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES

### Community 24 - "StudentAllocationCard.tsx"
Cohesion: 0.24
Nodes (11): formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry(), isAllocationComplete() (+3 more)

### Community 25 - "JuryDashboard.tsx"
Cohesion: 0.17
Nodes (13): UnifiedLoginPage(), UnifiedLoginPageProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS (+5 more)

### Community 29 - ".getParties"
Cohesion: 0.21
Nodes (7): runCompleteMatrix(), deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getCanonicalQuestionStatus(), getRecordSessionStatuses()

### Community 31 - "align_forwarded_question.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 32 - "verify_supabase_db_state.cjs"
Cohesion: 0.33
Nodes (4): { createClient }, env, fs, supabase

### Community 33 - "Toast.tsx"
Cohesion: 0.40
Nodes (3): ToastContainer(), ToastMessage, ToastProps

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "ProjectorTab.tsx"
Cohesion: 0.90
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 37 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 38 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 39 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 40 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 41 - "FeedbackEntry"
Cohesion: 0.67
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

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
Cohesion: 0.18
Nodes (10): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), OrganizerSignInProps, AllocationVerificationModal(), AllocationVerificationModalProps (+2 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **181 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `ElectionsTab.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `.setItem`, `storageService.ts`, `getEventSlug`, `.syncEventStateToSupabase`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `.getLearners`, `csvHelper.ts`, `allocationEngine.ts`, `UserRole`, `DaysActivitiesTab.tsx`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `JuryDashboard.tsx`, `.getItem`, `.getParties`, `.callSpeaker`, `.getEvents`, `ProjectorTab.tsx`, `AgendaTab.tsx`, `ParliamentQuestion`, `EventOverviewTab.tsx`, `react`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `ElectionsTab.tsx`, `package.json`, `Volunteer`, `ParticipantsTab.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `getEventSlug`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `csvHelper.ts`, `UserRole`, `DaysActivitiesTab.tsx`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `JuryDashboard.tsx`, `Toast.tsx`, `ProjectorTab.tsx`, `AgendaTab.tsx`, `MediaTab.tsx`, `TeamMember`, `ChatMessage`, `FeedbackEntry`, `ParliamentQuestion`, `EventOverviewTab.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `ElectionsTab.tsx`, `package.json`, `Volunteer`, `ParticipantsTab.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `getEventSlug`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `csvHelper.ts`, `UserRole`, `DaysActivitiesTab.tsx`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `JuryDashboard.tsx`, `Toast.tsx`, `ProjectorTab.tsx`, `AgendaTab.tsx`, `MediaTab.tsx`, `TeamMember`, `ChatMessage`, `FeedbackEntry`, `ParliamentQuestion`, `EventOverviewTab.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.1495798319327731 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `presenceService` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._