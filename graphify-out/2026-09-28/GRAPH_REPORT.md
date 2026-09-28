# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 103 files · ~257,544 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 920 nodes · 3685 edges · 50 communities (33 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50d7a3f5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .getItem
- package.json
- UserSession
- .setItem
- JuryDashboard.tsx
- csvHelper.ts
- ElectionsTab.tsx
- ParticipantsTab.tsx
- storageService.ts
- ControlTab.tsx
- presenceService.ts
- index.ts
- App.tsx
- aws
- .performSyncEventStateToSupabase
- compilerOptions
- storageService
- StudentDashboard.tsx
- VolunteerDashboard.tsx
- compilerOptions
- AgendaItem
- getEventSlug
- allocationEngine.ts
- UserRole
- presenceService
- AgendaTab.tsx
- ChatMessage
- FeedbackEntry
- ParliamentQuestion
- verify_all_vote_lifecycles.ts
- test_vote_lifecycle.cjs
- BillProceeding
- ProceedingsMotion
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
1. `storageService` - 356 edges
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
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (50 total, 11 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.14
Nodes (28): AddLearnerModal(), AddLearnerModalProps, AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps, CabinetTabProps, SearchableDelegateSelectProps (+20 more)

### Community 1 - ".getItem"
Cohesion: 0.06
Nodes (4): uid(), ElectionBackupSnapshot, LoginRecord, SecurityAuditLog

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "UserSession"
Cohesion: 0.47
Nodes (5): UnifiedLoginPage(), UnifiedLoginPageProps, ArrangeQuestionOrderModalProps, Theme, UserSession

### Community 5 - "JuryDashboard.tsx"
Cohesion: 0.07
Nodes (25): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, COMM_STEPS (+17 more)

### Community 6 - "csvHelper.ts"
Cohesion: 0.10
Nodes (32): papaparse, xlsx, CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), DownloadModalProps, CSVImportResult (+24 more)

### Community 7 - "ElectionsTab.tsx"
Cohesion: 0.24
Nodes (12): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+4 more)

### Community 8 - "ParticipantsTab.tsx"
Cohesion: 0.25
Nodes (16): AllocationCheckTab(), AllocationCheckTabProps, AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES (+8 more)

### Community 9 - "storageService.ts"
Cohesion: 0.09
Nodes (31): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+23 more)

### Community 10 - "ControlTab.tsx"
Cohesion: 0.23
Nodes (16): Header(), QuestionCallingPanel(), QuestionCallingPanelProps, ArrangeQuestionOrderModal(), ControlTab(), SpeakerDashboard(), isDeputySpeakerRole(), isPresidingOfficerRole() (+8 more)

### Community 12 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 13 - "index.ts"
Cohesion: 0.14
Nodes (16): EditDayActivitiesModal(), EditDayActivitiesModalProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, isAllocationComplete(), AllocationCheckStatus, AssemblyElection (+8 more)

### Community 14 - "App.tsx"
Cohesion: 0.11
Nodes (23): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), EventOverviewTab(), ActiveNavTab (+15 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".performSyncEventStateToSupabase"
Cohesion: 0.08
Nodes (7): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getCanonicalQuestionStatus(), ProceedingsQuestion, VoteAuditEntry

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "StudentDashboard.tsx"
Cohesion: 0.16
Nodes (10): AllocationVerificationModal(), StudentDashboard(), StudentDashboardTab, computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey() (+2 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.16
Nodes (13): EventTabRouteHandlerProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), VolunteerDashboardProps, YuvaAssignment, ChecklistItem, DayAttendanceRecord (+5 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "AgendaItem"
Cohesion: 0.31
Nodes (12): StandaloneProjectorDisplay(), StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, SpeakerDashboardProps, StudentDashboardProps, AgendaItem, Election (+4 more)

### Community 24 - "getEventSlug"
Cohesion: 0.26
Nodes (11): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), ProceedingsTab(), EventDeadline, findEventBySlug(), getEventSlug(), PATH_TAB_MAP (+3 more)

### Community 25 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 26 - "UserRole"
Cohesion: 0.09
Nodes (25): ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+17 more)

### Community 29 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 31 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 32 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 33 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

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
Cohesion: 0.10
Nodes (24): lucide-react, react, CreateEventModal(), CreateEventModalProps, DaysActivitiesTabProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal() (+16 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **176 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 209 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.getItem`, `.setItem`, `JuryDashboard.tsx`, `csvHelper.ts`, `ElectionsTab.tsx`, `ParticipantsTab.tsx`, `storageService.ts`, `ControlTab.tsx`, `.notify`, `index.ts`, `App.tsx`, `.performSyncEventStateToSupabase`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `.getEvents`, `AgendaItem`, `getEventSlug`, `UserRole`, `AgendaTab.tsx`, `.addNomination`, `ChatMessage`, `FeedbackEntry`, `ParliamentQuestion`, `BillProceeding`, `ProceedingsMotion`, `react`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `UserSession`, `JuryDashboard.tsx`, `csvHelper.ts`, `ElectionsTab.tsx`, `ParticipantsTab.tsx`, `ControlTab.tsx`, `index.ts`, `App.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `AgendaItem`, `getEventSlug`, `UserRole`, `AgendaTab.tsx`, `ChatMessage`, `FeedbackEntry`, `ParliamentQuestion`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `package.json`, `UserSession`, `JuryDashboard.tsx`, `csvHelper.ts`, `ElectionsTab.tsx`, `ParticipantsTab.tsx`, `ControlTab.tsx`, `index.ts`, `App.tsx`, `StudentDashboard.tsx`, `VolunteerDashboard.tsx`, `AgendaItem`, `getEventSlug`, `UserRole`, `AgendaTab.tsx`, `ChatMessage`, `FeedbackEntry`, `ParliamentQuestion`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _176 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.1354723707664884 - nodes in this community are weakly interconnected._
- **Should `.getItem` be split into smaller, more focused modules?**
  _Cohesion score 0.05513784461152882 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._