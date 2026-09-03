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
  _rulingRatio: number = 0.55
): AllocationResult {
  if (learners.length === 0 || parties.length === 0 || committees.length === 0) {
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

  // 1. Group learners by Academic Year for stratified sampling
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

  // 2. Prepare TN Constituencies (shuffle 1 to 234)
  const availableConstituencies = shuffleArray(TN_CONSTITUENCIES);

  const allActiveParties = [...parties];

  // Interleave learners across years into a master balanced queue
  const balancedQueue: Learner[] = [];
  let added = true;
  let idx = 0;
  while (added) {
    added = false;
    for (const yr of years) {
      if (idx < learnersByYear[yr].length) {
        balancedQueue.push(learnersByYear[yr][idx]);
        added = true;
      }
    }
    idx++;
  }

  // 4. Distribute learners evenly into Parties & Committees
  const numParties = allActiveParties.length;
  const numCommittees = committees.length;

  const rulingLearners: Learner[] = [];
  const oppositionLearners: Learner[] = [];

  const updatedLearners: Learner[] = balancedQueue.map((learner, index) => {
    // Select constituency
    const constObj = availableConstituencies[index % availableConstituencies.length];

    // Round-robin Party assignment
    const party = allActiveParties[index % numParties];

    // Round-robin Committee assignment
    const committee = committees[index % numCommittees];

    const updated: Learner = {
      ...learner,
      constituency_number: constObj.number,
      constituency_name: `${constObj.number} - ${constObj.name} (${constObj.district})`,
      party_name: party.name,
      party_id: party.id,
      bench: party.bench,
      committee_name: committee.name,
      committee_id: committee.id,
      role: 'Member of Legislative Assembly (MLA)' // Default
    };

    if (party.bench === 'Ruling') {
      rulingLearners.push(updated);
    } else {
      oppositionLearners.push(updated);
    }

    return updated;
  });

  // 5. High-level Role Assignments (Chief Minister, Speaker, Opposition Leader, Ministers)
  // Sort ruling learners so senior years (4th/3rd) get top cabinet roles
  const sortedRuling = [...rulingLearners].sort((a, b) => {
    const yrOrder: Record<string, number> = { '4th Year': 4, '3rd Year': 3, '2nd Year': 2, '1st Year': 1 };
    return (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1);
  });

  const sortedOpposition = [...oppositionLearners].sort((a, b) => {
    const yrOrder: Record<string, number> = { '4th Year': 4, '3rd Year': 3, '2nd Year': 2, '1st Year': 1 };
    return (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1);
  });

  // Chief Minister
  if (sortedRuling.length > 0) {
    sortedRuling[0].role = 'Chief Minister';
  }
  // Speaker
  if (sortedRuling.length > 1) {
    sortedRuling[1].role = 'Speaker of the Assembly';
  }
  // Deputy Speaker
  if (sortedRuling.length > 2) {
    sortedRuling[2].role = 'Deputy Speaker';
  }
  // Cabinet Ministers
  for (let i = 3; i < sortedRuling.length && (i - 3) < CABINET_PORTFOLIOS.length; i++) {
    sortedRuling[i].role = CABINET_PORTFOLIOS[i - 3];
  }

  // Leader of Opposition
  if (sortedOpposition.length > 0) {
    sortedOpposition[0].role = 'Leader of the Opposition';
  }
  // Deputy Leader of Opposition
  if (sortedOpposition.length > 1) {
    sortedOpposition[1].role = 'Deputy Leader of Opposition';
  }
  // Shadow Ministers
  for (let i = 2; i < sortedOpposition.length && (i - 2) < SHADOW_PORTFOLIOS.length; i++) {
    sortedOpposition[i].role = SHADOW_PORTFOLIOS[i - 2];
  }

  // Merge updated roles back into updatedLearners
  const roleMap = new Map<string, string>();
  [...sortedRuling, ...sortedOpposition].forEach(l => {
    roleMap.set(l.id, l.role || 'Member of Legislative Assembly (MLA)');
  });

  const finalLearners = updatedLearners.map(l => ({
    ...l,
    role: roleMap.get(l.id) || l.role || 'Member of Legislative Assembly (MLA)'
  }));

  // Calculate Statistics
  const partyDist: Record<string, number> = {};
  const benchDist = { ruling: 0, opposition: 0, independent: 0 };
  const committeeDist: Record<string, number> = {};
  const yearMix: Record<AcademicYear, Record<string, number>> = {
    '1st Year': {}, '2nd Year': {}, '3rd Year': {}, '4th Year': {}
  };

  finalLearners.forEach(l => {
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
    updatedLearners: finalLearners,
    stats: {
      totalAllocated: finalLearners.length,
      constituenciesUsed: Math.min(finalLearners.length, 234),
      partyDistribution: partyDist,
      benchDistribution: benchDist,
      committeeDistribution: committeeDist,
      academicYearMix: yearMix
    }
  };
}
