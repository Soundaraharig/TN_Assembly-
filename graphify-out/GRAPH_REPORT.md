# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 110 files · ~267,819 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 941 nodes · 3727 edges · 49 communities (32 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ede098db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .getItem
- package.json
- EventDay
- ElectionsTab.tsx
- Volunteer
- Party
- CollegeEvent
- ParticipantsTab.tsx
- storageService.ts
- DaysActivitiesTab.tsx
- .setItem
- presenceService.ts
- AllocationCheckTab.tsx
- verify_all_vote_lifecycles.ts
- aws
- .getParties
- compilerOptions
- .notify
- react
- VolunteerDashboard.tsx
- .getEvents
- compilerOptions
- .getAggregatedScores
- App.tsx
- ScoreGridTab.tsx
- UserRole
- presenceService
- index.ts
- extract_authentic.cjs
- extract_recovered.js
- test_vote_lifecycle.cjs
- storageService
- find_full_text.cjs
- parse_complete.cjs
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
1. `storageService` - 357 edges
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `AllocationVerificationModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/student/AllocationVerificationModal.tsx → src/types/index.ts
- `CSVImportResult` --references--> `Learner`  [EXTRACTED]
  src/utils/csvHelper.ts → src/types/index.ts

## Import Cycles
- None detected.

## Communities (49 total, 13 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.14
Nodes (15): QuestionCallingPanelProps, AwardsTab(), AwardsTabProps, CommitteesTabProps, SearchableChairpersonSelectProps, QuestionnaireTab(), QuestionnaireTabProps, SubmissionListModalProps (+7 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 4 - "ElectionsTab.tsx"
Cohesion: 0.26
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

### Community 5 - "Volunteer"
Cohesion: 0.18
Nodes (4): detectDeviceType(), getDeviceInfo(), LoginRecord, Volunteer

### Community 6 - "Party"
Cohesion: 0.05
Nodes (68): papaparse, xlsx, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps (+60 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.23
Nodes (20): EventTabRouteHandlerProps, DaysActivitiesTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, ReportTab(), ReportTabProps, JuryDashboardProps (+12 more)

### Community 8 - "ParticipantsTab.tsx"
Cohesion: 0.21
Nodes (19): EventTabRouteHandler(), Header(), CabinetTab(), CabinetTabProps, MinistryItem, SearchableDelegateSelect(), SearchableDelegateSelectProps, EditLearnerModal() (+11 more)

### Community 9 - "storageService.ts"
Cohesion: 0.08
Nodes (34): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+26 more)

### Community 10 - "DaysActivitiesTab.tsx"
Cohesion: 0.31
Nodes (7): DaysActivitiesTab(), EditDayActivitiesModal(), EditDayActivitiesModalProps, EventDayStatus, formatMarkedBy(), STANDARD_TN_ACTIVITIES, canManageSessionAttendance()

### Community 12 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 13 - "AllocationCheckTab.tsx"
Cohesion: 0.21
Nodes (14): AllocationCheckTab(), AllocationTab(), formatCheckedDate(), StudentAllocationCard(), StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry() (+6 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getParties"
Cohesion: 0.10
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "react"
Cohesion: 0.19
Nodes (19): react, QuestionCallingPanel(), ArrangeQuestionOrderModal(), ControlTab(), ProceedingsTab(), SubmissionListModal(), SubmittedMemberRecord, SpeakerDashboard() (+11 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.13
Nodes (19): UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS (+11 more)

### Community 21 - ".getEvents"
Cohesion: 0.15
Nodes (4): EventSlugOnlyRedirector(), findEventBySlug(), getEventSlug(), slugify()

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 24 - "App.tsx"
Cohesion: 0.09
Nodes (30): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+22 more)

### Community 25 - "ScoreGridTab.tsx"
Cohesion: 0.24
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 26 - "UserRole"
Cohesion: 0.13
Nodes (17): ArrangeQuestionOrderModalProps, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, NominationsTab(), PartiesTab() (+9 more)

### Community 29 - "index.ts"
Cohesion: 0.10
Nodes (25): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, FeedbackTab(), FeedbackTabProps, ALL_NOMINATION_ROLES, NominationsTabProps (+17 more)

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "find_full_text.cjs"
Cohesion: 0.50
Nodes (3): fs, prevTool, text

### Community 38 - "parse_complete.cjs"
Cohesion: 0.50
Nodes (3): fs, line, parts

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
- **190 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.getItem`, `EventDay`, `ElectionsTab.tsx`, `Volunteer`, `Party`, `CollegeEvent`, `ParticipantsTab.tsx`, `storageService.ts`, `DaysActivitiesTab.tsx`, `.setItem`, `AllocationCheckTab.tsx`, `.getParties`, `.notify`, `react`, `VolunteerDashboard.tsx`, `.getEvents`, `.getAggregatedScores`, `App.tsx`, `ScoreGridTab.tsx`, `UserRole`, `index.ts`, `.getAgenda`, `lucide-react`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `UserRole`, `ElectionsTab.tsx`, `Party`, `CollegeEvent`, `ParticipantsTab.tsx`, `DaysActivitiesTab.tsx`, `AllocationCheckTab.tsx`, `VolunteerDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `lucide-react`, `index.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `package.json`, `ElectionsTab.tsx`, `Party`, `CollegeEvent`, `ParticipantsTab.tsx`, `DaysActivitiesTab.tsx`, `AllocationCheckTab.tsx`, `react`, `VolunteerDashboard.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `UserRole`, `index.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `.getItem` be split into smaller, more focused modules?**
  _Cohesion score 0.07682926829268293 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._