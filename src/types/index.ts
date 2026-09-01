export type BenchType = 'Ruling' | 'Opposition' | 'Independent';

export type EventStage = 'College Round' | 'District Round' | 'State Quarter Finals' | 'State Semi Finals' | 'Final Round';

export type EventStatus = 'Draft' | 'Pre-Event' | 'Day 1 Live' | 'Day 2 Live' | 'Completed';

export type AcademicYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type UserRole = 'super_admin' | 'coordinator' | 'student';

export interface UserSession {
  role: UserRole;
  email?: string;
  name?: string;
  assigned_event_ids?: string[]; // For coordinator
  student?: Learner;            // For student delegate
}

export interface ChiefGuest {
  id: string;
  name: string;
  designation: string;
  organization: string;
}

export interface SocialCoverage {
  post_links: string;
  total_reach: string;
}

export interface CollegeEvent {
  id: string;
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
  chief_guests?: ChiefGuest[];
  social_coverage?: SocialCoverage;
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
  academic_year: AcademicYear;
  constituency_number?: number;
  constituency_name?: string;
  district?: string;
  party_name?: string;
  party_id?: string;
  bench?: BenchType;
  role?: string;
  committee_name?: string;
  committee_id?: string;
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
  name: string;
  designation: string;
  assigned_bench: BenchType;
}

export interface Volunteer {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}
