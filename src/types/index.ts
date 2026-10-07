export type BenchType = 'Ruling' | 'Opposition' | 'Independent';

export type EventStage = 'College Round' | 'District Round' | 'State Quarter Finals' | 'State Semi Finals' | 'Final Round';

export type EventStatus = 'Draft' | 'Pre-Event' | 'Day 1 Live' | 'Day 2 Live' | 'Completed';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type UserRole = 'super_admin' | 'coordinator' | 'student' | 'jury' | 'volunteer' | 'organiser';

export interface UserSession {
  role: UserRole;
  email?: string;
  name?: string;
  assigned_event_ids?: string[]; // For coordinator
  student?: Learner;            // For student delegate
  juryMember?: JuryMember;      // For jury access
  volunteerMember?: Volunteer;  // For volunteer access
}

export interface CollegeEvent {
  id: string;
  slug?: string;
  college_name: string;
  chapter: string;
  level: string;
  location: string;
  dates: string;
  event_stage: EventStage;
  status: EventStatus;
  participant_count: number;
  assigned_coordinator_email?: string;
  assigned_coordinator_name?: string;
  elections_count?: number;
  is_locked?: boolean;
  treasury_whatsapp_link?: string;
  opposition_whatsapp_link?: string;
  cabinet_ministries?: string[];
  chief_guests?: any;
  social_coverage?: Record<string, any>;
  created_at: string;
}

export interface Coordinator {
  id: string;
  event_id: string;
  name: string;
  email: string;
  password_hash?: string;
  raw_temp_password?: string;
}

export interface Learner {
  id: string;
  event_id: string;
  access_code: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  school_name?: string;
  academic_year: AcademicYear;
  constituency_number?: number;
  roll_no?: number | string;
  constituency_name?: string;
  district?: string;
  party_name?: string;
  party_id?: string;
  party_group_link?: string;
  bench?: BenchType;
  role?: string;
  committee_name?: string;
  committee_id?: string;
  committee_group_link?: string;
  day1_checked_in: boolean;
  day2_checked_in: boolean;
  is_active?: boolean;
  status?: 'Active' | 'Inactive' | string;
  created_at: string;
  updated_at?: string;
}

export type AllocationCheckStatus = 'CHECKED' | 'NOT CHECKED' | 'NEEDS RE-CHECK';

export interface LearnerAllocationConfirmation {
  id: string;
  event_id: string;
  learner_id: string;
  allocation_hash: string;
  confirmed_party?: string;
  confirmed_committee?: string;
  confirmed_constituency_name?: string;
  confirmed_constituency_number?: number;
  confirmed_bench?: string;
  checked_at: string;
  created_at: string;
  updated_at?: string;
}

export interface Party {
  id: string;
  event_id: string;
  name: string;
  bench: BenchType;
  color: string;
  leader?: string;
  manifesto?: string;
  whatsapp_group_link?: string;
}

export interface Committee {
  id: string;
  event_id: string;
  name: string;
  topic: string;
  chairperson?: string;
  max_capacity: number;
}

export type AgendaDay = 'Pre-Event' | 'Day 1' | 'Day 2';

export type AgendaStatus = 'Upcoming' | 'In Progress' | 'Completed' | 'Skipped';

export type AgendaCategory =
  | 'General'
  | 'Voting'
  | 'Speaker Election'
  | 'Committee Discussion'
  | 'Break'
  | 'Ceremony'
  | 'Question Hour'
  | 'Bill Presentation'
  | 'Valedictory'
  | 'Inaugural'
  | 'Oath Taking'
  | 'Party Formation'
  | 'Opening Speech'
  | 'Adjournment'
  | 'Cabinet Intro'
  | 'Zero Hour'
  | string;

export interface AgendaItem {
  id: string;
  event_id: string;
  day: AgendaDay;
  date?: string;
  time: string; // Start time e.g., "09:00 AM"
  duration_minutes?: number; // Duration in minutes e.g., 30
  endTime?: string; // Calculated end time e.g., "09:30 AM"
  title: string;
  description?: string;
  category?: AgendaCategory;
  status?: AgendaStatus;
  order?: number;
  enabled?: boolean;
  speaker_role?: string;
  is_current?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface JuryMember {
  id: string;
  event_id: string;
  access_code: string;
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  assigned_bench: BenchType;
  status?: 'Active' | 'Inactive';
}

export type VolunteerType = 'Volunteer' | 'Administrator' | 'Journalist';

export interface Volunteer {
  id: string;
  event_id: string;
  access_code: string;
  name: string;
  email?: string;
  phone?: string;
  station?: string;
  shift?: string;
  is_yuva?: boolean;
  has_arrived?: boolean;
  role?: string;
  volunteer_type?: VolunteerType | string;
  created_at?: string;
}


// ── NEW MODULE INTERFACES ──────────────────────────────────────────

export type NominationPosition =
  | 'Speaker'
  | 'Deputy Speaker'
  | 'Party Leader'
  | 'Chief Minister'
  | 'Ruling Party Leader'
  | 'Leader of Opposition'
  | 'Opposition Party Leader'
  | 'Cabinet Minister'
  | 'Shadow Minister'
  | 'Committee Chair'
  | 'Student Journalist'
  | 'Administrator';

export interface NominationHistoryEntry {
  id: string;
  status: 'Submitted' | 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
  changed_by: string;
  timestamp: string;
  comment?: string;
}

export interface Nomination {
  id: string;
  event_id: string;
  position: NominationPosition;
  candidate_learner_id: string;
  candidate_name: string;
  party_name: string;
  bench: BenchType;
  manifesto: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
  votes_received?: number;
  created_at: string;
  nominated_by_name?: string;
  nominated_by_id?: string;
  history?: NominationHistoryEntry[];
}

export interface ElectionEligibility {
  scope: 'all' | 'party' | 'committee';
  targetId?: string; // party_id or committee_id if scoped
  targetName?: string;
}

export interface ElectionCandidate {
  id: string;
  learner_id?: string;
  learnerId?: string;
  name: string;
  party: string;
  bench: BenchType;
  constituency?: string;
  votes: number;
}

export interface Election {
  id: string;
  event_id: string;
  eventId?: string;
  title: string;
  position: string;
  type: 'LEADERSHIP' | 'SPEAKER' | 'DEPUTY_SPEAKER' | 'COMMITTEE' | string;
  category?: 'leadership' | 'division' | 'committee' | 'flash' | 'Leadership' | 'Floor Division' | 'Committee Ballot' | 'Flash Vote' | string;
  status: 'Upcoming' | 'Live' | 'Closed' | 'draft' | 'live' | 'closed' | string;
  candidates: ElectionCandidate[];
  total_votes: number;
  winner?: string;
  voted_delegate_ids?: string[];
  votedLearnerIds?: string[];
  votes_by_delegate?: Record<string, string>;
  party_id?: string;
  eligibility?: ElectionEligibility;
  is_archived?: boolean;
  archived_at?: string;
  completed_at?: string;
  reset_at?: string;
  is_result_revealed?: boolean;
  is_dismissed?: boolean;
  updated_at?: string;
  created_at: string;
  createdAt?: string;
}

export interface ElectionBackupSnapshot {
  id: string;
  event_id: string;
  election_id: string;
  election_title: string;
  snapshot_reason: string;
  created_at: string;
  election?: Election;
  total_votes?: number;
  winner?: string;
  elections_state?: Election[];
  flash_votes_state?: LiveFlashVote[];
  voter_logs?: any[];
}

export type AssemblyElection = Election;

export type FlashVoteAudience = 'ALL' | 'MINISTERS' | 'RULING' | 'OPPOSITION' | 'MLAS';

export interface IndividualVote {
  learner_id: string;
  learner_name: string;
  role: string;
  bench: BenchType;
  vote: 'AYE' | 'NO' | 'ABSTAIN';
  timestamp: string;
}

export interface LiveFlashVote {
  id: string;
  event_id: string;
  question: string;
  motion_type: 'Division' | 'Confidence Motion' | 'Resolution' | 'Zero Hour Poll' | 'Sudden Yes/No';
  target_audience: FlashVoteAudience;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  ayes_count: number;
  noes_count: number;
  abstain_count: number;
  voter_ids: string[];
  votes: IndividualVote[];
  is_result_revealed?: boolean;
  is_dismissed?: boolean;
}

export type BillVotingStatus =
  | 'Draft'
  | 'Ready'
  | 'Vote Open'
  | 'Voting'
  | 'Vote Closed'
  | 'Result Hidden'
  | 'Result Revealed'
  | 'Finalized'
  | 'Passed'
  | 'Rejected'
  | 'Introduced'
  | 'Debating';

export interface BillVote {
  id?: string;
  learner_id: string;
  delegate_id?: string;
  learner_name: string;
  role?: string;
  bench?: BenchType;
  party?: string;
  vote: 'YES' | 'NO' | 'ABSTAIN';
  timestamp: string;
  created_at?: string;
  cast_by?: 'Delegate' | 'Admin' | string;
  cast_by_user_id?: string;
  cast_method?: 'delegate' | 'admin';
}

export interface StudentVoteRecord {
  eventId: string;
  voteType: 'BILL' | 'ELECTION' | 'FLASH_VOTE' | 'FLASH';
  itemId: string;
  studentId: string;
  decision?: 'YES' | 'NO' | 'ABSTAIN' | 'AYE';
  candidateId?: string;
  candidateName?: string;
  timestamp: number | string;
  serverConfirmed: boolean;
}

export interface BillProceeding {
  id: string;
  event_id: string;
  bill_number: string;
  title: string;
  introduced_by?: string;
  bench?: BenchType;
  summary: string;
  description?: string;
  status: BillVotingStatus;
  proposer?: string;
  agenda_id?: string;
  ayes: number;
  noes: number;
  abstain?: number;
  total_votes?: number;
  is_result_revealed?: boolean;
  is_dismissed?: boolean;
  result?: 'PASSED' | 'FAILED';
  voted_delegate_ids?: string[];
  votes?: BillVote[];
  created_at: string;
  updated_at?: string;
}

export interface DerivedBillVoteCounts {
  ayes: number;
  noes: number;
  abstain: number;
  totalVotes: number;
  eligibleCount: number;
  notVotedCount: number;
  turnoutPct: number;
  result: 'PASSED' | 'FAILED';
  effectiveVoterIds: string[];
}

export type LiveTimerStatus = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'EXPIRED';

export interface LiveTimerState {
  durationSec: number;
  secondsLeft: number;
  remainingSec?: number;
  status?: LiveTimerStatus;
  isRunning: boolean;
  startedAt?: number;
  pausedAt?: number;
  runId?: string;
  updatedAt: number;
  version?: number;
}

export type TimerToneType = 'default' | 'bell' | 'chime' | 'gavel' | 'custom';

export interface TimerAudioConfig {
  tone_type: TimerToneType;
  custom_audio_data?: string; // Data URL (base64) or hosted URL
  custom_audio_name?: string;
  custom_audio_size?: number; // bytes
  volume?: number; // 0 to 1, default 1
  is_muted?: boolean;
  updated_at?: string;
}

export interface ScoringSession {
  id: string;
  name: string;
  day?: string;
  time?: string;
  description?: string;
  is_canonical?: boolean;
  order_number?: number;
}

export interface ScoreRecord {
  id: string;
  event_id: string;
  session_id?: string;
  session_name?: string;
  learner_id: string;
  learner_name: string;
  constituency_number?: number;
  constituency_name?: string;
  party_name: string;
  bench: BenchType;
  jury_id?: string;
  research_constituency?: number;       // Max 30
  relevance_agenda?: number;            // Max 20
  communication_delivery?: number;      // Max 20
  parliamentary_conduct?: number;       // Max 12
  originality_preparation?: number;     // Max 12
  time_management?: number;             // Max 6
  oratory?: number;                      // Legacy fallback (Max 25)
  policy_knowledge?: number;             // Legacy fallback (Max 25)
  rebuttal_debate?: number;              // Legacy fallback (Max 25)
  total: number;                         // Max 100
  feedback?: string;
  juror_name?: string;
  is_locked?: boolean;
  is_test?: boolean;
  test_run_id?: string;
  speaking_turn_id?: string;
  created_at?: string;
  updated_at: string;
}

export type EvaluationActionType = 'INITIAL_EVALUATION' | 'CONTRIBUTION_ONLY' | 'ADJUSTMENT';

export interface JuryEvaluationTurn {
  id: string;
  evaluation_id: string;
  speaking_turn_id: string;
  turn_number: number;
  action_type: EvaluationActionType;
  recorded_by?: string;
  recorded_by_name?: string;
  notes?: string;
  is_test?: boolean;
  test_run_id?: string;
  created_at: string;
}

export interface JuryEvaluationAdjustment {
  id: string;
  evaluation_id: string;
  speaking_turn_id?: string;
  juror_id?: string;
  juror_name: string;
  previous_research_constituency: number;
  new_research_constituency: number;
  previous_relevance_agenda: number;
  new_relevance_agenda: number;
  previous_communication_delivery: number;
  new_communication_delivery: number;
  previous_parliamentary_conduct: number;
  new_parliamentary_conduct: number;
  previous_originality_preparation: number;
  new_originality_preparation: number;
  previous_time_management: number;
  new_time_management: number;
  previous_total: number;
  new_total: number;
  delta_total: number;
  adjustment_reason: string;
  is_test?: boolean;
  test_run_id?: string;
  adjusted_at: string;
}

export interface JuryEvaluationDraft {
  research: number | null;
  relevance: number | null;
  comm: number | null;
  conduct: number | null;
  originality: number | null;
  time: number | null;
  feedback?: string;
  updatedAt: string;
}

export interface JuryEvaluation {
  id: string;
  event_id: string;
  session_id: string;
  session_name: string;
  learner_id: string;
  learner_name: string;
  constituency_number?: number;
  constituency_name?: string;
  party_name: string;
  bench: BenchType;
  jury_id: string;
  jury_name: string;
  research_constituency: number;
  relevance_agenda: number;
  communication_delivery: number;
  parliamentary_conduct: number;
  originality_preparation: number;
  time_management: number;
  total: number;
  feedback?: string;
  initial_speaking_turn_id?: string;
  status: 'ACTIVE' | 'LOCKED' | 'FLAGGED';
  is_test: boolean;
  test_run_id?: string;
  created_at: string;
  updated_at: string;
  turns?: JuryEvaluationTurn[];
  adjustments?: JuryEvaluationAdjustment[];
}

export interface SessionLeaderboardRow {
  rank: number;
  learnerId: string;
  studentName: string;
  constituencyNumber?: number;
  constituencyName?: string;
  partyName: string;
  bench: BenchType;
  sessionScore: number;
  jurorCount: number;
  expectedJurors: number;
  completionStatus: 'FULLY_SCORED' | 'PARTIALLY_SCORED' | 'NOT_SCORED';
  speakingTurnCount: number;
  avgResearch: number;
  avgRelevance: number;
  avgComm: number;
  avgConduct: number;
  avgOrig: number;
  avgTime: number;
  adjustmentsCount: number;
  latestScoreTimestamp: string;
}

export interface OverallLeaderboardRow {
  rank: number;
  learnerId: string;
  studentName: string;
  constituencyNumber?: number;
  constituencyName?: string;
  partyName: string;
  bench: BenchType;
  overallScore: number;
  sessionsEvaluatedCount: number;
  totalJurorEvaluationsCount: number;
  speakingTurnCount: number;
  sessionBreakdown: Record<string, {
    sessionId: string;
    sessionName: string;
    score: number;
    jurorCount: number;
    speakingTurnCount: number;
  }>;
}

export interface VoteAuditEntry {
  id: string;
  event_id: string;
  poll_id: string;
  poll_type: 'ELECTION' | 'FLASH_VOTE';
  voter_id: string;
  voter_name: string;
  candidate_id?: string;
  candidate_name?: string;
  decision?: 'AYE' | 'NO' | 'ABSTAIN';
  timestamp: string;
}

export interface AggregatedScore {
  learner_id: string;
  event_id: string;
  learner_name: string;
  party_name: string;
  bench: BenchType;
  juror_count: number;
  juror_names: string[];
  avg_research: number;
  avg_relevance: number;
  avg_comm: number;
  avg_conduct: number;
  avg_originality: number;
  avg_time: number;
  avg_total: number;
  latest_score?: ScoreRecord;
  updated_at: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  event_id?: string;
  action: 'JURY_CODE_COPIED' | 'JURY_LINK_COPIED' | 'ACCESS_CODE_LOGIN_SUCCESS' | 'ACCESS_CODE_LOGIN_FAILED' | 'LOCKOUT_TRIGGERED' | 'ALLOCATION_CONFIRMED' | 'QUESTION_SUBMITTED' | 'QUESTION_FINAL_APPROVED' | 'QUESTION_REJECTED' | 'QUESTION_STATUS_UPDATED' | 'QUESTION_REVIEWED_APPROACHED_ADMIN' | string;
  actor_role?: string;
  actor_name?: string;
  details?: string;
}

export interface ProjectorStudioSettings {
  displayScene: 'auto' | 'welcome' | 'agenda' | 'flash_vote' | 'election' | 'election_result' | 'bill_voting' | 'bill_result' | 'break' | 'question_hour';
  revealedElectionId?: string;
  activeElectionId?: string;
  revealedBillId?: string;
  activeBillId?: string;
  revealedFlashVoteId?: string;
  activeFlashVoteId?: string;
  activeQuestionId?: string | null;
  questionProjectorEnabled?: boolean;
  timer?: LiveTimerState;
  tickerMessage: string;
  isTickerActive: boolean;
  tickerStyle: 'marquee' | 'pulse' | 'static';
  showTricolorHeader: boolean;
  showClock: boolean;
  showSpeakerBadge: boolean;
  selectedAgendaId?: string;
  return_agenda_item_id?: string;
  return_agenda_event_id?: string;
  return_agenda_day_id?: string;
  customWelcomeTitle?: string;
}

export interface EventDeadline {
  id: string;
  event_id: string;
  event_slug: string;
  is_open?: boolean;
  status?: 'OPEN' | 'CLOSED';
  questions_open_at?: string;
  questions_deadline_at?: string;
  updated_at: string;
}

export interface EventAgendaProgress {
  active_agenda_id?: string;
  active_day?: 'Pre-Event' | 'Day 1' | 'Day 2' | string;
  completed_agenda_ids: string[];
  item_statuses: Record<string, AgendaStatus>;
  started_days: Record<string, boolean>;
  updated_at: string;
}

export interface ProceedingsQuestion {
  id: string;
  question_number?: string;
  event_id: string;
  event_slug: string;
  student_id?: string;
  learner_id?: string;
  access_code?: string;
  student_name: string;
  bench: 'Ruling' | 'Opposition';
  constituency?: string;
  constituency_name?: string;
  constituency_number?: string | number | null;
  target?: string;
  target_name?: string;
  ministry: string;
  target_ministry_id?: string;
  target_ministry_name?: string;
  question_text: string;
  question_type: 'Standard' | 'Starred' | 'Unstarred' | 'Zero Hour' | 'Calling Attention';
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Starred' | 'Rejected';
  queue_order?: number;
  calling_order?: number;
  called_status?: 'uncalled' | 'calling' | 'completed';
  called_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  approved_by?: string;
  approved_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  flagged_for_admin?: boolean;
  review_note?: string;
  reviewer_name?: string;
  reviewer_role?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejected_at?: string;
  seat_number?: string;
  last_edited_by?: string;
  last_edited_at?: string;
  edit_history?: QuestionEditAuditEntry[];
}

export interface QuestionEditAuditEntry {
  timestamp: string;
  admin_id?: string;
  admin_name: string;
  admin_role: string;
  field: string;
  old_value: string;
  new_value: string;
}

export interface QuestionSnapshot {
  event_id: string;
  event_slug?: string;
  college_name?: string;
  short_name?: string;
  snapshot_version: string;
  snapshot_timestamp: string;
  total_questions: number;
  counts: {
    submitted: number;
    under_review: number;
    approved: number;
    starred: number;
    rejected: number;
    deleted: number;
  };
  question_calling_order: string[];
  active_question_id: string | null;
  completed_question_ids?: string[];
  deleted_question_ids?: string[];
  questions: ProceedingsQuestion[];
}

export type CanonicalQuestionStatus = 'Submitted' | 'Under Review' | 'Approved' | 'Starred' | 'Rejected';

/**
 * Single Canonical Question Status Normalizer
 * Provides the single source of truth across Student, Administrator, Main Admin, and Minister dashboards.
 * 
 * Precedence:
 * 1. Approved / Starred -> Approved / Starred (Final decision by Main Admin)
 * 2. Rejected -> Rejected (Final decision by Main Admin)
 * 3. Under Review / Flagged for Admin -> Under Review (Reviewed and forwarded to Main Admin)
 * 4. Submitted / Pending -> Submitted (Initial student submission)
 */
export function getCanonicalQuestionStatus(q?: {
  status?: string;
  flagged_for_admin?: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
} | null): CanonicalQuestionStatus {
  if (!q) return 'Submitted';
  const s = (q.status || '').toLowerCase().trim();
  if (s === 'approved') return 'Approved';
  if (s === 'starred') return 'Starred';
  if (s === 'rejected') return 'Rejected';
  if (s === 'under review' || s === 'under_review' || Boolean(q.flagged_for_admin)) {
    return 'Under Review';
  }
  return 'Submitted';
}

export interface ProceedingsMotion {
  id: string;
  event_id: string;
  event_slug: string;
  title: string;
  proposed_by: string;
  bench: BenchType;
  committee_room: string;
  content: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Admitted' | 'Rejected';
  created_at: string;
}

export interface ParliamentQuestion {
  id: string;
  event_id: string;
  question_number: string;
  type: 'Starred' | 'Unstarred' | 'Zero Hour' | 'Calling Attention';
  ministry: string;
  submitter_name: string;
  submitter_party: string;
  question_text: string;
  status: 'Submitted' | 'Admitted' | 'Answered' | 'Disallowed';
  minister_response?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  event_id: string;
  category: 'Venue & Stage' | 'Audio-Visual' | 'Ballot & Voting' | 'Delegate Badges' | 'Protocol & Dossiers' | 'Emergency';
  task: string;
  is_completed: boolean;
  assigned_to?: string;
}

export interface ChatMessage {
  id: string;
  event_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  is_announcement: boolean;
  timestamp: string;
}

export interface FeedbackEntry {
  id: string;
  event_id: string;
  delegate_name: string;
  rating: number; // 1-5
  debate_quality: number; // 1-5
  logistics_rating: number; // 1-5
  comments: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  event_id: string;
  name: string;
  role: 'Organiser' | 'Coordinator' | string;
  email: string;
  phone?: string;
  department?: string;
  access_code?: string;
  created_at?: string;
  updated_at?: string;
}

// ── EVENT DAYS & ATTENDANCE TYPES ───────────────────────────────────

export type EventDayStatus = 'Upcoming' | 'Active' | 'Completed';

export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  name: string; // e.g., "Day 1", "Day 2", "Inauguration Day"
  date?: string;
  status: EventDayStatus;
  is_active?: boolean;
  activities: string[];
  is_archived?: boolean;
  order_index?: number;
  main_day?: 1 | 2 | null; // Mapped to Main Day 1, Main Day 2, or null (regular activity session)
  created_at?: string;
  updated_at?: string;
}

export type DayAttendanceStatus = 'Present' | 'Absent';
export type SessionType = 'FN' | 'AN';

export interface DayAttendanceRecord {
  id: string;
  event_id: string;
  day_id: string;
  student_id: string;
  learner_id?: string; // alias for student_id
  status: DayAttendanceStatus;
  fn_status?: DayAttendanceStatus; // Forenoon session attendance
  an_status?: DayAttendanceStatus; // Afternoon session attendance
  marked_by?: string;
  marked_by_role?: string;
  marked_at: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calculates effective FN, AN, and overall attendance status for a student day record.
 * Supports explicit in-memory fields, embedded session tags [FN:...|AN:...], and legacy overall status.
 */
export function getRecordSessionStatuses(record?: DayAttendanceRecord): {
  fn: DayAttendanceStatus;
  an: DayAttendanceStatus;
  overall: DayAttendanceStatus;
} {
  if (!record) {
    return { fn: 'Absent', an: 'Absent', overall: 'Absent' };
  }

  // 1. Direct in-memory / local properties if present
  if (record.fn_status && record.an_status) {
    const fn = record.fn_status;
    const an = record.an_status;
    const overall: DayAttendanceStatus = (fn === 'Present' || an === 'Present') ? 'Present' : 'Absent';
    return { fn, an, overall };
  }

  // 2. Check embedded tag in marked_by: [FN:Present|AN:Absent]
  if (record.marked_by && record.marked_by.includes('[FN:') && record.marked_by.includes('|AN:')) {
    const fnMatch = record.marked_by.match(/\[FN:(Present|Absent)\|AN:(Present|Absent)\]/);
    if (fnMatch) {
      const fn = fnMatch[1] as DayAttendanceStatus;
      const an = fnMatch[2] as DayAttendanceStatus;
      const overall: DayAttendanceStatus = (fn === 'Present' || an === 'Present') ? 'Present' : 'Absent';
      return { fn, an, overall };
    }
  }

  // 3. Fallback based on overall status
  const isOverallPresent = record.status === 'Present';
  const fn: DayAttendanceStatus = record.fn_status || (isOverallPresent ? 'Present' : 'Absent');
  const an: DayAttendanceStatus = record.an_status || (isOverallPresent ? 'Present' : 'Absent');
  const overall: DayAttendanceStatus = isOverallPresent ? 'Present' : 'Absent';
  return { fn, an, overall };
}

/**
 * Strips technical session tags like [FN:Present|AN:Absent] from volunteer marked_by names
 */
export function formatMarkedBy(markedBy?: string): string {
  if (!markedBy) return 'Volunteer';
  return markedBy.replace(/\s*\[FN:[^\]]+\]/g, '').trim() || 'Volunteer';
}

export const STANDARD_TN_ACTIVITIES: string[] = [
  'Student Orientation',
  'Party & Constituency Allocation + Group Formation',
  'Speaker & Party Leader Selection',
  'Government Formation + CM & LOP Election',
  'Cabinet Formation',
  'Mock Assembly'
];

export interface LoginRecord {
  id: string;
  event_id: string;
  user_id: string;
  learner_id?: string;
  volunteer_id?: string;
  user_name: string;
  role: 'student' | 'volunteer' | 'jury' | 'coordinator';
  access_code: string;
  login_at: string; // ISO string
  logged_in_at?: string; // ISO string
  device_type: 'mobile' | 'desktop' | 'Mobile' | 'Tablet' | 'Desktop' | 'Other' | string;
  device_info: string;
  ip_address?: string;
  details?: string;
}

export type SpeakingRequestStatus = 'WAITING' | 'CALLED' | 'SPOKEN' | 'CANCELLED';

export interface SpeakingRequest {
  id: string;
  event_id: string;
  session_id: string;
  session_name: string;
  learner_id: string;
  learner_name: string;
  constituency_number?: number;
  bench?: string;
  status: SpeakingRequestStatus;
  requested_at: string;
  called_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  is_test?: boolean;
  test_run_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type SpeakingTurnStatus = 'SPEAKING' | 'SPOKEN' | 'CANCELLED';

export type ScoringMode = 'test' | 'live';

export interface ScoringEnvironment {
  mode: ScoringMode;
  testRunId: string | null;
  updated_at?: string;
  updated_by?: string;
}

export interface SpeakingTurn {
  id: string;
  event_id: string;
  session_id: string;
  session_name: string;
  learner_id: string;
  learner_name: string;
  request_id?: string;
  sequence_number: number;
  called_at: string;
  started_at?: string;
  completed_at?: string;
  called_by?: string;
  status: SpeakingTurnStatus;
  is_test?: boolean;
  test_run_id?: string;
  created_at?: string;
}

export interface JurySpeechRecognition {
  id: string;
  event_id: string;
  session_id: string; // Canonical session ID
  speaking_turn_id: string;
  jury_id: string;
  learner_id: string;
  active: boolean;
  note?: string | null;
  revoked_at?: string | null;
  is_test?: boolean;
  test_run_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipantRecognitionSummary {
  learnerId: string;
  studentName: string;
  constituencyNumber?: number;
  constituencyName?: string;
  partyName: string;
  bench: BenchType | string;
  recognitionCount: number;
  speakingTurnCount: number;
  recognitionRate: number;
  distinctJurorCount: number;
  totalJurors: number;
  recognitionCoverage?: number; // e.g. 50 (%)
}

export interface SpeechImpactSummary {
  speakingTurnId: string;
  sequenceNumber: number;
  learnerId: string;
  studentName: string;
  constituencyNumber?: number;
  constituencyName?: string;
  partyName: string;
  bench: BenchType | string;
  sessionId: string;
  sessionName: string;
  calledAt: string;
  startedAt?: string;
  completedAt?: string;
  speakingDuration?: string; // e.g. "2:14" or "1:48"
  recognitionCount: number;
  distinctJurorCount: number;
  totalJurors: number;
  recognitionCoverage?: number;
  jurorRecognitions: Array<{
    juryId: string;
    juryName?: string;
    note?: string | null;
    createdAt: string;
  }>;
}

export interface RecognitionFilterOptions {
  environment?: 'live' | 'test' | 'all';
  testRunId?: string | null;
  isTest?: boolean;
}
