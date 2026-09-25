# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 98 files · ~232,963 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 878 nodes · 3407 edges · 43 communities (28 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `624c4b8a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- allocationEngine.ts
- package.json
- presenceService
- ParticipantsTab.tsx
- ElectionsTab.tsx
- .confirmStudentAllocation
- verify_all_vote_lifecycles.ts
- storageService.ts
- .setItem
- .notify
- csvHelper.ts
- .getAggregatedScores
- slug.ts
- aws
- .getLearners
- compilerOptions
- CollegeEvent
- App.tsx
- compilerOptions
- ScoreGridTab.tsx
- VolunteerDashboard.tsx
- storageService
- .getParties
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
1. `storageService` - 335 edges
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
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (43 total, 10 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.14
Nodes (28): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+20 more)

### Community 1 - "allocationEngine.ts"
Cohesion: 0.25
Nodes (11): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, AllocationResult, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions (+3 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 5 - "ParticipantsTab.tsx"
Cohesion: 0.26
Nodes (16): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), getResolvedCommitteeName() (+8 more)

### Community 6 - "ElectionsTab.tsx"
Cohesion: 0.22
Nodes (12): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+4 more)

### Community 7 - ".confirmStudentAllocation"
Cohesion: 0.28
Nodes (8): StudentAllocationCard(), StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry(), isAllocationComplete(), isQuestionForMinister(), normalizeMinistryKey()

### Community 9 - "storageService.ts"
Cohesion: 0.08
Nodes (35): INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS, INITIAL_FEEDBACK (+27 more)

### Community 12 - "csvHelper.ts"
Cohesion: 0.10
Nodes (30): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, ReportTab(), generateAccessCode(), CSVImportResult, CSVImportStats (+22 more)

### Community 14 - "slug.ts"
Cohesion: 0.13
Nodes (19): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, ActiveNavTab, Sidebar(), SidebarProps (+11 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getLearners"
Cohesion: 0.07
Nodes (7): AccessCodeAuthResult, StudentJoinViewProps, genUuid(), isValidUuid(), EventDay, JuryMember, Volunteer

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "CollegeEvent"
Cohesion: 0.18
Nodes (24): EventTabRouteHandlerProps, DaysActivitiesTabProps, EventOverviewTab(), EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, ReportTabProps (+16 more)

### Community 20 - "App.tsx"
Cohesion: 0.09
Nodes (32): papaparse, DaysActivitiesTab(), ToastContainer(), ToastMessage, ToastProps, ChecklistTab(), ChecklistTabProps, CommitteesTab() (+24 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreGridTab.tsx"
Cohesion: 0.32
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 25 - "VolunteerDashboard.tsx"
Cohesion: 0.16
Nodes (15): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+7 more)

### Community 28 - "storageService"
Cohesion: 0.07
Nodes (3): storageService, LoginRecord, SpeakingTurn

### Community 29 - ".getParties"
Cohesion: 0.09
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 33 - "getEventSlug"
Cohesion: 0.43
Nodes (7): EventSlugOnlyRedirector(), EventTabRouteHandler(), MyEventsDashboard(), ProceedingsTab(), findEventBySlug(), getEventSlug(), slugify()

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "index.ts"
Cohesion: 0.08
Nodes (28): EditDayActivitiesModal(), EditDayActivitiesModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab(), ChatTabProps (+20 more)

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
Nodes (30): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+22 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **172 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `allocationEngine.ts`, `.getElections`, `ParticipantsTab.tsx`, `ElectionsTab.tsx`, `.confirmStudentAllocation`, `storageService.ts`, `.setItem`, `.notify`, `csvHelper.ts`, `.getAggregatedScores`, `slug.ts`, `.getLearners`, `CollegeEvent`, `App.tsx`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`, `.getCoordinators`, `.getParties`, `.getActiveEventId`, `index.ts`, `react`?**
  _High betweenness centrality (0.357) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `index.ts`, `ElectionsTab.tsx`, `ParticipantsTab.tsx`, `csvHelper.ts`, `slug.ts`, `.getLearners`, `CollegeEvent`, `App.tsx`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `package.json`, `index.ts`, `ElectionsTab.tsx`, `ParticipantsTab.tsx`, `csvHelper.ts`, `slug.ts`, `.getLearners`, `CollegeEvent`, `App.tsx`, `ScoreGridTab.tsx`, `VolunteerDashboard.tsx`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.13974358974358975 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `presenceService` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._