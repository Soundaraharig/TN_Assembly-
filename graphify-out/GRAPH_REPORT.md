# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 98 files · ~236,084 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 882 nodes · 3449 edges · 41 communities (27 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `24481cfc`
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
- storageService.ts
- getEventSlug
- .syncEventStateToSupabase
- csvHelper.ts
- App.tsx
- aws
- .setItem
- compilerOptions
- UserRole
- compilerOptions
- ScoreGridTab.tsx
- JuryDashboard.tsx
- storageService
- .getItem
- .getParties
- SpeakingTurn
- .getEvents
- test_vote_lifecycle.cjs
- index.ts
- .oxlintrc.json
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
1. `storageService` - 339 edges
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
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (41 total, 10 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.12
Nodes (32): react, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+24 more)

### Community 1 - "ElectionsTab.tsx"
Cohesion: 0.24
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

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
Cohesion: 0.25
Nodes (17): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), getResolvedCommitteeName() (+9 more)

### Community 6 - "VolunteerDashboard.tsx"
Cohesion: 0.32
Nodes (10): DaysActivitiesTabProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), VolunteerDashboardProps, YuvaAssignment, DayAttendanceRecord, DayAttendanceStatus (+2 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.24
Nodes (19): EventTabRouteHandlerProps, HeaderProps, StandaloneProjectorDisplayProps, ControlTabProps, CoordinatorDashboardProps, ProjectorTabProps, ReportTabProps, JuryDashboardProps (+11 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (58): runAuditAndLifecycleTests(), store, formatCheckedDate(), StudentAllocationCard(), StudentDashboard(), INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST (+50 more)

### Community 10 - "getEventSlug"
Cohesion: 0.70
Nodes (5): EventSlugOnlyRedirector(), EventTabRouteHandler(), findEventBySlug(), getEventSlug(), slugify()

### Community 12 - "csvHelper.ts"
Cohesion: 0.09
Nodes (33): papaparse, xlsx, CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), TN_CONSTITUENCIES, TNConstituency (+25 more)

### Community 14 - "App.tsx"
Cohesion: 0.08
Nodes (34): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), EventOverviewTab(), EventOverviewTabProps (+26 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 20 - "UserRole"
Cohesion: 0.10
Nodes (24): ChecklistTab(), ChecklistTabProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps, ParticipantsTabProps (+16 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 25 - "JuryDashboard.tsx"
Cohesion: 0.18
Nodes (12): UnifiedLoginPage(), UnifiedLoginPageProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS (+4 more)

### Community 28 - ".getItem"
Cohesion: 0.08
Nodes (3): uid(), LearnerAllocationConfirmation, SpeakingRequest

### Community 29 - ".getParties"
Cohesion: 0.07
Nodes (6): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), EventDay, getRecordSessionStatuses()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "index.ts"
Cohesion: 0.10
Nodes (22): EditDayActivitiesModal(), EditDayActivitiesModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab(), ChatTabProps (+14 more)

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
Cohesion: 0.13
Nodes (16): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+8 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **172 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `ElectionsTab.tsx`, `Volunteer`, `ParticipantsTab.tsx`, `VolunteerDashboard.tsx`, `CollegeEvent`, `.fetchAllEvents`, `storageService.ts`, `.syncEventStateToSupabase`, `csvHelper.ts`, `App.tsx`, `.setItem`, `UserRole`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `.getItem`, `.getParties`, `SpeakingTurn`, `.getEvents`, `index.ts`, `lucide-react`?**
  _High betweenness centrality (0.360) - this node is a cross-community bridge._
- **Why does `react` connect `Learner` to `ElectionsTab.tsx`, `package.json`, `Volunteer`, `index.ts`, `VolunteerDashboard.tsx`, `CollegeEvent`, `ParticipantsTab.tsx`, `storageService.ts`, `csvHelper.ts`, `App.tsx`, `UserRole`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`, `lucide-react`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `ElectionsTab.tsx`, `package.json`, `Volunteer`, `index.ts`, `VolunteerDashboard.tsx`, `CollegeEvent`, `ParticipantsTab.tsx`, `storageService.ts`, `csvHelper.ts`, `App.tsx`, `UserRole`, `ScoreGridTab.tsx`, `JuryDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.12367149758454106 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `presenceService` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._