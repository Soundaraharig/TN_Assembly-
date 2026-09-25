# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 98 files · ~232,212 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 877 nodes · 3395 edges · 50 communities (29 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `611ab5fb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- package.json
- Header.tsx
- uid
- DaysActivitiesTab.tsx
- Volunteer
- FeedbackEntry
- UserSession
- storageService.ts
- .notify
- csvHelper.ts
- ChatMessage
- App.tsx
- aws
- .setItem
- compilerOptions
- CollegeEvent
- UserRole
- MediaTab.tsx
- compilerOptions
- ScoreRecord
- presenceService
- JuryDashboard.tsx
- storageService
- .getParties
- Toast.tsx
- .submitSpeakingRequest
- getEventSlug
- .getActiveEventId
- test_vote_lifecycle.cjs
- index.ts
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
1. `storageService` - 334 edges
2. `Learner` - 98 edges
3. `Party` - 58 edges
4. `react` - 57 edges
5. `lucide-react` - 55 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 47 edges
8. `UserRole` - 29 edges
9. `getEventSlug()` - 29 edges
10. `AgendaItem` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (50 total, 12 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.16
Nodes (26): lucide-react, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+18 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "Header.tsx"
Cohesion: 0.15
Nodes (10): @supabase/supabase-js, supabase, supabase, Header(), isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl (+2 more)

### Community 5 - "DaysActivitiesTab.tsx"
Cohesion: 0.25
Nodes (10): DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, ParticipantsTabProps, VolunteerDashboardProps, DayAttendanceRecord, DayAttendanceStatus, EventDay (+2 more)

### Community 6 - "Volunteer"
Cohesion: 0.14
Nodes (10): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, ProceedingsQuestion (+2 more)

### Community 7 - "FeedbackEntry"
Cohesion: 0.50
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 8 - "UserSession"
Cohesion: 0.53
Nodes (5): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, Theme, UserSession

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (73): runAuditAndLifecycleTests(), store, AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab() (+65 more)

### Community 12 - "csvHelper.ts"
Cohesion: 0.08
Nodes (35): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, ReportTab(), ReportTabProps, TN_CONSTITUENCIES (+27 more)

### Community 13 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 14 - "App.tsx"
Cohesion: 0.15
Nodes (22): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), MyEventsDashboard(), ActiveNavTab (+14 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.10
Nodes (34): EventTabRouteHandlerProps, EventOverviewTab(), EventOverviewTabProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, AgendaTab(), AgendaTabProps (+26 more)

### Community 20 - "UserRole"
Cohesion: 0.09
Nodes (25): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+17 more)

### Community 21 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreRecord"
Cohesion: 0.17
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, AggregatedScore (+2 more)

### Community 25 - "JuryDashboard.tsx"
Cohesion: 0.24
Nodes (9): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, applyTheme() (+1 more)

### Community 29 - ".getParties"
Cohesion: 0.14
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 31 - "Toast.tsx"
Cohesion: 0.40
Nodes (3): ToastContainer(), ToastMessage, ToastProps

### Community 33 - "getEventSlug"
Cohesion: 0.35
Nodes (7): EventSlugOnlyRedirector(), EventTabRouteHandler(), ProceedingsTab(), EventDeadline, findEventBySlug(), getEventSlug(), slugify()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "index.ts"
Cohesion: 0.09
Nodes (21): EditEventModal(), EditEventModalProps, QuestionnaireTab(), QuestionnaireTabProps, AllocationVerificationModal(), AllocationVerificationModalProps, AssemblyElection, BillVote (+13 more)

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
Cohesion: 0.17
Nodes (11): react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboardProps, SuperAdminDashboardProps, OrganizerSignInProps (+3 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **172 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.getLearners`, `uid`, `DaysActivitiesTab.tsx`, `Volunteer`, `FeedbackEntry`, `storageService.ts`, `.getItem`, `.notify`, `csvHelper.ts`, `App.tsx`, `.setItem`, `CollegeEvent`, `.performSyncEventStateToSupabase`, `UserRole`, `ScoreRecord`, `JuryDashboard.tsx`, `.getCoordinators`, `.getParties`, `.addAgendaItem`, `.submitSpeakingRequest`, `getEventSlug`, `.getActiveEventId`, `.deleteEventDay`, `index.ts`, `react`?**
  _High betweenness centrality (0.357) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `Header.tsx`, `DaysActivitiesTab.tsx`, `Volunteer`, `FeedbackEntry`, `UserSession`, `storageService.ts`, `csvHelper.ts`, `ChatMessage`, `App.tsx`, `CollegeEvent`, `UserRole`, `MediaTab.tsx`, `ScoreRecord`, `JuryDashboard.tsx`, `Toast.tsx`, `getEventSlug`, `index.ts`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Learner` to `package.json`, `Header.tsx`, `DaysActivitiesTab.tsx`, `Volunteer`, `FeedbackEntry`, `UserSession`, `storageService.ts`, `csvHelper.ts`, `ChatMessage`, `App.tsx`, `CollegeEvent`, `UserRole`, `MediaTab.tsx`, `ScoreRecord`, `JuryDashboard.tsx`, `Toast.tsx`, `getEventSlug`, `index.ts`, `react`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.getLearners` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `Header.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._