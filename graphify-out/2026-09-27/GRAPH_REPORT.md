# Graph Report - TN_Assembly-  (2026-09-27)

## Corpus Check
- 101 files · ~250,821 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 903 nodes · 3602 edges · 46 communities (29 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `169391ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- Header.tsx
- .hydrateFullEventData
- Volunteer
- allocationEngine.ts
- CollegeEvent
- Toast.tsx
- storageService.ts
- react
- .notify
- presenceService
- index.ts
- App.tsx
- aws
- storageService
- compilerOptions
- CabinetTab.tsx
- JuryDashboard.tsx
- VolunteerDashboard.tsx
- ChatMessage
- compilerOptions
- ScoreGridTab.tsx
- StudentDashboard.tsx
- BillProceeding
- TeamMember
- .saveElectionSnapshot
- .performSyncEventStateToSupabase
- SpeakingRequest
- .getEvents
- test_vote_lifecycle.cjs
- ElectionsTab.tsx
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- MyEventsDashboard.tsx
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 350 edges
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (46 total, 14 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.05
Nodes (85): papaparse, xlsx, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTab(), AllocationCheckTabProps, AllocationModal(), AllocationModalProps (+77 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "Header.tsx"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 5 - "Volunteer"
Cohesion: 0.13
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LearnerAllocationConfirmation, LoginRecord (+1 more)

### Community 6 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.41
Nodes (11): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, SpeakerDashboardProps, StudentDashboardProps, AgendaItem (+3 more)

### Community 8 - "Toast.tsx"
Cohesion: 0.18
Nodes (7): ToastContainer(), ToastMessage, ToastProps, INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 9 - "storageService.ts"
Cohesion: 0.10
Nodes (30): QuestionnaireTab(), QuestionnaireTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS (+22 more)

### Community 10 - "react"
Cohesion: 0.15
Nodes (17): lucide-react, react, EventOverviewTabProps, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal() (+9 more)

### Community 13 - "index.ts"
Cohesion: 0.08
Nodes (27): runAuditAndLifecycleTests(), store, EditEventModal(), EditEventModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS (+19 more)

### Community 14 - "App.tsx"
Cohesion: 0.15
Nodes (21): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), ActiveNavTab, Sidebar() (+13 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CabinetTab.tsx"
Cohesion: 0.38
Nodes (11): EventTabRouteHandler(), Header(), CabinetTab(), MinistryItem, ParticipantsTab(), SpeakerDashboard(), isAssemblyRoleMatching(), isChiefMinisterRole() (+3 more)

### Community 19 - "JuryDashboard.tsx"
Cohesion: 0.24
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.07
Nodes (22): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ChecklistTab(), ChecklistTabProps, formatConstituencyName(), matchesLearnerConstituency() (+14 more)

### Community 21 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 24 - "StudentDashboard.tsx"
Cohesion: 0.14
Nodes (15): AllocationVerificationModal(), AllocationVerificationModalProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), StudentDashboardTab, computeAllocationHash() (+7 more)

### Community 26 - "TeamMember"
Cohesion: 0.47
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 29 - ".performSyncEventStateToSupabase"
Cohesion: 0.09
Nodes (13): EventSlugOnlyRedirector(), MyEventsDashboard(), deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), EventDeadline, getCanonicalQuestionStatus(), getRecordSessionStatuses() (+5 more)

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "ElectionsTab.tsx"
Cohesion: 0.24
Nodes (12): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+4 more)

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "MyEventsDashboard.tsx"
Cohesion: 0.29
Nodes (8): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, Coordinator, generateRandomPassword()

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `.hydrateFullEventData`, `Volunteer`, `CollegeEvent`, `storageService.ts`, `react`, `.notify`, `index.ts`, `App.tsx`, `CabinetTab.tsx`, `JuryDashboard.tsx`, `VolunteerDashboard.tsx`, `ChatMessage`, `ScoreGridTab.tsx`, `StudentDashboard.tsx`, `BillProceeding`, `TeamMember`, `.saveElectionSnapshot`, `.performSyncEventStateToSupabase`, `SpeakingRequest`, `.getEvents`, `ElectionsTab.tsx`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.363) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `Header.tsx`, `ElectionsTab.tsx`, `TeamMember`, `Volunteer`, `CollegeEvent`, `Toast.tsx`, `storageService.ts`, `index.ts`, `App.tsx`, `CabinetTab.tsx`, `JuryDashboard.tsx`, `VolunteerDashboard.tsx`, `ChatMessage`, `ScoreGridTab.tsx`, `StudentDashboard.tsx`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `package.json`, `Header.tsx`, `ElectionsTab.tsx`, `TeamMember`, `Volunteer`, `CollegeEvent`, `Toast.tsx`, `storageService.ts`, `index.ts`, `App.tsx`, `CabinetTab.tsx`, `JuryDashboard.tsx`, `VolunteerDashboard.tsx`, `ChatMessage`, `ScoreGridTab.tsx`, `StudentDashboard.tsx`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.053253394463057664 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.08816326530612245 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._