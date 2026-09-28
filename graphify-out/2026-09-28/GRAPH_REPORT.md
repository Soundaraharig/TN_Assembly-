# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 110 files · ~267,347 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 940 nodes · 3704 edges · 51 communities (35 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c5e0ab0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .getItem
- package.json
- devDependencies
- Volunteer
- csvUpdateHelper.ts
- CollegeEvent
- CabinetTab.tsx
- storageService.ts
- memberIdentity.ts
- .saveProjectorSettings
- presenceService
- AllocationCheckTab.tsx
- .authenticateStudentAccessCode
- aws
- .performSyncEventStateToSupabase
- compilerOptions
- .getLearners
- isSpeakerRole
- VolunteerDashboard.tsx
- compilerOptions
- dependencies
- getEventSlug
- ScoreGridTab.tsx
- App.tsx
- index.ts
- scripts
- extract_authentic.cjs
- extract_recovered.js
- verify_all_vote_lifecycles.ts
- test_vote_lifecycle.cjs
- storageService
- find_full_text.cjs
- parse_complete.cjs
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (51 total, 9 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.10
Nodes (48): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+40 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 5 - "Volunteer"
Cohesion: 0.27
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

### Community 6 - "csvUpdateHelper.ts"
Cohesion: 0.16
Nodes (13): papaparse, xlsx, DuplicateRow, FIELD_ALIASES, FieldChange, IDENTIFIER_ALIASES, MatchedParticipantUpdate, normalizeHeader() (+5 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.15
Nodes (29): EventTabRouteHandlerProps, DaysActivitiesTabProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTab() (+21 more)

### Community 8 - "CabinetTab.tsx"
Cohesion: 0.30
Nodes (13): AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), ParticipantsTab(), CANONICAL_ROLES, getResolvedLearnerBench(), getResolvedPartyName() (+5 more)

### Community 9 - "storageService.ts"
Cohesion: 0.08
Nodes (35): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+27 more)

### Community 10 - "memberIdentity.ts"
Cohesion: 0.21
Nodes (11): QuestionCallingPanel(), QuestionCallingPanelProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ControlTab(), byNormName, byNumber, formatMemberConstituency() (+3 more)

### Community 12 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 13 - "AllocationCheckTab.tsx"
Cohesion: 0.42
Nodes (7): AllocationCheckTab(), formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, getAllocationCheckStatus(), isAllocationComplete(), AllocationCheckStatus

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".performSyncEventStateToSupabase"
Cohesion: 0.09
Nodes (8): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getCanonicalQuestionStatus(), getRecordSessionStatuses(), ProceedingsQuestion, ScoreRecord

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".getLearners"
Cohesion: 0.06
Nodes (16): EditDayActivitiesModal(), EditDayActivitiesModalProps, genUuid(), isValidUuid(), AggregatedScore, EventDay, EventDayStatus, STANDARD_TN_ACTIVITIES (+8 more)

### Community 19 - "isSpeakerRole"
Cohesion: 0.29
Nodes (11): Header(), SpeakerDashboard(), StudentDashboard(), computeAllocationHash(), getMinisterAssignedMinistry(), isDeputySpeakerRole(), isPresidingOfficerRole(), isQuestionForMinister() (+3 more)

### Community 20 - "VolunteerDashboard.tsx"
Cohesion: 0.14
Nodes (18): DaysActivitiesTab(), COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS (+10 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 24 - "getEventSlug"
Cohesion: 0.11
Nodes (27): react-router-dom, App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), MyEventsDashboard(), ActiveNavTab (+19 more)

### Community 25 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (8): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, ScoringSession

### Community 26 - "App.tsx"
Cohesion: 0.09
Nodes (32): SavedAuthSession, ToastContainer(), ToastMessage, ToastProps, ChapterAwardsTab(), ChapterAwardsTabProps, ChecklistTab(), ChecklistTabProps (+24 more)

### Community 29 - "index.ts"
Cohesion: 0.09
Nodes (24): EventOverviewTab(), EventOverviewTabProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab(), ChatTabProps (+16 more)

### Community 31 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 32 - "extract_authentic.cjs"
Cohesion: 0.40
Nodes (4): fs, readline, rl, stream

### Community 33 - "extract_recovered.js"
Cohesion: 0.40
Nodes (4): content, idx, lines, obj

### Community 34 - "verify_all_vote_lifecycles.ts"
Cohesion: 0.30
Nodes (3): runAuditAndLifecycleTests(), store, VoteAuditEntry

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

### Community 58 - "react"
Cohesion: 0.08
Nodes (30): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+22 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **190 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.getItem`, `.setItem`, `Volunteer`, `CollegeEvent`, `CabinetTab.tsx`, `storageService.ts`, `memberIdentity.ts`, `.saveProjectorSettings`, `AllocationCheckTab.tsx`, `.authenticateStudentAccessCode`, `.performSyncEventStateToSupabase`, `.getLearners`, `VolunteerDashboard.tsx`, `.getEvents`, `getEventSlug`, `ScoreGridTab.tsx`, `App.tsx`, `.getCoordinators`, `index.ts`, `.addElection`, `verify_all_vote_lifecycles.ts`, `react`?**
  _High betweenness centrality (0.349) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `Volunteer`, `CollegeEvent`, `CabinetTab.tsx`, `memberIdentity.ts`, `AllocationCheckTab.tsx`, `.getLearners`, `VolunteerDashboard.tsx`, `getEventSlug`, `ScoreGridTab.tsx`, `App.tsx`, `index.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `package.json`, `Volunteer`, `CollegeEvent`, `CabinetTab.tsx`, `memberIdentity.ts`, `AllocationCheckTab.tsx`, `.getLearners`, `VolunteerDashboard.tsx`, `getEventSlug`, `ScoreGridTab.tsx`, `App.tsx`, `index.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.09626216077828981 - nodes in this community are weakly interconnected._
- **Should `.getItem` be split into smaller, more focused modules?**
  _Cohesion score 0.0796221322537112 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._