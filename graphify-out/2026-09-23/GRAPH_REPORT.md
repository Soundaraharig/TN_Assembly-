# Graph Report - TN_Assembly-  (2026-09-23)

## Corpus Check
- 90 files · ~213,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 820 nodes · 3165 edges · 42 communities (30 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e31421ab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- index.ts
- package.json
- JuryDashboard.tsx
- .sbUpsert
- AddLearnerModal.tsx
- Volunteer
- ElectionsTab.tsx
- UserRole
- ParticipantsTab.tsx
- csvHelper.ts
- .setItem
- CsvImportModal.tsx
- BillProceeding
- StudentDashboard.tsx
- aws
- EventDay
- compilerOptions
- CollegeEvent
- MediaTab.tsx
- TeamMember
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- storageService.ts
- storageService
- .getEvents
- allocationEngine.ts
- react
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
- .getItem

## God Nodes (most connected - your core abstractions)
1. `storageService` - 308 edges
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (42 total, 10 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.18
Nodes (25): AddLearnerModalProps, AllocationCheckTabProps, AllocationModalProps, AllocationTabProps, AnalyticsTabProps, AwardsTabProps, CabinetTabProps, SearchableDelegateSelectProps (+17 more)

### Community 1 - "index.ts"
Cohesion: 0.08
Nodes (26): EditDayActivitiesModal(), EditDayActivitiesModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab(), ChatTabProps (+18 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+35 more)

### Community 3 - "JuryDashboard.tsx"
Cohesion: 0.08
Nodes (23): @supabase/supabase-js, UnifiedLoginPage(), UnifiedLoginPageProps, Header(), HeaderProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard() (+15 more)

### Community 5 - "AddLearnerModal.tsx"
Cohesion: 0.43
Nodes (4): AddLearnerModal(), TN_CONSTITUENCIES, TNConstituency, generateAccessCode()

### Community 6 - "Volunteer"
Cohesion: 0.10
Nodes (16): formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, computeAllocationHash(), detectDeviceType() (+8 more)

### Community 7 - "ElectionsTab.tsx"
Cohesion: 0.29
Nodes (10): CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings(), BillVote, ElectionCandidate (+2 more)

### Community 8 - "UserRole"
Cohesion: 0.14
Nodes (15): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+7 more)

### Community 9 - "ParticipantsTab.tsx"
Cohesion: 0.18
Nodes (18): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), getResolvedCommitteeName() (+10 more)

### Community 10 - "csvHelper.ts"
Cohesion: 0.26
Nodes (12): DownloadModal(), ReportTab(), CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData(), exportFullParticipantDataToCSV(), exportFullParticipantDataToExcel() (+4 more)

### Community 12 - "CsvImportModal.tsx"
Cohesion: 0.14
Nodes (18): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), DuplicateRow, exportExistingParticipantsUpdateTemplate() (+10 more)

### Community 13 - "BillProceeding"
Cohesion: 0.40
Nodes (4): ProceedingsTab(), ProceedingsTabProps, BillProceeding, ProceedingsMotion

### Community 14 - "StudentDashboard.tsx"
Cohesion: 0.20
Nodes (14): EventSlugOnlyRedirector(), EventTabRouteHandler(), StudentDashboard(), StudentDashboardTab, getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey(), EventDeadline (+6 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.20
Nodes (24): EventTabRouteHandlerProps, DaysActivitiesTab(), DaysActivitiesTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, StudentDashboardProps (+16 more)

### Community 19 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 20 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 21 - "App.tsx"
Cohesion: 0.14
Nodes (22): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+14 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 25 - "storageService.ts"
Cohesion: 0.10
Nodes (30): QuestionnaireTab(), QuestionnaireTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS (+22 more)

### Community 29 - ".getEvents"
Cohesion: 0.16
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 30 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 31 - "react"
Cohesion: 0.15
Nodes (9): react, OrganizerSignInProps, AllocationModal(), AnalyticsTab(), ChapterAwardsTab(), ChapterAwardsTabProps, PartiesTab(), StudentLoginGatewayProps (+1 more)

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
Cohesion: 0.18
Nodes (14): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+6 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **161 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `index.ts`, `JuryDashboard.tsx`, `.sbUpsert`, `AddLearnerModal.tsx`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `.setItem`, `CsvImportModal.tsx`, `BillProceeding`, `StudentDashboard.tsx`, `EventDay`, `CollegeEvent`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `.getEvents`, `react`, `lucide-react`, `.getItem`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `index.ts`, `package.json`, `JuryDashboard.tsx`, `AddLearnerModal.tsx`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CsvImportModal.tsx`, `BillProceeding`, `StudentDashboard.tsx`, `CollegeEvent`, `MediaTab.tsx`, `TeamMember`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `lucide-react`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `index.ts`, `package.json`, `JuryDashboard.tsx`, `AddLearnerModal.tsx`, `Volunteer`, `ElectionsTab.tsx`, `UserRole`, `ParticipantsTab.tsx`, `csvHelper.ts`, `CsvImportModal.tsx`, `BillProceeding`, `StudentDashboard.tsx`, `CollegeEvent`, `MediaTab.tsx`, `TeamMember`, `App.tsx`, `ScoreGridTab.tsx`, `storageService.ts`, `react`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08143939393939394 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.046464646464646465 - nodes in this community are weakly interconnected._
- **Should `JuryDashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08408408408408409 - nodes in this community are weakly interconnected._