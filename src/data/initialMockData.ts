import type { CollegeEvent, Coordinator, Learner, Party, Committee, AgendaItem, JuryMember, Volunteer } from '../types';

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
    elections_count: 2,
    is_locked: false,
    chief_guests: [
      { id: 'cg_1', name: 'Dr. V. Rajeshwari IAS', designation: 'District Collector', organization: 'Namakkal District Admin' }
    ],
    social_coverage: { post_links: '', total_reach: '5000' },
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
    chief_guests: [],
    social_coverage: { post_links: '', total_reach: '' },
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
    title: 'Question Hour',
    description: 'Opposition MLAs query Cabinet Ministers on Education policy.',
    speaker_role: 'Leader of the Opposition',
    is_current: true
  }
];

export const INITIAL_JURY: JuryMember[] = [
  { id: '99999999-9999-4999-8999-999999999999', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Justice K. Chandru (Retd.)', designation: 'Chief Juror', assigned_bench: 'Ruling' }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', event_id: '9b1deb4d-3b7d-4bad-9bd2-2ca771300001', name: 'Gokulnath R', email: 'gokul@jkkncet.ac.in', phone: '+91 9876543201', role: 'Stage Manager' }
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
    role: 'Member of Legislative Assembly (MLA)',
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
    role: 'Member of Legislative Assembly (MLA)',
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
