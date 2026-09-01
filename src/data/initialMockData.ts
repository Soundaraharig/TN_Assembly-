import type { CollegeEvent, Coordinator, Learner, Party, Committee, AgendaItem, JuryMember, Volunteer } from '../types';

export const INITIAL_EVENTS: CollegeEvent[] = [
  {
    id: 'evt_jkkncet',
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
    elections_count: 2,
    is_locked: false,
    chief_guests: [
      { id: 'cg_1', name: 'Dr. V. Rajeshwari IAS', designation: 'District Collector', organization: 'Namakkal District Admin' }
    ],
    social_coverage: { post_links: '', total_reach: '5000' },
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'evt_erode_eng',
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
    chief_guests: [],
    social_coverage: { post_links: '', total_reach: '' },
    created_at: '2026-09-01T11:00:00Z'
  }
];

export const INITIAL_COORDINATORS: Coordinator[] = [
  {
    id: 'coord_hari',
    event_id: 'evt_jkkncet',
    name: 'Hari & Yuva',
    email: 'hari@hari.com',
    password_hash: 'hari1234',
    raw_temp_password: 'hari1234'
  },
  {
    id: 'coord_erode',
    event_id: 'evt_erode_eng',
    name: 'Dr. S. Sundaram',
    email: 'coordinator@erode.edu',
    password_hash: 'erode2026',
    raw_temp_password: 'erode2026'
  }
];

export const INITIAL_PARTIES: Party[] = [
  {
    id: 'party_a',
    event_id: 'evt_jkkncet',
    name: 'Dr. APJ Abdul Kalam Youth Front',
    bench: 'Ruling',
    color: '#059669', // Emerald
    leader: 'Aathira N.S',
    manifesto: 'Higher Education Modernization & Green Energy Policy.'
  },
  {
    id: 'party_b',
    event_id: 'evt_jkkncet',
    name: 'Periyar Progressive Alliance',
    bench: 'Opposition',
    color: '#dc2626', // Red
    leader: 'A. Sharini',
    manifesto: 'Social Welfare Equity & Healthcare Infrastructure.'
  }
];

export const INITIAL_COMMITTEES: Committee[] = [
  {
    id: 'comm_1',
    event_id: 'evt_jkkncet',
    name: 'Higher Education & Skill Development',
    topic: 'Curriculum Modernization & Industry Partnerships',
    chairperson: 'Prof. A. Ramanathan',
    max_capacity: 50
  },
  {
    id: 'comm_2',
    event_id: 'evt_jkkncet',
    name: 'Public Health & Family Welfare',
    topic: 'Telemedicine Expansion & Rural Health Infrastructure',
    chairperson: 'Dr. Meenakshi S',
    max_capacity: 50
  }
];

export const INITIAL_AGENDA: AgendaItem[] = [
  {
    id: 'ag_1',
    event_id: 'evt_jkkncet',
    day: 'Day 1',
    time: '09:00 AM - 09:30 AM',
    title: 'Tamil Thai Vaazhthu & Speaker Opening Address',
    description: 'Inaugural assembly session, oath taking of delegates.',
    speaker_role: 'Speaker of the Assembly',
    is_current: false
  },
  {
    id: 'ag_2',
    event_id: 'evt_jkkncet',
    day: 'Day 1',
    time: '09:30 AM - 11:00 AM',
    title: 'Question Hour',
    description: 'Opposition MLAs query Cabinet Ministers on Education policy.',
    speaker_role: 'Leader of the Opposition',
    is_current: true
  }
];

export const INITIAL_JURY: JuryMember[] = [
  { id: 'j_1', event_id: 'evt_jkkncet', name: 'Justice K. Chandru (Retd.)', designation: 'Chief Juror', assigned_bench: 'Ruling' }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  { id: 'v_1', event_id: 'evt_jkkncet', name: 'Gokulnath R', email: 'gokul@jkkncet.ac.in', phone: '+91 9876543201', role: 'Stage Manager' }
];

export const INITIAL_LEARNERS: Learner[] = [
  {
    id: 'l_132',
    event_id: 'evt_jkkncet',
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
    party_id: 'party_b',
    bench: 'Opposition',
    role: 'Member of Legislative Assembly (MLA)',
    committee_name: 'Higher Education & Skill Development',
    committee_id: 'comm_1',
    day1_checked_in: true,
    day2_checked_in: false,
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'l_73',
    event_id: 'evt_jkkncet',
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
    party_id: 'party_b',
    bench: 'Opposition',
    role: 'Member of Legislative Assembly (MLA)',
    committee_name: 'Higher Education & Skill Development',
    committee_id: 'comm_1',
    day1_checked_in: true,
    day2_checked_in: true,
    created_at: '2026-09-01T10:05:00Z'
  },
  {
    id: 'l_1',
    event_id: 'evt_jkkncet',
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
    party_id: 'party_a',
    bench: 'Ruling',
    role: 'Chief Minister',
    committee_name: 'Higher Education & Skill Development',
    committee_id: 'comm_1',
    day1_checked_in: true,
    day2_checked_in: true,
    created_at: '2026-09-01T10:15:00Z'
  }
];
