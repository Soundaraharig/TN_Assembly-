# Graph Report - TN_Assembly-  (2026-09-22)

## Corpus Check
- 90 files · ~208,475 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 816 nodes · 3137 edges · 43 communities (31 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6e9a538`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- csvHelper.ts
- package.json
- allocationEngine.ts
- index.ts
- Volunteer
- storageService.ts
- UserRole
- .sbUpsert
- .getEvents
- CsvImportModal.tsx
- getEventSlug
- StudentDashboard.tsx
- aws
- react
- compilerOptions
- AgendaItem
- App.tsx
- VolunteerDashboard.tsx
- EventTabRouteHandlerProps
- compilerOptions
- ScoreRecord
- presenceService
- ParticipantsTab.tsx
- TeamMember
- ParliamentQuestion
- .unpackAndApplyEventState
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
- Header.tsx
- storageService

## God Nodes (most connected - your core abstractions)
1. `storageService` - 304 edges
2. `Learner` - 95 edges
3. `Party` - 58 edges
4. `react` - 55 edges
5. `lucide-react` - 52 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 46 edges
8. `UserRole` - 27 edges
9. `AgendaItem` - 27 edges
10. `getEventSlug()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts
- `SavedAuthSession` --references--> `Learner`  [EXTRACTED]
  src/App.tsx → src/types/index.ts
- `SavedAuthSession` --references--> `UserRole`  [EXTRACTED]
  src/App.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (43 total, 8 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.20
Nodes (19): AllocationCheckTabProps, AllocationTabProps, AnalyticsTabProps, CabinetTabProps, SearchableDelegateSelectProps, CommitteesTabProps, SearchableChairpersonSelectProps, CoordinatorDashboardProps (+11 more)

### Community 1 - "csvHelper.ts"
Cohesion: 0.17
Nodes (17): AddLearnerModal(), AddLearnerModalProps, EditLearnerModalProps, TN_CONSTITUENCIES, TNConstituency, AcademicYear, generateAccessCode(), AllocationResult (+9 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "allocationEngine.ts"
Cohesion: 0.29
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 5 - "index.ts"
Cohesion: 0.11
Nodes (20): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus, AggregatedScore (+12 more)

### Community 6 - "Volunteer"
Cohesion: 0.17
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 7 - "storageService.ts"
Cohesion: 0.13
Nodes (25): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+17 more)

### Community 8 - "UserRole"
Cohesion: 0.12
Nodes (20): papaparse, DaysActivitiesTabProps, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+12 more)

### Community 9 - ".sbUpsert"
Cohesion: 0.11
Nodes (3): genUuid(), isValidUuid(), EventDay

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.13
Nodes (19): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow (+11 more)

### Community 13 - "getEventSlug"
Cohesion: 0.20
Nodes (17): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), StandaloneProjectorDisplay(), ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+9 more)

### Community 14 - "StudentDashboard.tsx"
Cohesion: 0.21
Nodes (12): ProceedingsTab(), ProceedingsTabProps, StudentDashboard(), StudentDashboardTab, getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), BillProceeding (+4 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "react"
Cohesion: 0.14
Nodes (12): lucide-react, react, EditDayActivitiesModal(), EditDayActivitiesModalProps, OrganizerSignInProps, AllocationModal(), AllocationModalProps, AnalyticsTab() (+4 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "AgendaItem"
Cohesion: 0.32
Nodes (12): StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, ProjectorTabProps, StudentDashboardProps, AgendaItem, Election (+4 more)

### Community 19 - "App.tsx"
Cohesion: 0.12
Nodes (22): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), ActiveNavTab, Sidebar() (+14 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.18
Nodes (14): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+6 more)

### Community 21 - "EventTabRouteHandlerProps"
Cohesion: 0.20
Nodes (11): EventTabRouteHandlerProps, ChatTab(), ChatTabProps, FeedbackTab(), FeedbackTabProps, VolunteerDashboardProps, ChatMessage, ChecklistItem (+3 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreRecord"
Cohesion: 0.24
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, JuryDashboardProps (+2 more)

### Community 25 - "ParticipantsTab.tsx"
Cohesion: 0.15
Nodes (26): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), formatCheckedDate() (+18 more)

### Community 26 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 27 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 28 - ".unpackAndApplyEventState"
Cohesion: 0.14
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

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

### Community 90 - "Header.tsx"
Cohesion: 0.16
Nodes (13): @supabase/supabase-js, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, isSupabaseEnabled, supabase, supabaseAnonKey (+5 more)

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `csvHelper.ts`, `allocationEngine.ts`, `.getLearners`, `index.ts`, `Volunteer`, `storageService.ts`, `UserRole`, `.sbUpsert`, `.getEvents`, `.setItem`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `react`, `AgendaItem`, `App.tsx`, `VolunteerDashboard.tsx`, `EventTabRouteHandlerProps`, `ScoreRecord`, `ParticipantsTab.tsx`, `ParliamentQuestion`, `.unpackAndApplyEventState`, `CollegeEvent`, `Header.tsx`?**
  _High betweenness centrality (0.347) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `csvHelper.ts`, `package.json`, `index.ts`, `Volunteer`, `UserRole`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `AgendaItem`, `App.tsx`, `VolunteerDashboard.tsx`, `EventTabRouteHandlerProps`, `ScoreRecord`, `ParticipantsTab.tsx`, `TeamMember`, `ParliamentQuestion`, `CollegeEvent`, `Header.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `csvHelper.ts`, `package.json`, `index.ts`, `Volunteer`, `UserRole`, `CsvImportModal.tsx`, `getEventSlug`, `StudentDashboard.tsx`, `AgendaItem`, `App.tsx`, `VolunteerDashboard.tsx`, `EventTabRouteHandlerProps`, `ScoreRecord`, `ParticipantsTab.tsx`, `TeamMember`, `ParliamentQuestion`, `CollegeEvent`, `Header.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `.getLearners` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1067193675889328 - nodes in this community are weakly interconnected._