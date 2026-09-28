# Graph Report - TN_Assembly-  (2026-09-28)

## Corpus Check
- 118 files · ~269,965 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 978 nodes · 3750 edges · 57 communities (43 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21e111ea`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- .setItem
- package.json
- devDependencies
- ElectionsTab.tsx
- Volunteer
- csvHelper.ts
- CollegeEvent
- ParticipantsTab.tsx
- storageService.ts
- allocationEngine.ts
- .syncEventStateToSupabase
- presenceService.ts
- AllocationCheckTab.tsx
- check_all_pqs.cjs
- aws
- .getParties
- compilerOptions
- .invalidateCache
- isSpeakerRole
- react
- .notify
- compilerOptions
- dependencies
- App.tsx
- ScoreGridTab.tsx
- UserRole
- presenceService
- index.ts
- scripts
- extract_authentic.cjs
- extract_recovered.js
- test_vote_lifecycle.cjs
- storageService
- find_full_text.cjs
- parse_complete.cjs
- audit_storage.cjs
- find_attendance.cjs
- find_sc_updates.cjs
- find_score_methods.cjs
- find_sync_calls.cjs
- find_truncations.cjs
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
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (57 total, 9 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.12
Nodes (32): QuestionCallingPanelProps, AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+24 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 4 - "ElectionsTab.tsx"
Cohesion: 0.26
Nodes (11): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+3 more)

### Community 5 - "Volunteer"
Cohesion: 0.15
Nodes (8): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, Volunteer

### Community 6 - "csvHelper.ts"
Cohesion: 0.08
Nodes (38): papaparse, xlsx, CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), TN_CONSTITUENCIES, TNConstituency (+30 more)

### Community 7 - "CollegeEvent"
Cohesion: 0.20
Nodes (23): EventTabRouteHandlerProps, DaysActivitiesTabProps, QuestionCallingPanel(), StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps, SpeakerDashboardProps, AllocationVerificationModal() (+15 more)

### Community 8 - "ParticipantsTab.tsx"
Cohesion: 0.29
Nodes (13): CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), CANONICAL_ROLES, getResolvedLearnerBench(), getResolvedPartyName() (+5 more)

### Community 9 - "storageService.ts"
Cohesion: 0.07
Nodes (36): runAuditAndLifecycleTests(), store, ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS (+28 more)

### Community 10 - "allocationEngine.ts"
Cohesion: 0.25
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 12 - "presenceService.ts"
Cohesion: 0.16
Nodes (9): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+1 more)

### Community 13 - "AllocationCheckTab.tsx"
Cohesion: 0.20
Nodes (14): AllocationCheckTab(), AllocationTab(), formatCheckedDate(), StudentAllocationCard(), StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry() (+6 more)

### Community 14 - "check_all_pqs.cjs"
Cohesion: 0.22
Nodes (7): { createClient }, envContent, fs, keyMatch, path, supabase, urlMatch

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getParties"
Cohesion: 0.13
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably()

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".invalidateCache"
Cohesion: 0.10
Nodes (5): genUuid(), isValidUuid(), EventDay, getRecordSessionStatuses(), ProceedingsMotion

### Community 19 - "isSpeakerRole"
Cohesion: 0.33
Nodes (8): EventTabRouteHandler(), Header(), SpeakerDashboard(), isDeputySpeakerRole(), isPresidingOfficerRole(), isSpeakerRole(), SpeakingRequest, isPresidingOfficer()

### Community 20 - "react"
Cohesion: 0.10
Nodes (29): react, OrganizerSignInProps, UnifiedLoginPage(), UnifiedLoginPageProps, HeaderProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps, ProceedingsTab() (+21 more)

### Community 21 - ".notify"
Cohesion: 0.09
Nodes (5): EventSlugOnlyRedirector(), ControlTab(), findEventBySlug(), getEventSlug(), slugify()

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 24 - "App.tsx"
Cohesion: 0.08
Nodes (32): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+24 more)

### Community 25 - "ScoreGridTab.tsx"
Cohesion: 0.28
Nodes (7): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), SCORING_CATEGORIES, ScoringSession

### Community 26 - "UserRole"
Cohesion: 0.10
Nodes (25): ChecklistTab(), ChecklistTabProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps, ParticipantsTabProps (+17 more)

### Community 29 - "index.ts"
Cohesion: 0.09
Nodes (26): DaysActivitiesTab(), EditDayActivitiesModal(), EditDayActivitiesModalProps, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab() (+18 more)

### Community 31 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

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

### Community 39 - "audit_storage.cjs"
Cohesion: 0.25
Nodes (7): clusters, code, curCluster, fs, keywords, lines, matches

### Community 40 - "find_attendance.cjs"
Cohesion: 0.50
Nodes (3): code, fs, lines

### Community 41 - "find_sc_updates.cjs"
Cohesion: 0.50
Nodes (3): code, fs, lines

### Community 42 - "find_score_methods.cjs"
Cohesion: 0.50
Nodes (3): code, fs, lines

### Community 43 - "find_sync_calls.cjs"
Cohesion: 0.50
Nodes (3): code, fs, lines

### Community 44 - "find_truncations.cjs"
Cohesion: 0.67
Nodes (3): fs, path, search()

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
Cohesion: 0.15
Nodes (15): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+7 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **218 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+213 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 252 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `ElectionsTab.tsx`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `ParticipantsTab.tsx`, `storageService.ts`, `allocationEngine.ts`, `.syncEventStateToSupabase`, `AllocationCheckTab.tsx`, `.getParties`, `.invalidateCache`, `isSpeakerRole`, `react`, `.notify`, `App.tsx`, `ScoreGridTab.tsx`, `UserRole`, `index.ts`, `.getAgenda`, `.performSyncEventStateToSupabase`, `lucide-react`?**
  _High betweenness centrality (0.324) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `package.json`, `UserRole`, `ElectionsTab.tsx`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `ParticipantsTab.tsx`, `AllocationCheckTab.tsx`, `App.tsx`, `ScoreGridTab.tsx`, `lucide-react`, `index.ts`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `Learner`, `package.json`, `ElectionsTab.tsx`, `Volunteer`, `csvHelper.ts`, `CollegeEvent`, `ParticipantsTab.tsx`, `AllocationCheckTab.tsx`, `react`, `App.tsx`, `ScoreGridTab.tsx`, `UserRole`, `index.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Learner` be split into smaller, more focused modules?**
  _Cohesion score 0.1226215644820296 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.09098039215686274 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._