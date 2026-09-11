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
  password_hash: string;
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

export interface ElectionCandidate {
  id: string;
  learner_id?: string;
  name: string;
  party: string;
  bench: BenchType;
  votes: number;
}

export interface Election {
  id: string;
  event_id: string;
  title: string;
  position: string;
  type: 'LEADERSHIP' | 'SPEAKER' | 'DEPUTY_SPEAKER' | 'COMMITTEE';
  status: 'Upcoming' | 'Live' | 'Closed';
  candidates: ElectionCandidate[];
  total_votes: number;
  winner?: string;
  voted_delegate_ids?: string[];
  party_id?: string;
  completed_at?: string;
  created_at: string;
}

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
}

export interface BillProceeding {
  id: string;
  event_id: string;
  bill_number: string;
  title: string;
  introduced_by: string;
  bench: BenchType;
  summary: string;
  status: 'Introduced' | 'Debating' | 'Voting' | 'Passed' | 'Rejected';
  ayes: number;
  noes: number;
  created_at: string;
}

export interface ScoreRecord {
  id: string;
  event_id: string;
  learner_id: string;
  learner_name: string;
  party_name: string;
  bench: BenchType;
  jury_id?: string;
  research_constituency?: number;       // Max 30
  relevance_agenda?: number;            // Max 20
  communication_delivery?: number;      // Max 20
  parliamentary_conduct: number;        // Max 12
  originality_preparation?: number;     // Max 12
  time_management?: number;             // Max 6
  oratory: number;                       // Max 25
  policy_knowledge: number;              // Max 25
  rebuttal_debate: number;               // Max 25
  total: number;                         // Max 100
  feedback?: string;
  juror_name?: string;
  is_locked?: boolean;
  updated_at: string;
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
  action: 'JURY_CODE_COPIED' | 'JURY_LINK_COPIED' | 'ACCESS_CODE_LOGIN_SUCCESS' | 'ACCESS_CODE_LOGIN_FAILED' | 'LOCKOUT_TRIGGERED';
  actor_role?: string;
  actor_name?: string;
  details?: string;
}

export interface ProjectorStudioSettings {
  displayScene: 'auto' | 'welcome' | 'agenda' | 'flash_vote' | 'election' | 'election_result' | 'break';
  revealedElectionId?: string;
  tickerMessage: string;
  isTickerActive: boolean;
  tickerStyle: 'marquee' | 'pulse' | 'static';
  showTricolorHeader: boolean;
  showClock: boolean;
  showSpeakerBadge: boolean;
  selectedAgendaId?: string;
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

export interface ProceedingsQuestion {
  id: string;
  event_id: string;
  event_slug: string;
  student_id?: string;
  student_name: string;
  bench: 'Ruling' | 'Opposition';
  constituency?: string;
  ministry: string;
  question_text: string;
  question_type: 'Standard' | 'Starred' | 'Unstarred' | 'Zero Hour' | 'Calling Attention';
  status: 'Submitted' | 'Approved' | 'Starred' | 'Rejected';
  queue_order?: number;
  created_at: string;
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
 * If legacy records have status === 'Present' with fn/an unset, treats them as Present.
 */
export function getRecordSessionStatuses(record?: DayAttendanceRecord): {
  fn: DayAttendanceStatus;
  an: DayAttendanceStatus;
  overall: DayAttendanceStatus;
} {
  if (!record) {
    return { fn: 'Absent', an: 'Absent', overall: 'Absent' };
  }
  const isOverallPresent = record.status === 'Present';
  const fn: DayAttendanceStatus = record.fn_status || (isOverallPresent ? 'Present' : 'Absent');
  const an: DayAttendanceStatus = record.an_status || (isOverallPresent ? 'Present' : 'Absent');
  const overall: DayAttendanceStatus = (fn === 'Present' || an === 'Present' || isOverallPresent) ? 'Present' : 'Absent';
  return { fn, an, overall };
}

export const STANDARD_TN_ACTIVITIES: string[] = [
  'Student Orientation',
  'Party & Constituency Allocation + Group Formation',
  'Speaker & Party Leader Selection',
  'Government Formation + CM & LOP Election',
  'Cabinet Formation',
  'Mock Assembly'
];

