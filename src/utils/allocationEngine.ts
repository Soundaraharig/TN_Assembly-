import type { Learner, Party, Committee, AcademicYear } from '../types';
import { TN_CONSTITUENCIES } from '../data/tnConstituencies';

export interface AllocationResult {
  updatedLearners: Learner[];
  updatedParties?: Party[];
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
  "Minister for Education",
  "Minister for Women & Child Development",
  "Minister for Youth Affairs & Sports",
  "Minister for Health & Family Welfare",
  "Minister for Social Justice & Empowerment",
  "Minister for Road Transport & Highways",
  "Minister for Rural Development",
  "Minister for Science & Technology",
  "Minister for MSME",
  "Minister for Environment, Forest, & Climate Change",
  "Minister for Skill Development & Entrepreneurship",
  "Minister for Electronics & IT",
  "Minister for Finance",
  "Minister for Home Affairs",
  "Minister for Agriculture"
];

const SHADOW_PORTFOLIOS = [
  "Shadow Minister for Education",
  "Shadow Minister for Women & Child Development",
  "Shadow Minister for Youth Affairs & Sports",
  "Shadow Minister for Health & Family Welfare",
  "Shadow Minister for Finance",
  "Shadow Minister for Home Affairs",
  "Shadow Minister for Agriculture",
  "Shadow Minister for Electronics & IT",
  "Shadow Minister for Rural Development",
  "Shadow Minister for Environment"
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
      updatedParties: parties,
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
  let activeParties = parties.map(p => ({ ...p }));
  if (activeParties.length === 0) {
    activeParties = [
      { id: 'pty_default_ruling', event_id: eventId, name: 'Party 1', bench: 'Ruling', color: '#059669' },
      { id: 'pty_default_opp', event_id: eventId, name: 'Party 2', bench: 'Opposition', color: '#dc2626' }
    ];
  }

  // Ensure Ruling and Opposition benches are established if not configured
  const hasRuling = activeParties.some(p => p.bench === 'Ruling');
  const hasOpp = activeParties.some(p => p.bench === 'Opposition');

  if (!hasRuling && !hasOpp) {
    const rulingCount = Math.max(1, Math.min(activeParties.length - 1, Math.round(activeParties.length * rulingRatio) || 1));
    activeParties = activeParties.map((p, idx) => ({
      ...p,
      bench: idx < rulingCount ? 'Ruling' : 'Opposition'
    }));
  } else if (!hasRuling && hasOpp) {
    const firstInd = activeParties.find(p => p.bench !== 'Opposition') || activeParties[0];
    firstInd.bench = 'Ruling';
  } else if (hasRuling && !hasOpp && activeParties.length > 1) {
    const firstInd = activeParties.find(p => p.bench !== 'Ruling') || activeParties[1];
    firstInd.bench = 'Opposition';
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

  const totalLearners = learners.length;
  const numParties = activeParties.length;

  const rulingLearners: Learner[] = [];
  const oppLearners: Learner[] = [];
  const indLearners: Learner[] = [];

  // 3. Balanced Equal Party Allocation:
  // Distribute delegates equally across all active parties (e.g. 120 / 5 = 24 each)
  // with stratified sampling across academic years.
  const baseQuota = Math.floor(totalLearners / numParties);
  const remainder = totalLearners % numParties;
  const partyQuotas = activeParties.map((_, i) => baseQuota + (i < remainder ? 1 : 0));

  const partyBuckets: Learner[][] = activeParties.map(() => []);

  // Interleave years from senior to junior into party buckets respecting party quotas
  let partyIdx = 0;
  for (const yr of years) {
    const yrLearners = learnersByYear[yr];
    for (const learner of yrLearners) {
      let attempts = 0;
      while (partyBuckets[partyIdx].length >= partyQuotas[partyIdx] && attempts < numParties) {
        partyIdx = (partyIdx + 1) % numParties;
        attempts++;
      }
      partyBuckets[partyIdx].push(learner);
      partyIdx = (partyIdx + 1) % numParties;
    }
  }

  // Assign party and default role to each learner (Bench is ONLY set via Government Formation or manual edit)
  activeParties.forEach((party, pIdx) => {
    partyBuckets[pIdx].forEach(l => {
      l.party_name = party.name;
      l.party_id = party.id;
      // Bench is strictly governed by Government Formation (party.bench) or manual edit, never invented
      l.bench = (party.bench === 'Ruling' || party.bench === 'Opposition')
        ? party.bench
        : (l.bench || undefined);
      l.role = l.role || 'Member of Legislative Assembly (MLA)';

      if (l.bench === 'Ruling') {
        rulingLearners.push(l);
      } else if (l.bench === 'Opposition') {
        oppLearners.push(l);
      } else {
        indLearners.push(l);
      }
    });
  });

  // 4. Senior Role Assignments (Chief Minister, Speaker, Opposition Leader, Ministers)
  // Senior years (4th/3rd) receive top cabinet roles
  const yrOrder: Record<string, number> = { '4th Year': 4, '3rd Year': 3, '2nd Year': 2, '1st Year': 1 };
  const sortedRuling = [...rulingLearners].sort((a, b) => {
    return (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1);
  });

  const sortedOpp = [...oppLearners].sort((a, b) => {
    return (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1);
  });

  // Chief Minister & Ruling Leaders
  if (sortedRuling.length > 0) sortedRuling[0].role = 'Chief Minister (Leader of the House)';
  if (sortedRuling.length > 1) sortedRuling[1].role = 'Speaker of Legislative Assembly';
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
  const combinedQueue = shuffleArray([...rulingLearners, ...oppLearners, ...indLearners]);

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
    updatedParties: activeParties,
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

