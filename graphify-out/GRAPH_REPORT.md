# Graph Report - TN_Assembly-  (2026-09-27)

## Corpus Check
- 100 files · ~246,137 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 900 nodes · 3564 edges · 45 communities (32 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aab791c0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- presenceService
- .setupRealtimeSync
- Volunteer
- lucide-react
- CollegeEvent
- Header.tsx
- storageService.ts
- ProceedingsTab.tsx
- CsvImportModal.tsx
- index.ts
- App.tsx
- aws
- .getLearners
- compilerOptions
- ParticipantsTab.tsx
- JuryDashboard.tsx
- UserRole
- FeedbackEntry
- compilerOptions
- ScoreGridTab.tsx
- StudentDashboard.tsx
- VolunteerDashboard.tsx
- .getCoordinators
- .exportElectionData
- storageService
- .getEvents
- test_vote_lifecycle.cjs
- ElectionsTab.tsx
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
1. `storageService` - 349 edges
2. `Learner` - 101 edges
3. `react` - 59 edges
4. `Party` - 58 edges
5. `lucide-react` - 57 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 47 edges
8. `getEventSlug()` - 32 edges
9. `UserRole` - 31 edges
10. `AgendaItem` - 28 edges

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

## Communities (45 total, 9 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.11
Nodes (41): DaysActivitiesTab(), DaysActivitiesTabProps, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModalProps, AllocationTabProps, AnalyticsTab() (+33 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 4 - ".setupRealtimeSync"
Cohesion: 0.16
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 5 - "Volunteer"
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 6 - "lucide-react"
Cohesion: 0.21
Nodes (5): lucide-react, OrganizerSignInProps, AllocationModal(), PartiesTab(), StudentLoginGatewayProps

### Community 7 - "CollegeEvent"
Cohesion: 0.31
Nodes (15): EventTabRouteHandlerProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps, VolunteerDashboardProps, AgendaItem (+7 more)

### Community 8 - "Header.tsx"
Cohesion: 0.27
Nodes (8): UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, JuryDashboard(), applyTheme(), Theme, useTheme()

### Community 9 - "storageService.ts"
Cohesion: 0.12
Nodes (26): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+18 more)

### Community 10 - "ProceedingsTab.tsx"
Cohesion: 0.26
Nodes (12): ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ProceedingsTab(), ProceedingsTabProps, SubmissionListModal(), SubmittedMemberRecord, BillProceeding, EventDeadline (+4 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 13 - "index.ts"
Cohesion: 0.07
Nodes (29): runAuditAndLifecycleTests(), store, EditDayActivitiesModal(), EditDayActivitiesModalProps, EditEventModal(), EditEventModalProps, AgendaTabProps, CATEGORY_OPTIONS (+21 more)

### Community 14 - "App.tsx"
Cohesion: 0.08
Nodes (29): react-router-dom, App(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps (+21 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getLearners"
Cohesion: 0.07
Nodes (14): genUuid(), isValidUuid(), DayAttendanceStatus, EventDay, allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode (+6 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "ParticipantsTab.tsx"
Cohesion: 0.17
Nodes (24): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatCheckedDate() (+16 more)

### Community 19 - "JuryDashboard.tsx"
Cohesion: 0.22
Nodes (7): COMM_STEPS, CONDUCT_STEPS, ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, ScoringSession

### Community 20 - "UserRole"
Cohesion: 0.09
Nodes (24): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+16 more)

### Community 21 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.32
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES

### Community 24 - "StudentDashboard.tsx"
Cohesion: 0.20
Nodes (11): AllocationVerificationModal(), StudentDashboard(), StudentDashboardTab, computeAllocationHash(), getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), AllocationCheckStatus (+3 more)

### Community 25 - "VolunteerDashboard.tsx"
Cohesion: 0.31
Nodes (7): formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, formatMarkedBy(), getRecordSessionStatuses(), canReviewQuestions()

### Community 34 - ".getEvents"
Cohesion: 0.10
Nodes (5): EventSlugOnlyRedirector(), ControlTab(), findEventBySlug(), getEventSlug(), slugify()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "ElectionsTab.tsx"
Cohesion: 0.16
Nodes (18): RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplay(), CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab() (+10 more)

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
Cohesion: 0.29
Nodes (9): react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, Coordinator (+1 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `.setupRealtimeSync`, `Volunteer`, `lucide-react`, `CollegeEvent`, `storageService.ts`, `ProceedingsTab.tsx`, `.notify`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `.getLearners`, `ParticipantsTab.tsx`, `JuryDashboard.tsx`, `UserRole`, `FeedbackEntry`, `ScoreGridTab.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `.getCoordinators`, `.exportElectionData`, `.getEvents`, `ElectionsTab.tsx`, `react`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `ElectionsTab.tsx`, `Volunteer`, `lucide-react`, `CollegeEvent`, `Header.tsx`, `ProceedingsTab.tsx`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `ParticipantsTab.tsx`, `JuryDashboard.tsx`, `UserRole`, `FeedbackEntry`, `ScoreGridTab.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `package.json`, `ElectionsTab.tsx`, `Volunteer`, `CollegeEvent`, `Header.tsx`, `ProceedingsTab.tsx`, `CsvImportModal.tsx`, `index.ts`, `App.tsx`, `ParticipantsTab.tsx`, `JuryDashboard.tsx`, `UserRole`, `FeedbackEntry`, `ScoreGridTab.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `react`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.11020408163265306 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.07744107744107744 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._