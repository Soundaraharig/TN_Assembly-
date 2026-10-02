# Graph Report - TN_Assembly-  (2026-10-02)

## Corpus Check
- 127 files · ~329,968 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1059 nodes · 4232 edges · 54 communities (45 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `208aaf71`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CsvImportModal.tsx
- memberIdentity.ts
- package.json
- ParticipantsTab.tsx
- index.ts
- storageService
- Learner
- .saveTimerAudioConfig
- UserRole
- storageService.ts
- react
- .syncEventStateToSupabase
- VolunteerDashboard.tsx
- LoginRecord
- MediaTab.tsx
- aws
- .unpackAndApplyEventState
- compilerOptions
- .getLearners
- StandaloneProjectorDisplay.tsx
- ScoreGridTab.tsx
- Supabase Free-Plan Engineering Guardrails & Architecture Rulebook
- compilerOptions
- StudentAllocationCard.tsx
- AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS
- .getEvents
- 4. Operational Playbook for Threshold Breaches
- AgendaTab.tsx
- 3. PostgreSQL SQL Diagnostic Queries
- ElectionsTab.tsx
- .setItem
- TeamMember
- ChatMessage
- FeedbackEntry
- allocationEngine.ts
- sessionUtils.ts
- JuryDashboard.tsx
- 3. Database Write Budget & Anti-Amplification Rules
- csvHelper.ts
- ParliamentQuestion
- .getAgenda
- CollegeEvent
- .oxlintrc.json
- Walkthrough & Verification Report
- Context
- App.tsx
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 397 edges
2. `Learner` - 106 edges
3. `react` - 61 edges
4. `lucide-react` - 59 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 49 edges
7. `Committee` - 48 edges
8. `getEventSlug()` - 33 edges
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

## Communities (54 total, 7 thin omitted)

### Community 0 - "CsvImportModal.tsx"
Cohesion: 0.12
Nodes (20): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, TN_CONSTITUENCIES, TNConstituency, CSVImportStats, exportAllocationTemplateCSV() (+12 more)

### Community 1 - "memberIdentity.ts"
Cohesion: 0.19
Nodes (14): EventTabRouteHandler(), Header(), QuestionCallingPanel(), QuestionCallingPanelProps, isDeputySpeakerRole(), isPresidingOfficerRole(), isSpeakerRole(), byNormName (+6 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "ParticipantsTab.tsx"
Cohesion: 0.25
Nodes (16): AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab(), CANONICAL_ROLES (+8 more)

### Community 4 - "index.ts"
Cohesion: 0.07
Nodes (27): AggregatedScore, AssemblyElection, BillVote, BillVotingStatus, CanonicalQuestionStatus, DerivedBillVoteCounts, ElectionBackupSnapshot, ElectionEligibility (+19 more)

### Community 5 - "storageService"
Cohesion: 0.05
Nodes (4): storageService, uid(), LearnerAllocationConfirmation, StudentVoteRecord

### Community 6 - "Learner"
Cohesion: 0.16
Nodes (29): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+21 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.40
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "UserRole"
Cohesion: 0.13
Nodes (18): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), CommitteesTabProps, SearchableChairpersonSelectProps, JuryTab(), JuryTabProps (+10 more)

### Community 9 - "storageService.ts"
Cohesion: 0.10
Nodes (29): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+21 more)

### Community 10 - "react"
Cohesion: 0.10
Nodes (21): lucide-react, react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps (+13 more)

### Community 12 - "VolunteerDashboard.tsx"
Cohesion: 0.07
Nodes (37): @supabase/supabase-js, ArrangeQuestionOrderModal(), ProceedingsTab(), formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, isSupabaseEnabled (+29 more)

### Community 14 - "MediaTab.tsx"
Cohesion: 0.40
Nodes (4): INITIAL_MEDIA_GALLERY, MediaItem, MediaTab(), MediaTabProps

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".unpackAndApplyEventState"
Cohesion: 0.08
Nodes (16): DaysActivitiesTab(), DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, VolunteerDashboardProps, deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections() (+8 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - ".getLearners"
Cohesion: 0.07
Nodes (9): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, detectDeviceType(), genUuid(), getDeviceInfo(), isValidUuid(), JuryMember (+1 more)

### Community 19 - "StandaloneProjectorDisplay.tsx"
Cohesion: 0.34
Nodes (16): StandaloneProjectorDisplay(), ControlTab(), SpeakerDashboard(), areJsonbObjectsEqual(), deriveBillVoteCounts(), activeSourceNodes, getSafeAudioContext(), playBellSequence() (+8 more)

### Community 20 - "ScoreGridTab.tsx"
Cohesion: 0.22
Nodes (10): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, ScoreGridViewMode, SCORING_CATEGORIES (+2 more)

### Community 21 - "Supabase Free-Plan Engineering Guardrails & Architecture Rulebook"
Cohesion: 0.14
Nodes (14): 10. Egress & PostgREST Query Rules, 11. Student Login Critical Path Rules, 12. Polling Rules, 1. Executive Summary & Free-Plan Safety Principle, 2. Supabase Free-Plan Quotas & Safety Margins, 4. `social_coverage` High-Risk JSONB Document Rules, 5. Timer Architecture Rules, 6. Agenda Architecture Rules (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "StudentAllocationCard.tsx"
Cohesion: 0.22
Nodes (12): formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, logVoteStateTrace(), StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry() (+4 more)

### Community 24 - "AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS"
Cohesion: 0.18
Nodes (11): 10. Egress & Query Rules, 1. The Free-Plan Safety Principle, 2. Mandatory "Free-Plan Safety Check" for AI Agents, 3. Database Write Budget Rules, 4. `social_coverage` Write Bus Prohibition, 5. Live Timer Rules, 6. Agenda Rules, 7. Projector Rules (+3 more)

### Community 25 - ".getEvents"
Cohesion: 0.12
Nodes (7): EventSlugOnlyRedirector(), MyEventsDashboard(), EventDeadline, ProceedingsQuestion, findEventBySlug(), getEventSlug(), slugify()

### Community 26 - "4. Operational Playbook for Threshold Breaches"
Cohesion: 0.25
Nodes (8): 1. Monitoring Strategy & Conservative Thresholds, 2. Key Metrics & Warning Threshold Matrix, 4. Operational Playbook for Threshold Breaches, Scenario 1: Database Size Approaches Warning (250 MB), Scenario 2: High Disk I/O or IOPS Throttling Detected, Scenario 3: Realtime Message Rate Approaches Warning ($> 25$ msg/sec), Scenario 4: Egress Approaches 2.5 GB / Month, Supabase Free-Plan Health Monitoring Guide & Early-Warning Playbook

### Community 27 - "AgendaTab.tsx"
Cohesion: 0.32
Nodes (7): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, AgendaCategory, AgendaDay, AgendaStatus

### Community 28 - "3. PostgreSQL SQL Diagnostic Queries"
Cohesion: 0.33
Nodes (6): 3. PostgreSQL SQL Diagnostic Queries, A. Database Size & Table Disk Usage, B. Shared Buffer Cache Hit Ratio (Should be $\ge 98\%$), C. Top Database Writes via `pg_stat_statements`, D. Top Database Reads & Execution Times, E. Dead Tuple & Bloat Analysis (Vacuum Efficiency)

### Community 29 - "ElectionsTab.tsx"
Cohesion: 0.26
Nodes (10): RevealResultControls(), RevealResultControlsProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps, getProjectorSettings(), ProjectorTab(), saveProjectorSettings() (+2 more)

### Community 31 - "TeamMember"
Cohesion: 0.60
Nodes (4): TeamTab(), TeamTabProps, TeamMember, canManageTeam()

### Community 32 - "ChatMessage"
Cohesion: 0.67
Nodes (3): ChatTab(), ChatTabProps, ChatMessage

### Community 33 - "FeedbackEntry"
Cohesion: 0.67
Nodes (3): FeedbackTab(), FeedbackTabProps, FeedbackEntry

### Community 34 - "allocationEngine.ts"
Cohesion: 0.29
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 35 - "sessionUtils.ts"
Cohesion: 0.50
Nodes (3): CANONICAL_SESSIONS, CanonicalSessionDefinition, ResolvedCanonicalSession

### Community 36 - "JuryDashboard.tsx"
Cohesion: 0.17
Nodes (13): UnifiedLoginPage(), UnifiedLoginPageProps, COMM_STEPS, CONDUCT_STEPS, JuryDashboard(), ORIGINALITY_STEPS, RELEVANCE_STEPS, RESEARCH_STEPS (+5 more)

### Community 37 - "3. Database Write Budget & Anti-Amplification Rules"
Cohesion: 0.67
Nodes (3): 3. Database Write Budget & Anti-Amplification Rules, Strict Non-Negotiable Prohibition:, Write Verification Checklist:

### Community 39 - "csvHelper.ts"
Cohesion: 0.26
Nodes (12): DownloadModal(), ReportTab(), CSVImportResult, deduplicateLearners(), EXPORT_COLUMNS_REGISTRY, exportCustomParticipantData(), exportFullParticipantDataToCSV(), exportFullParticipantDataToExcel() (+4 more)

### Community 42 - "ParliamentQuestion"
Cohesion: 0.67
Nodes (3): QuestionnaireTab(), QuestionnaireTabProps, ParliamentQuestion

### Community 43 - ".getAgenda"
Cohesion: 0.12
Nodes (3): JuryEvaluation, JurySpeechRecognition, resolveCanonicalSession()

### Community 44 - "CollegeEvent"
Cohesion: 0.22
Nodes (20): EventTabRouteHandlerProps, HeaderProps, StandaloneProjectorDisplayProps, ArrangeQuestionOrderModalProps, ControlTabProps, ProjectorTabProps, JuryDashboardProps, SpeakerDashboardProps (+12 more)

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 58 - "App.tsx"
Cohesion: 0.12
Nodes (23): react-router-dom, App(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, ActiveNavTab (+15 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 74 - "AGENT_RULES.md"
Cohesion: 0.32
Nodes (4): AGENTS.md — Repository AI Agent Instructions, Free-Plan Safety Checklist (Must Answer Before Any Edit), Key Operating Rules at a Glance, The Free-Plan Safety Principle

## Knowledge Gaps
- **220 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 248 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CsvImportModal.tsx`, `memberIdentity.ts`, `ParticipantsTab.tsx`, `index.ts`, `Learner`, `.saveTimerAudioConfig`, `UserRole`, `storageService.ts`, `react`, `.syncEventStateToSupabase`, `VolunteerDashboard.tsx`, `LoginRecord`, `.unpackAndApplyEventState`, `.getLearners`, `StandaloneProjectorDisplay.tsx`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `.getEvents`, `AgendaTab.tsx`, `ElectionsTab.tsx`, `.setItem`, `allocationEngine.ts`, `JuryDashboard.tsx`, `csvHelper.ts`, `ParliamentQuestion`, `.getAgenda`, `CollegeEvent`, `App.tsx`?**
  _High betweenness centrality (0.362) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `CsvImportModal.tsx`, `memberIdentity.ts`, `package.json`, `ParticipantsTab.tsx`, `Learner`, `UserRole`, `VolunteerDashboard.tsx`, `MediaTab.tsx`, `.unpackAndApplyEventState`, `.getLearners`, `StandaloneProjectorDisplay.tsx`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `AgendaTab.tsx`, `ElectionsTab.tsx`, `TeamMember`, `ChatMessage`, `FeedbackEntry`, `JuryDashboard.tsx`, `csvHelper.ts`, `ParliamentQuestion`, `CollegeEvent`, `App.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `react` to `CsvImportModal.tsx`, `memberIdentity.ts`, `package.json`, `ParticipantsTab.tsx`, `Learner`, `UserRole`, `VolunteerDashboard.tsx`, `MediaTab.tsx`, `.unpackAndApplyEventState`, `.getLearners`, `StandaloneProjectorDisplay.tsx`, `ScoreGridTab.tsx`, `StudentAllocationCard.tsx`, `AgendaTab.tsx`, `ElectionsTab.tsx`, `TeamMember`, `ChatMessage`, `FeedbackEntry`, `JuryDashboard.tsx`, `csvHelper.ts`, `ParliamentQuestion`, `CollegeEvent`, `App.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CsvImportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._