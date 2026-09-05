export type BenchType = 'Ruling' | 'Opposition' | 'Independent';

export type EventStage = 'College Round' | 'District Round' | 'State Quarter Finals' | 'State Semi Finals' | 'Final Round';

export type EventStatus = 'Draft' | 'Pre-Event' | 'Day 1 Live' | 'Day 2 Live' | 'Completed';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type UserRole = 'super_admin' | 'coordinator' | 'student' | 'jury' | 'volunteer';

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

export interface AgendaItem {
  id: string;
  event_id: string;
  day: 'Day 1' | 'Day 2';
  time: string;
  title: string;
  description: string;
  speaker_role?: string;
  is_current: boolean;
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

export interface Nomination {
  id: string;
  event_id: string;
  position: NominationPosition;
  candidate_learner_id: string;
  candidate_name: string;
  party_name: string;
  bench: BenchType;
  manifesto: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  votes_received?: number;
  created_at: string;
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

export interface EventDeadline {
  id: string;
  event_id: string;
  event_slug: string;
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
  role: string;
  email: string;
  phone: string;
  department?: string;
}
