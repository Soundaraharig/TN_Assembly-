import type {
  CollegeEvent,
  Coordinator,
  Learner,
  Party,
  Committee,
  AgendaItem,
  JuryMember,
  Volunteer,
  Nomination,
  Election,
  LiveFlashVote,
  BillProceeding,
  ScoreRecord,
  ParliamentQuestion,
  ChecklistItem,
  ChatMessage,
  FeedbackEntry,
  TeamMember
} from '../types';

export const INITIAL_EVENTS: CollegeEvent[] = [];
export const INITIAL_COORDINATORS: Coordinator[] = [];
export const INITIAL_PARTIES: Party[] = [];
export const INITIAL_COMMITTEES: Committee[] = [];
export const INITIAL_AGENDA: AgendaItem[] = [];
export const INITIAL_JURY: JuryMember[] = [];
export const INITIAL_VOLUNTEERS: Volunteer[] = [];
export const INITIAL_LEARNERS: Learner[] = [];
export const INITIAL_NOMINATIONS: Nomination[] = [];
export const INITIAL_ELECTIONS: Election[] = [];
export const INITIAL_FLASH_VOTES: LiveFlashVote[] = [];
export const INITIAL_CHECKLIST: ChecklistItem[] = [];
export const INITIAL_QUESTIONS: ParliamentQuestion[] = [];
export const INITIAL_PROCEEDINGS: BillProceeding[] = [];
export const INITIAL_SCORES: ScoreRecord[] = [];
export const INITIAL_CHAT: ChatMessage[] = [];
export const INITIAL_FEEDBACK: FeedbackEntry[] = [];
export const INITIAL_TEAM: TeamMember[] = [];
