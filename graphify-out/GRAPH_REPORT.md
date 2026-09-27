# Graph Report - TN_Assembly-  (2026-09-27)

## Corpus Check
- 99 files · ~242,597 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 896 nodes · 3550 edges · 49 communities (32 shown, 14 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `73f190fd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- presenceService.ts
- presenceService
- Volunteer
- allocationEngine.ts
- CollegeEvent
- devDependencies
- storageService.ts
- ProceedingsTab.tsx
- .notify
- csvUpdateHelper.ts
- index.ts
- App.tsx
- aws
- .invalidateCache
- compilerOptions
- CabinetTab.tsx
- CsvImportModal.tsx
- UserRole
- dependencies
- compilerOptions
- ScoreGridTab.tsx
- StudentAllocationCard.tsx
- VolunteerDashboard.tsx
- storageService
- .getItem
- .setupRealtimeSync
- scripts
- SpeakingTurn
- verify_all_vote_lifecycles.ts
- .getAggregatedScores
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
2. `Learner` - 98 edges
3. `react` - 58 edges
4. `Party` - 58 edges
5. `lucide-react` - 56 edges
6. `Committee` - 48 edges
7. `CollegeEvent` - 47 edges
8. `getEventSlug()` - 32 edges
9. `UserRole` - 31 edges
10. `AgendaItem` - 28 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (49 total, 14 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.12
Nodes (39): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTab(), AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTab(), AllocationTabProps (+31 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+11 more)

### Community 3 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 5 - "Volunteer"
Cohesion: 0.16
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 6 - "allocationEngine.ts"
Cohesion: 0.23
Nodes (11): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, AllocationResult, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions (+3 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.17
Nodes (25): EventTabRouteHandlerProps, DaysActivitiesTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ALL_NOMINATION_ROLES, NominationsTabProps, ProjectorTabProps, ReportTab() (+17 more)

### Community 8 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 9 - "storageService.ts"
Cohesion: 0.09
Nodes (33): FeedbackTabProps, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+25 more)

### Community 10 - "ProceedingsTab.tsx"
Cohesion: 0.42
Nodes (7): ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ProceedingsTab(), ProceedingsTabProps, getCanonicalQuestionStatus(), ProceedingsMotion, UserSession

### Community 12 - "csvUpdateHelper.ts"
Cohesion: 0.17
Nodes (12): papaparse, xlsx, DuplicateRow, FIELD_ALIASES, FieldChange, IDENTIFIER_ALIASES, MatchedParticipantUpdate, normalizeHeader() (+4 more)

### Community 13 - "index.ts"
Cohesion: 0.12
Nodes (20): EditEventModal(), EditEventModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, QuestionnaireTab(), QuestionnaireTabProps (+12 more)

### Community 14 - "App.tsx"
Cohesion: 0.08
Nodes (32): react-router-dom, App(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps (+24 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CabinetTab.tsx"
Cohesion: 0.34
Nodes (12): CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, getResolvedLearnerBench(), isAssemblyRoleMatching(), isChiefMinisterRole() (+4 more)

### Community 19 - "CsvImportModal.tsx"
Cohesion: 0.23
Nodes (11): CsvImportModal(), ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), normalizeBench(), parseAcademicYear(), parseCSVFile() (+3 more)

### Community 20 - "UserRole"
Cohesion: 0.11
Nodes (22): ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, PartiesTab() (+14 more)

### Community 21 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 24 - "StudentAllocationCard.tsx"
Cohesion: 0.20
Nodes (11): formatCheckedDate(), StudentAllocationCard(), StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry(), isAllocationComplete(), isQuestionForMinister() (+3 more)

### Community 25 - "VolunteerDashboard.tsx"
Cohesion: 0.15
Nodes (14): DaysActivitiesTab(), EditDayActivitiesModal(), EditDayActivitiesModalProps, ParticipantsTabProps, formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment (+6 more)

### Community 29 - ".setupRealtimeSync"
Cohesion: 0.10
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 30 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 34 - ".getEvents"
Cohesion: 0.12
Nodes (5): EventSlugOnlyRedirector(), ControlTab(), findEventBySlug(), getEventSlug(), slugify()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 36 - "ElectionsTab.tsx"
Cohesion: 0.23
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

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
Cohesion: 0.08
Nodes (31): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, MyEventsDashboard(), MyEventsDashboardProps (+23 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 206 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `Volunteer`, `allocationEngine.ts`, `CollegeEvent`, `storageService.ts`, `ProceedingsTab.tsx`, `.notify`, `index.ts`, `App.tsx`, `.invalidateCache`, `CabinetTab.tsx`, `CsvImportModal.tsx`, `UserRole`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `VolunteerDashboard.tsx`, `.getItem`, `.setupRealtimeSync`, `SpeakingTurn`, `.getAggregatedScores`, `.getEvents`, `ElectionsTab.tsx`, `react`?**
  _High betweenness centrality (0.365) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `ElectionsTab.tsx`, `Volunteer`, `CollegeEvent`, `ProceedingsTab.tsx`, `index.ts`, `App.tsx`, `CabinetTab.tsx`, `CsvImportModal.tsx`, `UserRole`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `package.json`, `ElectionsTab.tsx`, `Volunteer`, `CollegeEvent`, `ProceedingsTab.tsx`, `index.ts`, `App.tsx`, `CabinetTab.tsx`, `CsvImportModal.tsx`, `UserRole`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.11689291101055807 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._