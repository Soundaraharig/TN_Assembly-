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
    participant_count: 3,
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
    name: 'Dr. APJ Abdul Kalam Youth Front',
    bench: 'Ruling',
    color: '#059669', // Emerald
    leader: 'Aathira N.S',
    manifesto: 'Higher Education Modernization & Green Energy Policy.'
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Periyar Progressive Alliance',
    bench: 'Opposition',
    color: '#dc2626', // Red
    leader: 'A. Sharini',
    manifesto: 'Social Welfare Equity & Healthcare Infrastructure.'
  }
];

export const INITIAL_COMMITTEES: Committee[] = [
  {
    id: '55555555-5555-4555-8555-555555555555',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Higher Education & Skill Development',
    topic: 'Curriculum Modernization & Industry Partnerships',
    chairperson: 'Prof. A. Ramanathan',
    max_capacity: 50
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    name: 'Public Health & Family Welfare',
    topic: 'Telemedicine Expansion & Rural Health Infrastructure',
    chairperson: 'Dr. Meenakshi S',
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
    is_current: false
  },
  {
    id: '88888888-8888-4888-8888-888888888888',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    day: 'Day 1',
    time: '09:30 AM - 11:00 AM',
    title: 'Question Hour & Starred Queries',
    description: 'Opposition MLAs query Cabinet Ministers on Education policy.',
    speaker_role: 'Leader of the Opposition',
    is_current: true
  }
];

export const INITIAL_JURY: JuryMember[] = [
  { id: '99999999-9999-4999-8999-999999999999', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Justice K. Chandru (Retd.)', designation: 'Chief Juror', assigned_bench: 'Ruling' },
  { id: '99999999-9999-4999-8999-999999999998', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Prof. R. Vijayakumar', designation: 'Parliamentary Debate Expert', assigned_bench: 'Opposition' }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Gokulnath R', email: 'gokul@jkkncet.ac.in', phone: '+91 9876543201', role: 'Stage & Mic Coordinator' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Kavitha M', email: 'kavitha@jkkncet.ac.in', phone: '+91 9876543202', role: 'Registration & Badges Desk' }
];

export const INITIAL_LEARNERS: Learner[] = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    access_code: '89F2A1',
    full_name: 'A. Sharini',
    email: 'sharini@college.edu',
    phone: '+91 98765 43201',
    department: 'Computer Science',
    academic_year: '3rd Year',
    constituency_number: 109,
    constituency_name: '109 - Erode East',
    district: 'Erode',
    party_name: 'Periyar Progressive Alliance',
    party_id: '44444444-4444-4444-8444-444444444444',
    bench: 'Opposition',
    role: 'Leader of the Opposition',
    committee_name: 'Higher Education & Skill Development',
    committee_id: '55555555-5555-4555-8555-555555555555',
    day1_checked_in: true,
    day2_checked_in: false,
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    access_code: '4A1C9D',
    full_name: 'Aaric Oliver J',
    email: 'aaric@college.edu',
    phone: '+91 98765 43202',
    department: 'Electronics & Communication',
    academic_year: '4th Year',
    constituency_number: 11,
    constituency_name: '11 - Dr. Radhakrishnan Nagar',
    district: 'Chennai',
    party_name: 'Periyar Progressive Alliance',
    party_id: '44444444-4444-4444-8444-444444444444',
    bench: 'Opposition',
    role: 'Speaker of the Assembly',
    committee_name: 'Higher Education & Skill Development',
    committee_id: '55555555-5555-4555-8555-555555555555',
    day1_checked_in: true,
    day2_checked_in: true,
    created_at: '2026-09-01T10:05:00Z'
  },
  {
    id: 'b3333333-3333-4333-8333-333333333333',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    access_code: '3M8W4L',
    full_name: 'Aathira N.S',
    email: 'aathira@college.edu',
    phone: '+91 98765 43204',
    department: 'Biotechnology',
    academic_year: '4th Year',
    constituency_number: 137,
    constituency_name: '137 - Coimbatore South',
    district: 'Coimbatore',
    party_name: 'Dr. APJ Abdul Kalam Youth Front',
    party_id: '33333333-3333-4333-8333-333333333333',
    bench: 'Ruling',
    role: 'Chief Minister',
    committee_name: 'Higher Education & Skill Development',
    committee_id: '55555555-5555-4555-8555-555555555555',
    day1_checked_in: true,
    day2_checked_in: true,
    created_at: '2026-09-01T10:15:00Z'
  }
];

export const INITIAL_NOMINATIONS: Nomination[] = [
  {
    id: 'nom-001',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    position: 'Ruling Party Leader',
    candidate_learner_id: 'b3333333-3333-4333-8333-333333333333',
    candidate_name: 'Aathira N.S',
    party_name: 'Dr. APJ Abdul Kalam Youth Front',
    bench: 'Ruling',
    manifesto: 'Accelerate tech education subsidies and green campus initiatives across all state colleges.',
    status: 'Approved',
    votes_received: 24,
    created_at: '2026-09-01T12:00:00Z'
  },
  {
    id: 'nom-002',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    position: 'Opposition Party Leader',
    candidate_learner_id: 'b1111111-1111-4111-8111-111111111111',
    candidate_name: 'A. Sharini',
    party_name: 'Periyar Progressive Alliance',
    bench: 'Opposition',
    manifesto: 'Ensure transparency in scholarship disbursement and healthcare outreach for rural youth.',
    status: 'Approved',
    votes_received: 19,
    created_at: '2026-09-01T12:30:00Z'
  },
  {
    id: 'nom-003',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    position: 'Speaker',
    candidate_learner_id: 'b2222222-2222-4222-8222-222222222222',
    candidate_name: 'Aaric Oliver J',
    party_name: 'Periyar Progressive Alliance',
    bench: 'Opposition',
    manifesto: 'Impartial parliamentary conduct, strict decorum adherence, and equal time allocation for all benches.',
    status: 'Approved',
    votes_received: 35,
    created_at: '2026-09-01T13:00:00Z'
  }
];

export const INITIAL_ELECTIONS: Election[] = [
  {
    id: 'elec-001',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    title: 'Assembly Speaker Election',
    position: 'Speaker of the Legislative Assembly',
    type: 'SPEAKER',
    status: 'Live',
    candidates: [
      { id: 'c1', learner_id: 'b2222222-2222-4222-8222-222222222222', name: 'Aaric Oliver J', party: 'Periyar Progressive Alliance', bench: 'Opposition', votes: 18 },
      { id: 'c2', learner_id: 'b3333333-3333-4333-8333-333333333333', name: 'Aathira N.S', party: 'Dr. APJ Abdul Kalam Youth Front', bench: 'Ruling', votes: 15 }
    ],
    total_votes: 33,
    winner: 'Aaric Oliver J',
    voted_delegate_ids: [],
    created_at: '2026-09-02T09:00:00Z'
  },
  {
    id: 'elec-002',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    title: 'Ruling Party Leader & Chief Minister Election',
    position: 'Ruling Bench Leader',
    type: 'LEADERSHIP',
    status: 'Closed',
    candidates: [
      { id: 'c3', learner_id: 'b3333333-3333-4333-8333-333333333333', name: 'Aathira N.S', party: 'Dr. APJ Abdul Kalam Youth Front', bench: 'Ruling', votes: 28 }
    ],
    total_votes: 28,
    winner: 'Aathira N.S',
    voted_delegate_ids: [],
    created_at: '2026-09-01T15:00:00Z'
  },
  {
    id: 'elec-003',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    title: 'Opposition Party Leader Election',
    position: 'Leader of Opposition',
    type: 'LEADERSHIP',
    status: 'Closed',
    candidates: [
      { id: 'c4', learner_id: 'b1111111-1111-4111-8111-111111111111', name: 'A. Sharini', party: 'Periyar Progressive Alliance', bench: 'Opposition', votes: 22 }
    ],
    total_votes: 22,
    winner: 'A. Sharini',
    voted_delegate_ids: [],
    created_at: '2026-09-01T15:30:00Z'
  }
];

export const INITIAL_FLASH_VOTES: LiveFlashVote[] = [
  {
    id: 'flash-001',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    question: 'Should the Youth Assembly pass Clause 4 of the Digital University Bill 2026 immediately?',
    motion_type: 'Division',
    target_audience: 'ALL',
    status: 'ACTIVE',
    created_at: '2026-09-02T10:00:00Z',
    ayes_count: 2,
    noes_count: 1,
    abstain_count: 0,
    voter_ids: ['b1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333'],
    votes: [
      { learner_id: 'b3333333-3333-4333-8333-333333333333', learner_name: 'Aathira N.S', role: 'Chief Minister', bench: 'Ruling', vote: 'AYE', timestamp: '10:01 AM' },
      { learner_id: 'b2222222-2222-4222-8222-222222222222', learner_name: 'Aaric Oliver J', role: 'Speaker', bench: 'Opposition', vote: 'AYE', timestamp: '10:02 AM' },
      { learner_id: 'b1111111-1111-4111-8111-111111111111', learner_name: 'A. Sharini', role: 'Leader of Opposition', bench: 'Opposition', vote: 'NO', timestamp: '10:03 AM' }
    ]
  }
];

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: 'chk-1', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Venue & Stage', task: 'Assembly Dais, Speaker Chair & Bench Banners positioned', is_completed: true, assigned_to: 'Gokulnath R' },
  { id: 'chk-2', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Audio-Visual', task: 'Microphone sound check for Speaker, Ruling & Opposition pods', is_completed: true, assigned_to: 'Gokulnath R' },
  { id: 'chk-3', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Delegate Badges', task: 'Print & laminate 234 Constituency badges with access codes', is_completed: true, assigned_to: 'Kavitha M' },
  { id: 'chk-4', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Ballot & Voting', task: 'Test digital voting handsets & verify instant polling dashboard', is_completed: true, assigned_to: 'Hari' },
  { id: 'chk-5', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Protocol & Dossiers', task: 'Distribute Hansard agenda & bill draft copies to all delegates', is_completed: false, assigned_to: 'Yuva' },
  { id: 'chk-6', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', category: 'Emergency', task: 'Station first-aid medical team and emergency floor marshals', is_completed: true, assigned_to: 'College Admin' }
];

export const INITIAL_QUESTIONS: ParliamentQuestion[] = [
  {
    id: 'q-101',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    question_number: 'STAR-101',
    type: 'Starred',
    ministry: 'Higher Education & Skill Development',
    submitter_name: 'A. Sharini (Opposition Leader)',
    submitter_party: 'Periyar Progressive Alliance',
    question_text: 'Will the Hon. Minister state the timeline for upgrading all rural government college AI & Robotics labs across western Tamil Nadu districts?',
    status: 'Admitted',
    minister_response: 'Government has allocated ₹120 Crore in phase 1, with commissioning scheduled for completion by December 2026.',
    created_at: '2026-09-02T09:15:00Z'
  },
  {
    id: 'q-102',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    question_number: 'ZH-042',
    type: 'Zero Hour',
    ministry: 'Public Health & Family Welfare',
    submitter_name: 'Aaric Oliver J (MLA - Dr. Radhakrishnan Nagar)',
    submitter_party: 'Periyar Progressive Alliance',
    question_text: 'Urgent attention drawn to 24x7 mental health counseling centers in tier-2 university campuses.',
    status: 'Submitted',
    created_at: '2026-09-02T09:40:00Z'
  }
];

export const INITIAL_PROCEEDINGS: BillProceeding[] = [
  {
    id: 'bill-201',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    bill_number: 'TN-BILL-04/2026',
    title: 'Tamil Nadu Youth Innovation & Technology Commercialization Bill',
    introduced_by: 'Aathira N.S (Chief Minister)',
    bench: 'Ruling',
    summary: 'A legislative framework to establish college-level incubation hubs with 0% interest seed venture capital for student enterprises.',
    status: 'Debating',
    ayes: 26,
    noes: 14,
    created_at: '2026-09-02T09:30:00Z'
  }
];

export const INITIAL_SCORES: ScoreRecord[] = [
  {
    id: 'score-1',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    learner_id: 'b3333333-3333-4333-8333-333333333333',
    learner_name: 'Aathira N.S',
    party_name: 'Dr. APJ Abdul Kalam Youth Front',
    bench: 'Ruling',
    oratory: 23,
    policy_knowledge: 24,
    parliamentary_conduct: 25,
    rebuttal_debate: 22,
    total: 94,
    feedback: 'Outstanding poise during question hour and articulated government policy with mastery.',
    juror_name: 'Justice K. Chandru (Retd.)',
    updated_at: '2026-09-02T10:00:00Z'
  },
  {
    id: 'score-2',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    learner_id: 'b1111111-1111-4111-8111-111111111111',
    learner_name: 'A. Sharini',
    party_name: 'Periyar Progressive Alliance',
    bench: 'Opposition',
    oratory: 24,
    policy_knowledge: 23,
    parliamentary_conduct: 23,
    rebuttal_debate: 23,
    total: 93,
    feedback: 'Fierce cross-examination of cabinet ministers, well backed by empirical district statistics.',
    juror_name: 'Prof. R. Vijayakumar',
    updated_at: '2026-09-02T10:05:00Z'
  },
  {
    id: 'score-3',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    learner_id: 'b2222222-2222-4222-8222-222222222222',
    learner_name: 'Aaric Oliver J',
    party_name: 'Periyar Progressive Alliance',
    bench: 'Opposition',
    oratory: 22,
    policy_knowledge: 22,
    parliamentary_conduct: 25,
    rebuttal_debate: 21,
    total: 90,
    feedback: 'Exemplary order maintenance in the House, impartial ruling on points of order.',
    juror_name: 'Justice K. Chandru (Retd.)',
    updated_at: '2026-09-02T10:10:00Z'
  }
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'chat-1',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    sender_name: 'Hari (Coordinator)',
    sender_role: 'Coordinator',
    message: 'Welcome all delegates and faculty advisors! House session Day 1 is now officially live.',
    is_announcement: true,
    timestamp: '09:00 AM'
  },
  {
    id: 'chat-2',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    sender_name: 'Speaker Desk',
    sender_role: 'Presiding Officer',
    message: 'Question hour will proceed with Starred queries 101 through 105. All members requested to maintain decorum.',
    is_announcement: false,
    timestamp: '09:30 AM'
  }
];

export const INITIAL_FEEDBACK: FeedbackEntry[] = [
  {
    id: 'fb-1',
    event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001',
    delegate_name: 'Aathira N.S',
    rating: 5,
    debate_quality: 5,
    logistics_rating: 5,
    comments: 'Electrifying simulation. The real TN constituency numbers and live voting made it feel like the actual Fort St. George assembly floor!',
    created_at: '2026-09-02T10:00:00Z'
  }
];

export const INITIAL_TEAM: TeamMember[] = [
  { id: 'tm-1', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Dr. V. Saravanan', role: 'Faculty Advisor & Chief Patron', email: 'principal@jkkncet.ac.in', phone: '+91 94432 12345', department: 'Principal Office' },
  { id: 'tm-2', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Hari & Yuva', role: 'Lead Event Coordinators', email: 'hari@hari.com', phone: '+91 98765 00001', department: 'Youth Assembly Secretariat' },
  { id: 'tm-3', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'S. Karthi', role: 'Technical Lead & Voting Marshal', email: 'karthi@jkkncet.ac.in', phone: '+91 98765 00002', department: 'IT & Sound Operations' }
];
