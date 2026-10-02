# Graph Report - TN_Assembly-  (2026-10-02)

## Corpus Check
- 127 files · ~334,223 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1066 nodes · 4265 edges · 42 communities (30 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `306950b6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CsvImportModal.tsx
- EventDay
- package.json
- DaysActivitiesTab.tsx
- .setItem
- Learner
- .saveTimerAudioConfig
- UserRole
- storageService.ts
- lucide-react
- VolunteerDashboard.tsx
- LoginRecord
- aws
- .getEvents
- compilerOptions
- storageService
- ControlTab.tsx
- Supabase Free-Plan Engineering Guardrails & Architecture Rulebook
- compilerOptions
- StudentDashboard.tsx
- AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS
- 4. Operational Playbook for Threshold Breaches
- 3. PostgreSQL SQL Diagnostic Queries
- .getAgendaProgress
- allocationEngine.ts
- 3. Database Write Budget & Anti-Amplification Rules
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
1. `storageService` - 403 edges
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
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (42 total, 8 thin omitted)

### Community 0 - "CsvImportModal.tsx"
Cohesion: 0.14
Nodes (19): xlsx, CsvImportModal(), ImportReportData, UpdateReportData, CSVImportStats, exportAllocationTemplateCSV(), parseCSVFile(), DuplicateRow (+11 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "DaysActivitiesTab.tsx"
Cohesion: 0.29
Nodes (7): DaysActivitiesTabProps, EditDayActivitiesModal(), EditDayActivitiesModalProps, DayAttendanceRecord, DayAttendanceStatus, EventDayStatus, STANDARD_TN_ACTIVITIES

### Community 6 - "Learner"
Cohesion: 0.11
Nodes (43): AddLearnerModal(), AddLearnerModalProps, AllocationCheckTabProps, AllocationModal(), AllocationModalProps, AllocationTabProps, AnalyticsTab(), AnalyticsTabProps (+35 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.40
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "UserRole"
Cohesion: 0.09
Nodes (26): papaparse, ChecklistTab(), ChecklistTabProps, CommitteesTab(), SearchableChairpersonSelectProps, JuryTab(), JuryTabProps, ALL_NOMINATION_ROLES (+18 more)

### Community 9 - "storageService.ts"
Cohesion: 0.05
Nodes (61): AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS, QuestionnaireTab(), QuestionnaireTabProps, ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA (+53 more)

### Community 10 - "lucide-react"
Cohesion: 0.13
Nodes (15): lucide-react, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboardProps (+7 more)

### Community 12 - "VolunteerDashboard.tsx"
Cohesion: 0.06
Nodes (50): @supabase/supabase-js, DaysActivitiesTab(), Header(), AllocationTab(), CabinetTab(), MinistryItem, SearchableDelegateSelect(), EditLearnerModal() (+42 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - ".getEvents"
Cohesion: 0.08
Nodes (4): deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), VoteAuditEntry

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 18 - "storageService"
Cohesion: 0.06
Nodes (4): genUuid(), isValidUuid(), sortLearnersStably(), storageService

### Community 19 - "ControlTab.tsx"
Cohesion: 0.07
Nodes (57): App(), EventSlugOnlyRedirector(), EventTabRouteHandler(), getInitialRouteInfo(), getInitialSavedSession(), QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplay() (+49 more)

### Community 21 - "Supabase Free-Plan Engineering Guardrails & Architecture Rulebook"
Cohesion: 0.14
Nodes (14): 10. Egress & PostgREST Query Rules, 11. Student Login Critical Path Rules, 12. Polling Rules, 1. Executive Summary & Free-Plan Safety Principle, 2. Supabase Free-Plan Quotas & Safety Margins, 4. `social_coverage` High-Risk JSONB Document Rules, 5. Timer Architecture Rules, 6. Agenda Architecture Rules (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "StudentDashboard.tsx"
Cohesion: 0.16
Nodes (17): AllocationCheckTab(), AllocationVerificationModal(), AllocationVerificationModalProps, formatCheckedDate(), StudentAllocationCard(), StudentAllocationCardProps, logVoteStateTrace(), StudentDashboard() (+9 more)

### Community 24 - "AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS"
Cohesion: 0.18
Nodes (11): 10. Egress & Query Rules, 1. The Free-Plan Safety Principle, 2. Mandatory "Free-Plan Safety Check" for AI Agents, 3. Database Write Budget Rules, 4. `social_coverage` Write Bus Prohibition, 5. Live Timer Rules, 6. Agenda Rules, 7. Projector Rules (+3 more)

### Community 26 - "4. Operational Playbook for Threshold Breaches"
Cohesion: 0.25
Nodes (8): 1. Monitoring Strategy & Conservative Thresholds, 2. Key Metrics & Warning Threshold Matrix, 4. Operational Playbook for Threshold Breaches, Scenario 1: Database Size Approaches Warning (250 MB), Scenario 2: High Disk I/O or IOPS Throttling Detected, Scenario 3: Realtime Message Rate Approaches Warning ($> 25$ msg/sec), Scenario 4: Egress Approaches 2.5 GB / Month, Supabase Free-Plan Health Monitoring Guide & Early-Warning Playbook

### Community 28 - "3. PostgreSQL SQL Diagnostic Queries"
Cohesion: 0.33
Nodes (6): 3. PostgreSQL SQL Diagnostic Queries, A. Database Size & Table Disk Usage, B. Shared Buffer Cache Hit Ratio (Should be $\ge 98\%$), C. Top Database Writes via `pg_stat_statements`, D. Top Database Reads & Execution Times, E. Dead Tuple & Bloat Analysis (Vacuum Efficiency)

### Community 34 - "allocationEngine.ts"
Cohesion: 0.31
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 37 - "3. Database Write Budget & Anti-Amplification Rules"
Cohesion: 0.67
Nodes (3): 3. Database Write Budget & Anti-Amplification Rules, Strict Non-Negotiable Prohibition:, Write Verification Checklist:

### Community 43 - ".getAgenda"
Cohesion: 0.06
Nodes (29): CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, ScoreGridViewMode, SCORING_CATEGORIES (+21 more)

### Community 44 - "CollegeEvent"
Cohesion: 0.13
Nodes (27): EventTabRouteHandlerProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps, ControlTabProps, CONSTITUTIONAL_POSTS, ElectionsTab(), ElectionsTabProps (+19 more)

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
Cohesion: 0.08
Nodes (32): react, react-router-dom, SavedAuthSession, EventOverviewTab(), EventOverviewTabProps, MyEventsDashboard(), UnifiedLoginPage(), UnifiedLoginPageProps (+24 more)

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 74 - "AGENT_RULES.md"
Cohesion: 0.32
Nodes (4): AGENTS.md — Repository AI Agent Instructions, Free-Plan Safety Checklist (Must Answer Before Any Edit), Key Operating Rules at a Glance, The Free-Plan Safety Principle

## Knowledge Gaps
- **221 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 249 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `CsvImportModal.tsx`, `EventDay`, `DaysActivitiesTab.tsx`, `.setItem`, `Learner`, `.saveTimerAudioConfig`, `UserRole`, `storageService.ts`, `lucide-react`, `.notify`, `VolunteerDashboard.tsx`, `LoginRecord`, `.getEvents`, `ControlTab.tsx`, `StudentDashboard.tsx`, `.authenticateAccessCodeAsync`, `.getAgendaProgress`, `.getAgenda`, `CollegeEvent`, `App.tsx`?**
  _High betweenness centrality (0.369) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `CsvImportModal.tsx`, `package.json`, `DaysActivitiesTab.tsx`, `Learner`, `UserRole`, `storageService.ts`, `lucide-react`, `.getAgenda`, `CollegeEvent`, `VolunteerDashboard.tsx`, `ControlTab.tsx`, `StudentDashboard.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `CsvImportModal.tsx`, `package.json`, `DaysActivitiesTab.tsx`, `Learner`, `UserRole`, `storageService.ts`, `.getAgenda`, `CollegeEvent`, `VolunteerDashboard.tsx`, `ControlTab.tsx`, `StudentDashboard.tsx`, `App.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CsvImportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Should `.setItem` be split into smaller, more focused modules?**
  _Cohesion score 0.06625258799171843 - nodes in this community are weakly interconnected._