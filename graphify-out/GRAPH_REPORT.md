# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 98 files · ~234,988 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 881 nodes · 3441 edges · 46 communities (30 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3efac81`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- lucide-react
- package.json
- presenceService
- Volunteer
- ParticipantsTab.tsx
- VolunteerDashboard.tsx
- StudentDashboard.tsx
- allocationEngine.ts
- storageService.ts
- .setItem
- csvHelper.ts
- AgendaTab.tsx
- App.tsx
- aws
- .notify
- compilerOptions
- ChatMessage
- UserRole
- FeedbackEntry
- compilerOptions
- ScoreRecord
- ParliamentQuestion
- react
- storageService
- .getParties
- SpeakingTurn
- test_vote_lifecycle.cjs
- index.ts
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- CollegeEvent
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 338 edges
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
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (46 total, 9 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.17
Nodes (26): AddLearnerModalProps, AllocationCheckTabProps, AllocationModalProps, AllocationTabProps, AnalyticsTabProps, AwardsTab(), AwardsTabProps, CabinetTabProps (+18 more)

### Community 1 - "lucide-react"
Cohesion: 0.24
Nodes (9): lucide-react, AddLearnerModal(), AllocationModal(), AnalyticsTab(), TN_CONSTITUENCIES, TNConstituency, AcademicYear, BenchType (+1 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 4 - "Volunteer"
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 5 - "ParticipantsTab.tsx"
Cohesion: 0.15
Nodes (19): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), DownloadModal(), EditLearnerModal(), ParticipantsTab() (+11 more)

### Community 6 - "VolunteerDashboard.tsx"
Cohesion: 0.26
Nodes (11): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, DayAttendanceRecord (+3 more)

### Community 7 - "StudentDashboard.tsx"
Cohesion: 0.15
Nodes (15): AllocationVerificationModal(), AllocationVerificationModalProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, StudentDashboard(), StudentDashboardTab, computeAllocationHash() (+7 more)

### Community 8 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 9 - "storageService.ts"
Cohesion: 0.11
Nodes (28): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+20 more)

### Community 12 - "csvHelper.ts"
Cohesion: 0.10
Nodes (29): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, ReportTab(), CSVImportResult, CSVImportStats, deduplicateLearners() (+21 more)

### Community 13 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 14 - "App.tsx"
Cohesion: 0.06
Nodes (62): react-router-dom, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), EventTabRouteHandlerProps, getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession (+54 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 20 - "UserRole"
Cohesion: 0.11
Nodes (18): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+10 more)

### Community 21 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreRecord"
Cohesion: 0.22
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoreRecord

### Community 24 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 25 - "react"
Cohesion: 0.11
Nodes (19): react, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, COMM_STEPS, CONDUCT_STEPS (+11 more)

### Community 29 - ".getParties"
Cohesion: 0.11
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "index.ts"
Cohesion: 0.08
Nodes (22): runAuditAndLifecycleTests(), store, EditDayActivitiesModalProps, AggregatedScore, AssemblyElection, BillVote, BillVotingStatus, ElectionEligibility (+14 more)

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "CollegeEvent"
Cohesion: 0.19
Nodes (13): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, EventOverviewTab(), EventOverviewTabProps (+5 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **172 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `lucide-react`, `Volunteer`, `ParticipantsTab.tsx`, `VolunteerDashboard.tsx`, `StudentDashboard.tsx`, `storageService.ts`, `.getCoordinators`, `.setItem`, `csvHelper.ts`, `AgendaTab.tsx`, `App.tsx`, `.notify`, `.getActiveEventId`, `ChatMessage`, `UserRole`, `FeedbackEntry`, `ScoreRecord`, `ParliamentQuestion`, `react`, `.getItem`, `.getParties`, `SpeakingTurn`, `.getEvents`, `index.ts`, `CollegeEvent`?**
  _High betweenness centrality (0.359) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `lucide-react`, `package.json`, `Volunteer`, `index.ts`, `VolunteerDashboard.tsx`, `ParticipantsTab.tsx`, `StudentDashboard.tsx`, `csvHelper.ts`, `AgendaTab.tsx`, `App.tsx`, `ChatMessage`, `UserRole`, `FeedbackEntry`, `ScoreRecord`, `ParliamentQuestion`, `CollegeEvent`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `package.json`, `Volunteer`, `index.ts`, `VolunteerDashboard.tsx`, `ParticipantsTab.tsx`, `StudentDashboard.tsx`, `csvHelper.ts`, `AgendaTab.tsx`, `App.tsx`, `ChatMessage`, `UserRole`, `FeedbackEntry`, `ScoreRecord`, `ParliamentQuestion`, `react`, `CollegeEvent`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `presenceService` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Should `storageService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1053763440860215 - nodes in this community are weakly interconnected._