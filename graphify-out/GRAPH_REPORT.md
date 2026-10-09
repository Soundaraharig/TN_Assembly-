# Graph Report - TN_Assembly-  (2026-10-09)

## Corpus Check
- 152 files · ~381,175 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1300 nodes · 4817 edges · 62 communities (50 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f2a7b4c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Party
- .getEvents
- package.json
- index.ts
- AllocationCheckTab.tsx
- .setItem
- UserRole
- .saveTimerAudioConfig
- Volunteer
- storageService.ts
- MyEventsDashboard.tsx
- .notify
- VolunteerDashboard.tsx
- .recordLogin
- .unpackAndApplyEventState
- aws
- Learner
- compilerOptions
- .getLearners
- ControlTab.tsx
- ParticipantsTab.tsx
- Supabase Free-Plan Engineering Guardrails & Architecture Rulebook
- compilerOptions
- lucide-react
- AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS
- storageService
- 4. Operational Playbook for Threshold Breaches
- MockStorageService
- 3. PostgreSQL SQL Diagnostic Queries
- App.tsx
- 2. Detailed Findings & Evidence
- auth.ts
- AttendanceLockController
- allocationEngine.ts
- Supabase Row Level Security (RLS) & Authorization Architecture Plan
- Baseline Production Database Counts (Pre-Migration)
- 3. Database Write Budget & Anti-Amplification Rules
- adminApiService
- Audit of Secrets, Tokens, and Keys in Git History
- StudentDashboard
- @supabase/supabase-js
- check_90_sec_speech.js
- .getAgenda
- check_dhanush_boomesh.js
- compare_conflicts.js
- inspect_conflicts_detail.js
- .oxlintrc.json
- inspect_scores.js
- inspect_turns.js
- preview_zero_hour_scores.js
- simulate_reassignment.js
- Walkthrough & Verification Report
- Context
- React + TypeScript + Vite
- AGENT_RULES.md
- tsconfig.json
- vercel.json
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `storageService` - 441 edges
2. `Learner` - 108 edges
3. `react` - 63 edges
4. `lucide-react` - 61 edges
5. `Party` - 58 edges
6. `CollegeEvent` - 51 edges
7. `Committee` - 48 edges
8. `isValidUuid()` - 33 edges
9. `UserRole` - 33 edges
10. `getEventSlug()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `EditEventModalProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EditEventModal.tsx → src/types/index.ts
- `EventOverviewTabProps` --references--> `CollegeEvent`  [EXTRACTED]
  src/components/admin/EventOverviewTab.tsx → src/types/index.ts
- `MyEventsDashboard()` --calls--> `getEventSlug()`  [EXTRACTED]
  src/components/admin/MyEventsDashboard.tsx → src/utils/slug.ts
- `QuestionCallingPanelProps` --references--> `Learner`  [EXTRACTED]
  src/components/common/QuestionCallingPanel.tsx → src/types/index.ts
- `AwardsTabProps` --references--> `Learner`  [EXTRACTED]
  src/components/coordinator/AwardsTab.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (62 total, 9 thin omitted)

### Community 0 - "Party"
Cohesion: 0.06
Nodes (58): papaparse, xlsx, AddLearnerModal, AllocationModal, AllocationTab, CsvImportModal, AddLearnerModal(), AddLearnerModalProps (+50 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (47): dependencies, jspdf, lucide-react, papaparse, react, react-dom, react-router-dom, @supabase/supabase-js (+39 more)

### Community 3 - "index.ts"
Cohesion: 0.05
Nodes (37): AgendaTab, ChatTab, FeedbackTab, QuestionnaireTab, AgendaTab(), AgendaTabProps, CATEGORY_OPTIONS, DURATION_PRESETS (+29 more)

### Community 4 - "AllocationCheckTab.tsx"
Cohesion: 0.24
Nodes (12): AllocationCheckTab, AllocationCheckTab(), AllocationTab(), SearchableDelegateSelect(), formatCheckedDate(), StudentAllocationCard(), getResolvedCommitteeName(), getResolvedLearnerBench() (+4 more)

### Community 6 - "UserRole"
Cohesion: 0.11
Nodes (22): ChecklistTab, CommitteesTab, JuryTab, PartiesTab, TeamTab, ChecklistTab(), ChecklistTabProps, CommitteesTab() (+14 more)

### Community 7 - ".saveTimerAudioConfig"
Cohesion: 0.40
Nodes (5): TimerAudioConfig, deleteAudioConfigFromIDB(), getAudioConfigFromIDB(), openDB(), saveAudioConfigToIDB()

### Community 8 - "Volunteer"
Cohesion: 0.14
Nodes (11): VolunteersTab, SHIFTS, STATIONS, VolunteersTabProps, YuvaAssignment, AccessCodeAuthResult, StudentJoinView(), StudentJoinViewProps (+3 more)

### Community 9 - "storageService.ts"
Cohesion: 0.10
Nodes (30): ARTS_PROCEEDINGS_QUESTIONS, INITIAL_AGENDA, INITIAL_CHAT, INITIAL_CHECKLIST, INITIAL_COMMITTEES, INITIAL_COORDINATORS, INITIAL_ELECTIONS, INITIAL_EVENTS (+22 more)

### Community 10 - "MyEventsDashboard.tsx"
Cohesion: 0.17
Nodes (13): MyEventsDashboard, CreateEventModal(), CreateEventModalProps, EditCoordinatorModal(), EditCoordinatorModalProps, EditEventModal(), EditEventModalProps, MyEventsDashboard() (+5 more)

### Community 11 - ".notify"
Cohesion: 0.13
Nodes (3): ProjectorStudioSettings, findEventBySlug(), getEventSlug()

### Community 12 - "VolunteerDashboard.tsx"
Cohesion: 0.06
Nodes (46): ProceedingsTab, VolunteerDashboard, ArrangeQuestionOrderModalProps, EditQuestionModal(), EditQuestionModalProps, ProceedingsTab(), SubmissionListModal(), SubmissionListModalProps (+38 more)

### Community 13 - ".recordLogin"
Cohesion: 0.33
Nodes (3): detectDeviceType(), getDeviceInfo(), LoginRecord

### Community 14 - ".unpackAndApplyEventState"
Cohesion: 0.09
Nodes (17): DaysActivitiesTab, DaysActivitiesTab(), EditDayActivitiesModal(), EditDayActivitiesModalProps, deduplicateElectionList(), getElectionCanonicalKey(), mergeTwoElections(), sortLearnersStably() (+9 more)

### Community 15 - "aws"
Cohesion: 0.10
Nodes (20): helpLevel, name, profile, region, source, type, awsExperience, awsProfile (+12 more)

### Community 16 - "Learner"
Cohesion: 0.13
Nodes (35): ElectionsTab, EventTabRouteHandlerProps, ReportTab, DaysActivitiesTabProps, MyEventsDashboardProps, RevealResultControls(), RevealResultControlsProps, StandaloneProjectorDisplayProps (+27 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 19 - "ControlTab.tsx"
Cohesion: 0.14
Nodes (30): QuestionCallingPanel(), QuestionCallingPanelProps, StandaloneProjectorDisplay(), ArrangeQuestionOrderModal(), ControlTab(), SpeakerDashboard(), areJsonbObjectsEqual(), deriveBillVoteCounts() (+22 more)

### Community 20 - "ParticipantsTab.tsx"
Cohesion: 0.22
Nodes (16): CabinetTab, EventTabRouteHandler(), ParticipantsTab, Header(), CabinetTab(), MinistryItem, EditLearnerModal(), ParticipantsTab() (+8 more)

### Community 21 - "Supabase Free-Plan Engineering Guardrails & Architecture Rulebook"
Cohesion: 0.14
Nodes (14): 10. Egress & PostgREST Query Rules, 11. Student Login Critical Path Rules, 12. Polling Rules, 1. Executive Summary & Free-Plan Safety Principle, 2. Supabase Free-Plan Quotas & Safety Margins, 4. `social_coverage` High-Risk JSONB Document Rules, 5. Timer Architecture Rules, 6. Agenda Architecture Rules (+6 more)

### Community 22 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 23 - "lucide-react"
Cohesion: 0.13
Nodes (13): lucide-react, NominationsTab, StudentDashboard, OrganizerSignInProps, ALL_NOMINATION_ROLES, NominationsTab(), NominationsTabProps, AllocationVerificationModal() (+5 more)

### Community 24 - "AI AGENT ARCHITECTURE & SUPABASE FREE-PLAN GUARDRAILS"
Cohesion: 0.18
Nodes (11): 10. Egress & Query Rules, 1. The Free-Plan Safety Principle, 2. Mandatory "Free-Plan Safety Check" for AI Agents, 3. Database Write Budget Rules, 4. `social_coverage` Write Bus Prohibition, 5. Live Timer Rules, 6. Agenda Rules, 7. Projector Rules (+3 more)

### Community 26 - "4. Operational Playbook for Threshold Breaches"
Cohesion: 0.25
Nodes (8): 1. Monitoring Strategy & Conservative Thresholds, 2. Key Metrics & Warning Threshold Matrix, 4. Operational Playbook for Threshold Breaches, Scenario 1: Database Size Approaches Warning (250 MB), Scenario 2: High Disk I/O or IOPS Throttling Detected, Scenario 3: Realtime Message Rate Approaches Warning ($> 25$ msg/sec), Scenario 4: Egress Approaches 2.5 GB / Month, Supabase Free-Plan Health Monitoring Guide & Early-Warning Playbook

### Community 27 - "MockStorageService"
Cohesion: 0.25
Nodes (3): MockJuryClient, MockStorageService, runTests()

### Community 28 - "3. PostgreSQL SQL Diagnostic Queries"
Cohesion: 0.33
Nodes (6): 3. PostgreSQL SQL Diagnostic Queries, A. Database Size & Table Disk Usage, B. Shared Buffer Cache Hit Ratio (Should be $\ge 98\%$), C. Top Database Writes via `pg_stat_statements`, D. Top Database Reads & Execution Times, E. Dead Tuple & Bloat Analysis (Vacuum Efficiency)

### Community 29 - "App.tsx"
Cohesion: 0.05
Nodes (52): react, react-router-dom, App(), AwardsTab, ChapterAwardsTab, ControlTab, EventOverviewTab, EventSlugOnlyRedirector() (+44 more)

### Community 30 - "2. Detailed Findings & Evidence"
Cohesion: 0.12
Nodes (15): 1. Classification Summary, 2. Detailed Findings & Evidence, Comprehensive Security Audit Report (Current Codebase), [V-01] Hardcoded Supabase Fallback Credentials in Source, [V-02] Unprotected Direct `/speaker-aid` URL Routing, [V-03] Unchecked Question Deletion Method, [V-04] Public Query Fetching All Coordinator Passwords, [V-05] Missing Production HTTP Security Headers (+7 more)

### Community 31 - "auth.ts"
Cohesion: 0.21
Nodes (14): ApiRequest, ApiResponse, handler(), ApiRequest, ApiResponse, handler(), base64UrlDecode(), base64UrlEncode() (+6 more)

### Community 32 - "AttendanceLockController"
Cohesion: 0.23
Nodes (4): AttendanceLockController, localStorage, MockLocalStorage, runAllTests()

### Community 33 - "allocationEngine.ts"
Cohesion: 0.29
Nodes (10): allocateCommittees(), allocateConstituencies(), allocateParties(), AllocationMode, CommitteeAllocationOptions, computeAllocationStats(), ConstituencyAllocationOptions, PartyAllocationOptions (+2 more)

### Community 34 - "Supabase Row Level Security (RLS) & Authorization Architecture Plan"
Cohesion: 0.22
Nodes (7): 1. Fundamental Architectural Constraint, 2. Table-by-Table Security Matrix, 3. Phased Implementation Plan, 4. Rollback Strategy, Phase A (Non-Breaking Hardening — Prepared in `supabase_security_hardening.sql`), Phase B (Server-Side Credential Verification — Post-Event), Supabase Row Level Security (RLS) & Authorization Architecture Plan

### Community 36 - "Baseline Production Database Counts (Pre-Migration)"
Cohesion: 0.29
Nodes (5): 1. Active Event: JKKNCET TN ASSEMBLY 2026, 2. Comparison Event: JKKN ARTS TN ASSEMBLY 2026, 3. All Other Events Baseline, 4. Zero Data Loss Mandate, Baseline Production Database Counts (Pre-Migration)

### Community 37 - "3. Database Write Budget & Anti-Amplification Rules"
Cohesion: 0.67
Nodes (3): 3. Database Write Budget & Anti-Amplification Rules, Strict Non-Negotiable Prohibition:, Write Verification Checklist:

### Community 39 - "Audit of Secrets, Tokens, and Keys in Git History"
Cohesion: 0.33
Nodes (4): 1. Distinction: Public Anon Key vs. Privileged Secrets, 2. Historical Snapshot Inclusions (September 24 Backups), 3. Recommendations & History Cleanup Plan, Audit of Secrets, Tokens, and Keys in Git History

### Community 40 - "StudentDashboard"
Cohesion: 0.32
Nodes (7): logVoteStateTrace(), StudentDashboard(), computeAllocationHash(), getAllocationCheckStatus(), getMinisterAssignedMinistry(), isQuestionForMinister(), normalizeMinistryKey()

### Community 41 - "@supabase/supabase-js"
Cohesion: 0.33
Nodes (4): @supabase/supabase-js, envContent, envLines, supabase

### Community 42 - "check_90_sec_speech.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 43 - ".getAgenda"
Cohesion: 0.05
Nodes (29): ScoreGridTab, CategoryId, getCategoryScoreFromRecord(), isParticipantActive(), ItemizedScoreRow, ScoreGridTab(), ScoreGridTabProps, ScoreGridViewMode (+21 more)

### Community 44 - "check_dhanush_boomesh.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 45 - "compare_conflicts.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 46 - "inspect_conflicts_detail.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 47 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 48 - "inspect_scores.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 49 - "inspect_turns.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 50 - "preview_zero_hour_scores.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 51 - "simulate_reassignment.js"
Cohesion: 0.40
Nodes (3): envContent, envLines, supabase

### Community 53 - "Walkthrough & Verification Report"
Cohesion: 0.33
Nodes (5): 1. Fixed Volunteer Access Codes (Removed Raw Mobile Numbers), 2. Added Copy Button to Access Codes in Tables, 3. Removed Raw Strings from Student Login Candidate Cards, Verification, Walkthrough & Verification Report

### Community 57 - "Context"
Cohesion: 0.33
Nodes (5): AWS Guidance for the new AWS experience, Constraints:, Context, Help level, Terminology:

### Community 59 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 74 - "AGENT_RULES.md"
Cohesion: 0.32
Nodes (4): AGENTS.md — Repository AI Agent Instructions, Free-Plan Safety Checklist (Must Answer Before Any Edit), Key Operating Rules at a Glance, The Free-Plan Safety Principle

## Knowledge Gaps
- **281 isolated node(s):** `$schema`, `npm`, `name`, `baseURL`, `type` (+276 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 339 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `storageService` connect `storageService` to `Party`, `.getEvents`, `index.ts`, `AllocationCheckTab.tsx`, `.setItem`, `UserRole`, `.saveTimerAudioConfig`, `Volunteer`, `storageService.ts`, `MyEventsDashboard.tsx`, `.notify`, `VolunteerDashboard.tsx`, `.recordLogin`, `.unpackAndApplyEventState`, `Learner`, `.getLearners`, `ControlTab.tsx`, `ParticipantsTab.tsx`, `lucide-react`, `App.tsx`, `allocationEngine.ts`, `.setupRealtimeSync`, `StudentDashboard`, `.getAgenda`?**
  _High betweenness centrality (0.315) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `package.json`, `check_90_sec_speech.js`, `check_dhanush_boomesh.js`, `compare_conflicts.js`, `inspect_conflicts_detail.js`, `VolunteerDashboard.tsx`, `inspect_scores.js`, `inspect_turns.js`, `preview_zero_hour_scores.js`, `simulate_reassignment.js`, `auth.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `Party`, `package.json`, `index.ts`, `AllocationCheckTab.tsx`, `UserRole`, `Volunteer`, `MyEventsDashboard.tsx`, `.getAgenda`, `VolunteerDashboard.tsx`, `.unpackAndApplyEventState`, `Learner`, `ControlTab.tsx`, `ParticipantsTab.tsx`, `lucide-react`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `$schema`, `npm`, `name` to the rest of the system?**
  _281 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Party` be split into smaller, more focused modules?**
  _Cohesion score 0.06438631790744467 - nodes in this community are weakly interconnected._
- **Should `.getEvents` be split into smaller, more focused modules?**
  _Cohesion score 0.10685249709639953 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._