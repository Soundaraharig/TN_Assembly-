# Graph Report - TN_Assembly-  (2026-09-25)

## Corpus Check
- 98 files · ~231,829 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 876 nodes · 3393 edges · 45 communities (32 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a92c868`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Learner
- TeamMember
- package.json
- presenceService
- .setItem
- EventDay
- Volunteer
- FeedbackEntry
- UserSession
- storageService.ts
- ElectionsTab.tsx
- csvHelper.ts
- ChatMessage
- App.tsx
- aws
- .getLearners
- compilerOptions
- index.ts
- .getPartyLeaderElectionParty
- UserRole
- MediaTab.tsx
- compilerOptions
- ScoreRecord
- VolunteerDashboard.tsx
- storageService
- .getParties
- AgendaTab.tsx
- getEventSlug
- .getActiveEventId
- test_vote_lifecycle.cjs
- ParliamentQuestion
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
1. `storageService` - 333 edges
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

## Communities (45 total, 9 thin omitted)

### Community 0 - "Learner"
Cohesion: 0.16
Nodes (23): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+15 more)

### Community 1 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "presenceService"
Cohesion: 0.12
Nodes (10): @supabase/supabase-js, supabase, supabase, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener (+2 more)

### Community 6 - "Volunteer"
Cohesion: 0.15
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), getDeviceInfo(), JuryMember, LoginRecord, SecurityAuditLog (+1 more)

### Community 7 - "FeedbackEntry"
Cohesion: 0.25
Nodes (5): ChapterAwardsTab(), ChapterAwardsTabProps, FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 8 - "UserSession"
Cohesion: 0.43
Nodes (4): UnifiedLoginPage(), UnifiedLoginPageProps, Theme, UserSession

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (72): runAuditAndLifecycleTests(), store, AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), DownloadModal() (+64 more)

### Community 10 - "ElectionsTab.tsx"
Cohesion: 0.31
Nodes (7): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTabProps, BillVote, ElectionCandidate, FlashVoteAudience

### Community 12 - "csvHelper.ts"
Cohesion: 0.08
Nodes (35): xlsx, CsvImportModal(), CsvImportModalProps, ImportReportData, UpdateReportData, ProceedingsTabProps, ReportTab(), ReportTabProps (+27 more)

### Community 13 - "ChatMessage"
Cohesion: 0.50
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 14 - "App.tsx"
Cohesion: 0.14
Nodes (23): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), DaysActivitiesTab(), EventOverviewTab(), Header(), ActiveNavTab (+15 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "index.ts"
Cohesion: 0.16
Nodes (26): EventTabRouteHandlerProps, DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, EventOverviewTabProps, StandaloneProjectorDisplayProps, ControlTabProps, ProjectorTabProps (+18 more)

### Community 19 - ".getPartyLeaderElectionParty"
Cohesion: 0.70
Nodes (4): ElectionsTab(), getProjectorSettings(), ProjectorTab(), saveProjectorSettings()

### Community 20 - "UserRole"
Cohesion: 0.10
Nodes (23): papaparse, SavedAuthSession, ChecklistTab(), ChecklistTabProps, CommitteesTab(), JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+15 more)

### Community 21 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "ScoreRecord"
Cohesion: 0.16
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, SCORING_CATEGORIES, AggregatedScore (+2 more)

### Community 25 - "VolunteerDashboard.tsx"
Cohesion: 0.17
Nodes (15): COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS, TIME_STEPS, formatConstituencyName() (+7 more)

### Community 28 - "storageService"
Cohesion: 0.06
Nodes (3): storageService, LearnerAllocationConfirmation, SpeakingRequest

### Community 29 - ".getParties"
Cohesion: 0.11
Nodes (5): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), getRecordSessionStatuses()

### Community 31 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 33 - "getEventSlug"
Cohesion: 0.26
Nodes (9): EventSlugOnlyRedirector(), EventTabRouteHandler(), ProceedingsTab(), EventDeadline, ProceedingsMotion, ProceedingsQuestion, findEventBySlug(), getEventSlug() (+1 more)

### Community 35 - "test_vote_lifecycle.cjs"
Cohesion: 0.50
Nodes (3): { chromium }, fs, path

### Community 37 - "ParliamentQuestion"
Cohesion: 0.50
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

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
Cohesion: 0.09
Nodes (24): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+16 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **172 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+167 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 205 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Learner`, `.setItem`, `EventDay`, `Volunteer`, `FeedbackEntry`, `UserSession`, `storageService.ts`, `ElectionsTab.tsx`, `.notify`, `csvHelper.ts`, `ChatMessage`, `App.tsx`, `.getLearners`, `index.ts`, `.getPartyLeaderElectionParty`, `UserRole`, `ScoreRecord`, `VolunteerDashboard.tsx`, `.getParties`, `AgendaTab.tsx`, `getEventSlug`, `.getActiveEventId`, `ParliamentQuestion`, `react`?**
  _High betweenness centrality (0.356) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `Learner`, `TeamMember`, `package.json`, `Volunteer`, `FeedbackEntry`, `UserSession`, `storageService.ts`, `ElectionsTab.tsx`, `csvHelper.ts`, `ChatMessage`, `App.tsx`, `index.ts`, `UserRole`, `MediaTab.tsx`, `ScoreRecord`, `VolunteerDashboard.tsx`, `AgendaTab.tsx`, `getEventSlug`, `ParliamentQuestion`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `Learner`, `TeamMember`, `package.json`, `Volunteer`, `FeedbackEntry`, `UserSession`, `storageService.ts`, `ElectionsTab.tsx`, `csvHelper.ts`, `ChatMessage`, `App.tsx`, `index.ts`, `UserRole`, `MediaTab.tsx`, `ScoreRecord`, `VolunteerDashboard.tsx`, `AgendaTab.tsx`, `getEventSlug`, `ParliamentQuestion`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `presenceService` be split into smaller, more focused modules?**
  _Cohesion score 0.11594202898550725 - nodes in this community are weakly interconnected._
- **Should `Volunteer` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._