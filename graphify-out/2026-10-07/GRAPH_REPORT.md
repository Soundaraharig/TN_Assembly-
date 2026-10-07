# Graph Report - TN_Assembly-  (2026-10-03)

## Corpus Check
- 127 files · ~340,501 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1071 nodes · 4295 edges · 52 communities (37 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `03c57d25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- csvHelper.ts
- .getEvents
- package.json
- index.ts
- ParticipantsTab.tsx
- .setItem
- Learner
- .saveTimerAudioConfig
- UserRole
- storageService.ts
- lucide-react
- .notify
- VolunteerDashboard.tsx
- LoginRecord
- react
- aws
- compilerOptions
- .getLearners
- ControlTab.tsx
- devDependencies
- Supabase Free-Plan Engineering Guardrails & Architecture Rulebook
- compilerOptions
- StudentDashboard.tsx
- AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS
- storageService
- 4. Operational Playbook for Threshold Breaches
- .submitSpeakingRequest
- 3. PostgreSQL SQL Diagnostic Queries
- Volunteer
- dependencies
- supabase.ts
- presenceService
- .getCoordinators
- allocationEngine.ts
- scripts
- .getElectionSnapshots
- 3. Database Write Budget & Anti-Amplification Rules
- JuryDashboard.tsx
- EventDay
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
1. `storageService` - 408 edges
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
- `EditDayActivitiesModalProps` --references--> `EventDay`  [EXTRACTED]
  src/components/admin/EditDayActivitiesModal.tsx → src/types/index.ts
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts
- `SearchableChairpersonSelectProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/CommitteesTab.tsx → src/types/index.ts
- `SubmissionListModalProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/SubmissionListModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (52 total, 12 thin omitted)

### Community 0 - "csvHelper.ts"
Cohesion: 0.08
Nodes (37): xlsx, AddLearnerModal(), CsvImportModal(), ImportReportData, UpdateReportData, DownloadModal(), ProceedingsTabProps, ReportTab() (+29 more)

### Community 2 - "package.json"
Cohesion: 0.10
Nodes (19): name, private, type, version, jspdf, oxlint, pg, @playwright/test (+11 more)

### Community 3 - "index.ts"
Cohesion: 0.09
Nodes (24): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, ChatTab(), ChatTabProps, FeedbackTab(), FeedbackTabProps (+16 more)

### Community 4 - "ParticipantsTab.tsx"
Cohesion: 0.22
Nodes (19): Header(), AllocationCheckTab(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal(), ParticipantsTab() (+11 more)

### Community 5 - ".setItem"
Cohesion: 0.08
Nodes (3): uid(), Nomination, StudentVoteRecord

### Community 6 - "Learner"
Cohesion: 0.15
Nodes (31): EventTabRouteHandlerProps, DaysActivitiesTabProps, AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab() (+23 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.40
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "UserRole"
Cohesion: 0.11
Nodes (21): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+13 more)

### Community 9 - "storageService.ts"
Cohesion: 0.07
Nodes (39): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+31 more)

### Community 10 - "lucide-react"
Cohesion: 0.13
Nodes (21): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, EventOverviewTab() (+13 more)

### Community 12 - "VolunteerDashboard.tsx"
Cohesion: 0.09
Nodes (29): EventSlugOnlyRedirector(), formatConstituencyName(), matchesLearnerConstituency(), VolunteerDashboard(), YuvaAssignment, EventDeadline, formatMarkedBy(), getCanonicalQuestionStatus() (+21 more)

### Community 14 - "react"
Cohesion: 0.12
Nodes (11): react, EditDayActivitiesModal(), EditDayActivitiesModalProps, OrganizerSignInProps, SubmissionListModal(), SubmissionListModalProps, SubmittedMemberRecord, AllocationVerificationModalProps (+3 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "ControlTab.tsx"
Cohesion: 0.09
Nodes (53): QuestionCallingPanel(), QuestionCallingPanelProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplay(), StandaloneProjectorDisplayProps, ArrangeQuestionOrderModal(), ArrangeQuestionOrderModalProps (+45 more)

### Community 20 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, oxlint, pg, @playwright/test, tailwindcss, @tailwindcss/vite, @types/node, @types/papaparse (+6 more)

### Community 21 - "Supabase Free-Plan Engineering Guardrails & Architecture Rulebook"
Cohesion: 0.14
Nodes (14): 10. Egress & PostgREST Query Rules, 11. Student Login Critical Path Rules, 12. Polling Rules, 1. Executive Summary & Free-Plan Safety Principle, 2. Supabase Free-Plan Quotas & Safety Margins, 4. `social_coverage` High-Risk JSONB Document Rules, 5. Timer Architecture Rules, 6. Agenda Architecture Rules (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "StudentDashboard.tsx"
Cohesion: 0.20
Nodes (15): AllocationVerificationModal(), formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, logVoteStateTrace(), StudentDashboard(), StudentDashboardTab, computeAllocationHash() (+7 more)

### Community 24 - "AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS"
Cohesion: 0.18
Nodes (11): 10. Egress & Query Rules, 1. The Free-Plan Safety Principle, 2. Mandatory "Free-Plan Safety Check" for AI Agents, 3. Database Write Budget Rules, 4. `social_coverage` Write Bus Prohibition, 5. Live Timer Rules, 6. Agenda Rules, 7. Projector Rules (+3 more)

### Community 25 - "storageService"
Cohesion: 0.08
Nodes (6): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably(), storageService, LearnerAllocationConfirmation

### Community 26 - "4. Operational Playbook for Threshold Breaches"
Cohesion: 0.25
Nodes (8): 1. Monitoring Strategy & Conservative Thresholds, 2. Key Metrics & Warning Threshold Matrix, 4. Operational Playbook for Threshold Breaches, Scenario 1: Database Size Approaches Warning (250 MB), Scenario 2: High Disk I/O or IOPS Throttling Detected, Scenario 3: Realtime Message Rate Approaches Warning ($> 25$ msg/sec), Scenario 4: Egress Approaches 2.5 GB / Month, Supabase Free-Plan Health Monitoring Guide & Early-Warning Playbook

### Community 28 - "3. PostgreSQL SQL Diagnostic Queries"
Cohesion: 0.33
Nodes (6): 3. PostgreSQL SQL Diagnostic Queries, A. Database Size & Table Disk Usage, B. Shared Buffer Cache Hit Ratio (Should be $\ge 98\%$), C. Top Database Writes via `pg_stat_statements`, D. Top Database Reads & Execution Times, E. Dead Tuple & Bloat Analysis (Vacuum Efficiency)

### Community 29 - "Volunteer"
Cohesion: 0.27
Nodes (5): AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps, JuryMember, Volunteer

### Community 30 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+1 more)

### Community 31 - "supabase.ts"
Cohesion: 0.31
Nodes (7): @supabase/supabase-js, isSupabaseEnabled, supabase, supabaseAnonKey, supabaseUrl, PresenceListener, PresenceUser

### Community 34 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 35 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

### Community 37 - "3. Database Write Budget & Anti-Amplification Rules"
Cohesion: 0.67
Nodes (3): 3. Database Write Budget & Anti-Amplification Rules, Strict Non-Negotiable Prohibition:, Write Verification Checklist:

### Community 43 - "JuryDashboard.tsx"
Cohesion: 0.05
Nodes (34): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, ScoreGridViewMode, SCORING_CATEGORIES (+26 more)

### Community 44 - "EventDay"
Cohesion: 0.23
Nodes (3): DayAttendanceStatus, EventDay, getRecordSessionStatuses()

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
Cohesion: 0.10
Nodes (29): react-router-dom, App(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), SavedAuthSession, DaysActivitiesTab(), ActiveNavTab (+21 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 74 - "AGENT_RULES.md"
Cohesion: 0.32
Nodes (4): AGENTS.md — Repository AI Agent Instructions, Free-Plan Safety Checklist (Must Answer Before Any Edit), Key Operating Rules at a Glance, The Free-Plan Safety Principle

## Knowledge Gaps
- **221 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 249 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `csvHelper.ts`, `.getEvents`, `index.ts`, `ParticipantsTab.tsx`, `.setItem`, `Learner`, `.saveTimerAudioConfig`, `UserRole`, `storageService.ts`, `lucide-react`, `.notify`, `VolunteerDashboard.tsx`, `LoginRecord`, `react`, `.getAgenda`, `.getLearners`, `ControlTab.tsx`, `StudentDashboard.tsx`, `.submitSpeakingRequest`, `Volunteer`, `.getCoordinators`, `.getElectionSnapshots`, `JuryDashboard.tsx`, `EventDay`, `App.tsx`?**
  _High betweenness centrality (0.382) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `csvHelper.ts`, `package.json`, `index.ts`, `ParticipantsTab.tsx`, `Learner`, `UserRole`, `lucide-react`, `JuryDashboard.tsx`, `VolunteerDashboard.tsx`, `ControlTab.tsx`, `StudentDashboard.tsx`, `App.tsx`, `Volunteer`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `csvHelper.ts`, `package.json`, `index.ts`, `ParticipantsTab.tsx`, `Learner`, `UserRole`, `JuryDashboard.tsx`, `VolunteerDashboard.tsx`, `react`, `ControlTab.tsx`, `StudentDashboard.tsx`, `App.tsx`, `Volunteer`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `csvHelper.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07822410147991543 - nodes in this community are weakly interconnected._
- **Should `.getEvents` be split into smaller, more focused modules?**
  _Cohesion score 0.11092436974789915 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.10476190476190476 - nodes in this community are weakly interconnected._