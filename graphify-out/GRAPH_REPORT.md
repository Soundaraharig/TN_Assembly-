# Graph Report - TN_Assembly-  (2026-09-27)

## Corpus Check
- 102 files · ~257,969 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 917 nodes · 3669 edges · 40 communities (25 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb3df24b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- react
- .invalidateCache
- Volunteer
- csvHelper.ts
- CollegeEvent
- VolunteerDashboard.tsx
- storageService.ts
- ProceedingsTab.tsx
- presenceService
- index.ts
- App.tsx
- aws
- getEventSlug
- compilerOptions
- storageService
- EventDay
- compilerOptions
- ScoreGridTab.tsx
- lucide-react
- .hydrateFullEventData
- test_vote_lifecycle.cjs
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
1. `storageService` - 355 edges
2. `Learner` - 104 edges
3. `react` - 60 edges
4. `lucide-react` - 58 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 49 edges
7. `Committee` - 48 edges
8. `getEventSlug()` - 32 edges
9. `UserRole` - 31 edges
10. `AgendaItem` - 31 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (40 total, 9 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.14
Nodes (31): AddLearnerModal(), AddLearnerModalProps, AgendaTab(), AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+23 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "react"
Cohesion: 0.11
Nodes (19): react, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard() (+11 more)

### Community 5 - "Volunteer"
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 6 - "csvHelper.ts"
Cohesion: 0.08
Nodes (37): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, ReportTab(), TN_CONSTITUENCIES, TNConstituency, generateAccessCode() (+29 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.16
Nodes (29): EventTabRouteHandlerProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps (+21 more)

### Community 8 - "VolunteerDashboard.tsx"
Cohesion: 0.29
Nodes (10): DaysActivitiesTab(), DaysActivitiesTabProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, DayAttendanceStatus, formatMarkedBy() (+2 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (71): runAuditAndLifecycleTests(), store, Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect() (+63 more)

### Community 10 - "ProceedingsTab.tsx"
Cohesion: 0.24
Nodes (9): ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ControlTab(), ProceedingsTab(), SubmissionListModal(), SubmissionListModalProps, SubmittedMemberRecord, ProceedingsQuestion (+1 more)

### Community 12 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 13 - "index.ts"
Cohesion: 0.09
Nodes (27): EditEventModal(), EditEventModalProps, AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, QuestionnaireTab(), QuestionnaireTabProps, formatCheckedDate() (+19 more)

### Community 14 - "App.tsx"
Cohesion: 0.07
Nodes (37): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+29 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "getEventSlug"
Cohesion: 0.10
Nodes (11): EventSlugOnlyRedirector(), EventTabRouteHandler(), deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), EventDeadline, getCanonicalQuestionStatus(), getRecordSessionStatuses() (+3 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 20 - "EventDay"
Cohesion: 0.22
Nodes (5): EditDayActivitiesModal(), EditDayActivitiesModalProps, EventDay, EventDayStatus, STANDARD_TN_ACTIVITIES

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 26 - "lucide-react"
Cohesion: 0.10
Nodes (25): lucide-react, papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+17 more)

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

### Community 58 - "MyEventsDashboard.tsx"
Cohesion: 0.26
Nodes (9): CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboard(), MyEventsDashboardProps, SuperAdminDashboardProps, Coordinator (+1 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **176 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+171 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 209 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `react`, `.invalidateCache`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `VolunteerDashboard.tsx`, `storageService.ts`, `ProceedingsTab.tsx`, `.notify`, `index.ts`, `App.tsx`, `getEventSlug`, `.getAgenda`, `EventDay`, `.getActiveEventId`, `ScoreGridTab.tsx`, `lucide-react`, `.hydrateFullEventData`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `lucide-react`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `VolunteerDashboard.tsx`, `storageService.ts`, `ProceedingsTab.tsx`, `index.ts`, `App.tsx`, `EventDay`, `ScoreGridTab.tsx`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `package.json`, `react`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `VolunteerDashboard.tsx`, `storageService.ts`, `ProceedingsTab.tsx`, `index.ts`, `App.tsx`, `EventDay`, `ScoreGridTab.tsx`, `MyEventsDashboard.tsx`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _176 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.14102564102564102 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.07259528130671507 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._