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

export const INITIAL_EVENTS: CollegeEvent[] = [
  {
    id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    college_name: 'JKKNCET Youth Assembly 2026',
    chapter: 'Namakkal',
    level: 'College Round',
    location: 'JKKNCET Campus, Komarapalayam, Tamil Nadu',
    dates: '10 Sep 2026 – 11 Sep 2026',
    event_stage: 'College Round',
    status: 'Day 1 Live',
    participant_count: 0,
    assigned_coordinator_email: 'hari@hari.com',
    assigned_coordinator_name: 'Hari & Yuva',
    elections_count: 3,
    is_locked: false,
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300002',
    college_name: 'Erode Engineering College Assembly',
    chapter: 'Erode',
    level: 'College Round',
    location: 'Erode Collectorate, Erode, Tamil Nadu',
    dates: '15 Sep 2026 – 16 Sep 2026',
    event_stage: 'College Round',
    status: 'Pre-Event',
    participant_count: 0,
    assigned_coordinator_email: 'coordinator@erode.edu',
    assigned_coordinator_name: 'Dr. S. Sundaram',
    elections_count: 1,
    is_locked: false,
    created_at: '2026-09-01T11:00:00Z'
  }
];

export const INITIAL_COORDINATORS: Coordinator[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Hari & Yuva',
    email: 'hari@hari.com',
    password_hash: 'hari1234',
    raw_temp_password: 'hari1234'
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300002',
    name: 'Dr. S. Sundaram',
    email: 'coordinator@erode.edu',
    password_hash: 'erode2026',
    raw_temp_password: 'erode2026'
  }
];

export const INITIAL_PARTIES: Party[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Party 1',
    bench: 'Ruling',
    color: '#059669', // Emerald
    leader: '',
    manifesto: 'Higher Education Modernization & Green Energy Policy.'
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Party 2',
    bench: 'Opposition',
    color: '#dc2626', // Red
    leader: '',
    manifesto: 'Social Welfare Equity & Healthcare Infrastructure.'
  }
];

export const INITIAL_COMMITTEES: Committee[] = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Committee 1 - Higher Education & Skill Development',
    topic: 'Curriculum Modernization & Industry Partnerships',
    chairperson: '',
    max_capacity: 50
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Committee 2 - Public Health & Family Welfare',
    topic: 'Telemedicine Expansion & Rural Health Infrastructure',
    chairperson: '',
    max_capacity: 50
  }
];

export const INITIAL_AGENDA: AgendaItem[] = [
  {
    id: '77777777-7777-4777-8777-777777777777',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    day: 'Day 1',
    time: '09:00 AM - 09:30 AM',
    title: 'Tamil Thai Vaazhthu & Speaker Opening Address',
    description: 'Inaugural assembly session, oath taking of delegates.',
    speaker_role: 'Speaker of the Assembly',
    is_current: true
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    day: 'Day 1',
    time: '09:30 AM - 11:00 AM',
    title: 'Question Hour & Starred Queries',
    description: 'Opposition MLAs query Cabinet Ministers on Education policy.',
    speaker_role: 'Leader of the Opposition',
    is_current: false
  }
];

export const INITIAL_JURY: JuryMember[] = [];
export const INITIAL_VOLUNTEERS: Volunteer[] = [];
export const INITIAL_LEARNERS: Learner[] = [];
export const INITIAL_NOMINATIONS: Nomination[] = [];
export const INITIAL_ELECTIONS: Election[] = [];
export const INITIAL_FLASH_VOTES: LiveFlashVote[] = [];

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'chk-1', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Venue & Stage', task: 'Assembly Dais, Speaker Chair & Bench Banners positioned', is_completed: true, assigned_to: 'Stage Team' },
  { id: 'chk-2', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Audio-Visual', task: 'Microphone sound check for Speaker, Ruling & Opposition pods', is_completed: true, assigned_to: 'Sound Lead' },
  { id: 'chk-3', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Delegate Badges', task: 'Print & laminate 234 Constituency badges with access codes', is_completed: true, assigned_to: 'Registration Desk' },
  { id: 'chk-4', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Ballot & Voting', task: 'Test digital voting handsets & verify instant polling dashboard', is_completed: false, assigned_to: 'Tech Lead' },
  { id: 'chk-5', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Protocol & Dossiers', task: 'Distribute Hansard agenda & bill draft copies to all delegates', is_completed: false, assigned_to: 'Floor Team' },
  { id: 'chk-6', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Emergency', task: 'Station first-aid medical team and emergency floor marshals', is_completed: true, assigned_to: 'Medical Desk' }
];

export const INITIAL_QUESTIONS: ParliamentQuestion[] = [];
export const INITIAL_PROCEEDINGS: BillProceeding[] = [];
export const INITIAL_SCORES: ScoreRecord[] = [];
export const INITIAL_CHAT: ChatMessage[] = [];
export const INITIAL_FEEDBACK: FeedbackEntry[] = [];

export const INITIAL_TEAM: TeamMember[] = [
  { id: 'tm-1', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Dr. V. Saravanan', role: 'Faculty Advisor & Chief Patron', email: 'principal@jkkncet.ac.in', phone: '+91 94432 12345', department: 'Principal Office' },
  { id: 'tm-2', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Hari & Yuva', role: 'Lead Event Coordinators', email: 'hari@hari.com', phone: '+91 98765 00001', department: 'Youth Assembly Secretariat' }
];
