import type { Learner, Party, Committee, AcademicYear } from '../types';
import { TN_CONSTITUENCIES } from '../data/tnConstituencies';

export interface AllocationResult {
  updatedLearners: Learner[];
  stats: {
    totalAllocated: number;
    constituenciesUsed: number;
    partyDistribution: Record<string, number>;
    benchDistribution: { ruling: number; opposition: number; independent: number };
    committeeDistribution: Record<string, number>;
    academicYearMix: Record<AcademicYear, Record<string, number>>;
  };
}

const CABINET_PORTFOLIOS = [
  "Minister for Finance & Human Resources",
  "Minister for Public Health & Family Welfare",
  "Minister for Higher Education & Skill Development",
  "Minister for Agriculture & Farmers Welfare",
  "Minister for Home Affairs & Law",
  "Minister for Industries & Commerce",
  "Minister for Environment & Climate Change",
  "Minister for Information Technology & Digital Services",
  "Minister for Public Works & Water Resources",
  "Minister for Rural Development & Local Administration"
];

const SHADOW_PORTFOLIOS = [
  "Shadow Minister for Finance",
  "Shadow Minister for Health & Medical Care",
  "Shadow Minister for Education",
  "Shadow Minister for Agriculture",
  "Shadow Minister for Home Affairs",
  "Shadow Minister for Industries",
  "Shadow Minister for Environment",
  "Shadow Minister for Rural Development"
];

// Helper to shuffle an array in place
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function runAutoAllocation(
  learners: Learner[],
  parties: Party[],
  committees: Committee[],
  rulingRatio: number = 0.55
): AllocationResult {
  if (learners.length === 0) {
    return {
      updatedLearners: learners,
      stats: {
        totalAllocated: 0,
        constituenciesUsed: 0,
        partyDistribution: {},
        benchDistribution: { ruling: 0, opposition: 0, independent: 0 },
        committeeDistribution: {},
        academicYearMix: { '1st Year': {}, '2nd Year': {}, '3rd Year': {}, '4th Year': {} }
      }
    };
  }

  // 1. Prepare Active Parties (ensure fallback if no parties configured)
  const eventId = learners[0]?.event_id || '';
  let activeParties = [...parties];
  if (activeParties.length === 0) {
    activeParties = [
      { id: 'pty_default_ruling', event_id: eventId, name: 'Party 1', bench: 'Ruling', color: '#059669' },
      { id: 'pty_default_opp', event_id: eventId, name: 'Party 2', bench: 'Opposition', color: '#dc2626' }
    ];
  }

  let rulingParties = activeParties.filter(p => p.bench === 'Ruling');
  let oppParties = activeParties.filter(p => p.bench === 'Opposition');

  if (rulingParties.length === 0) {
    rulingParties = [activeParties[0]];
    oppParties = activeParties.slice(1);
  }
  if (oppParties.length === 0 && activeParties.length > 1) {
    oppParties = [activeParties[1]];
    rulingParties = [activeParties[0]];
  } else if (oppParties.length === 0) {
    // Single party event
    oppParties = rulingParties;
  }

  // 2. Group learners by Academic Year for Stratified Sampling
  const years: AcademicYear[] = ['4th Year', '3rd Year', '2nd Year', '1st Year'];
  const learnersByYear: Record<AcademicYear, Learner[]> = {
    '1st Year': [],
    '2nd Year': [],
    '3rd Year': [],
    '4th Year': []
  };

  learners.forEach(l => {
    const yearKey = l.academic_year || '1st Year';
    if (!learnersByYear[yearKey]) learnersByYear[yearKey] = [];
    learnersByYear[yearKey].push({ ...l });
  });

  // Shuffle learners within each academic year group
  years.forEach(yr => {
    learnersByYear[yr] = shuffleArray(learnersByYear[yr]);
  });

  // 3. True Stratified Split: Guarantee Ruling Majority and Cross-Year Balance
  const totalLearners = learners.length;
  // In parliamentary democracy, Ruling coalition must hold majority (>50%) when delegates >= 2
  const targetTotalRuling = Math.min(
    totalLearners,
    Math.max(
      totalLearners >= 2 ? Math.ceil(totalLearners * 0.5) : 1,
      Math.round(totalLearners * rulingRatio)
    )
  );

  const rulingLearners: Learner[] = [];
  const oppLearners: Learner[] = [];

  years.forEach(yr => {
    const yrLearners = learnersByYear[yr];
    if (yrLearners.length === 0) return;

    // Distribute each year proportionally according to rulingRatio
    const yrRulingTarget = Math.min(
      yrLearners.length,
      Math.max(
        yrLearners.length >= 2 ? 1 : 0,
        Math.round(yrLearners.length * rulingRatio)
      )
    );

    for (let i = 0; i < yrLearners.length; i++) {
      if (i < yrRulingTarget) {
        rulingLearners.push(yrLearners[i]);
      } else {
        oppLearners.push(yrLearners[i]);
      }
    }
  });

  // Fine-tune to hit exact targetTotalRuling while preserving year balance
  while (rulingLearners.length < targetTotalRuling && oppLearners.length > 0) {
    rulingLearners.push(oppLearners.pop()!);
  }
  while (rulingLearners.length > targetTotalRuling && rulingLearners.length > 1) {
    oppLearners.push(rulingLearners.pop()!);
  }

  // 4. Party Distribution within Benches
  rulingLearners.forEach((l, i) => {
    const party = rulingParties[i % rulingParties.length];
    l.party_name = party.name;
    l.party_id = party.id;
    l.bench = 'Ruling';
    l.role = 'Member of Legislative Assembly (MLA)';
  });

  oppLearners.forEach((l, i) => {
    const party = oppParties[i % oppParties.length];
    l.party_name = party.name;
    l.party_id = party.id;
    l.bench = 'Opposition';
    l.role = 'Member of Legislative Assembly (MLA)';
  });

  // 5. Senior Role Assignments (Chief Minister, Speaker, Opposition Leader, Ministers)
  // Senior years (4th/3rd) receive top cabinet roles
  const yrOrder: Record<string, number> = { '4th Year': 4, '3rd Year': 3, '2nd Year': 2, '1st Year': 1 };
  const sortedRuling = [...rulingLearners].sort((a, b) => {
    return (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1);
  });

  const sortedOpp = [...oppLearners].sort((a, b) => {
    return (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1);
  });

  // Chief Minister & Ruling Leaders
  if (sortedRuling.length > 0) sortedRuling[0].role = 'Chief Minister';
  if (sortedRuling.length > 1) sortedRuling[1].role = 'Speaker of the Assembly';
  if (sortedRuling.length > 2) sortedRuling[2].role = 'Deputy Speaker';
  for (let i = 3; i < sortedRuling.length && (i - 3) < CABINET_PORTFOLIOS.length; i++) {
    sortedRuling[i].role = CABINET_PORTFOLIOS[i - 3];
  }

  // Leader of Opposition & Shadow Cabinet
  if (sortedOpp.length > 0) sortedOpp[0].role = 'Leader of the Opposition';
  if (sortedOpp.length > 1) sortedOpp[1].role = 'Deputy Leader of Opposition';
  for (let i = 2; i < sortedOpp.length && (i - 2) < SHADOW_PORTFOLIOS.length; i++) {
    sortedOpp[i].role = SHADOW_PORTFOLIOS[i - 2];
  }

  // Update role mappings back
  const roleMap = new Map<string, string>();
  [...sortedRuling, ...sortedOpp].forEach(l => {
    roleMap.set(l.id, l.role || 'Member of Legislative Assembly (MLA)');
  });

  // 6. TN Constituencies Mapping (1–234)
  const availableConstituencies = shuffleArray(TN_CONSTITUENCIES);
  const combinedQueue = shuffleArray([...rulingLearners, ...oppLearners]);

  const updatedLearners = combinedQueue.map((learner, idx) => {
    let constNo: number;
    let constName: string;
    let district: string;

    if (idx < availableConstituencies.length) {
      const constObj = availableConstituencies[idx];
      constNo = constObj.number;
      constName = constObj.name;
      district = constObj.district;
    } else {
      const extraIdx = idx - availableConstituencies.length + 1;
      constNo = 234 + extraIdx;
      constName = `Nominated Seat ${extraIdx}`;
      district = 'State Nominated';
    }

    return {
      ...learner,
      constituency_number: constNo,
      constituency_name: constName,
      district: district,
      role: roleMap.get(learner.id) || learner.role || 'Member of Legislative Assembly (MLA)'
    };
  });

  // 7. Committee Assignment (if committees are configured)
  if (committees && committees.length > 0) {
    const partyBuckets: Record<string, Learner[]> = {};
    updatedLearners.forEach(l => {
      const p = l.party_name || 'Independent';
      if (!partyBuckets[p]) partyBuckets[p] = [];
      partyBuckets[p].push(l);
    });

    Object.values(partyBuckets).forEach(bucket => {
      bucket.forEach((l, idx) => {
        const comm = committees[idx % committees.length];
        l.committee_name = comm.name;
        l.committee_id = comm.id;
      });
    });
  } else {
    updatedLearners.forEach(l => {
      l.committee_name = undefined;
      l.committee_id = undefined;
    });
  }

  // 8. Compute Statistics
  const partyDist: Record<string, number> = {};
  const benchDist = { ruling: 0, opposition: 0, independent: 0 };
  const committeeDist: Record<string, number> = {};
  const yearMix: Record<AcademicYear, Record<string, number>> = {
    '1st Year': {}, '2nd Year': {}, '3rd Year': {}, '4th Year': {}
  };

  updatedLearners.forEach(l => {
    if (l.party_name) {
      partyDist[l.party_name] = (partyDist[l.party_name] || 0) + 1;
    }
    if (l.bench === 'Ruling') benchDist.ruling++;
    else if (l.bench === 'Opposition') benchDist.opposition++;
    else benchDist.independent++;

    if (l.committee_name) {
      committeeDist[l.committee_name] = (committeeDist[l.committee_name] || 0) + 1;
    }

    const yr = l.academic_year || '1st Year';
    if (!yearMix[yr]) yearMix[yr] = {};
    if (l.party_name) {
      yearMix[yr][l.party_name] = (yearMix[yr][l.party_name] || 0) + 1;
    }
  });

  return {
    updatedLearners,
    stats: {
      totalAllocated: updatedLearners.length,
      constituenciesUsed: Math.min(updatedLearners.length, 234),
      partyDistribution: partyDist,
      benchDistribution: benchDist,
      committeeDistribution: committeeDist,
      academicYearMix: yearMix
    }
  };
}

