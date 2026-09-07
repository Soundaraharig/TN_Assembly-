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

export type AllocationMode = 'UNASSIGNED_ONLY' | 'REALLOCATE_ALL';

export interface PartyAllocationOptions {
  mode?: AllocationMode;
  rulingRatio?: number;
}

export interface CommitteeAllocationOptions {
  mode?: AllocationMode;
}

// ─────────────────────────────────────────────────────────────────────────────
// INDEPENDENT PARTY ALLOCATION
// ─────────────────────────────────────────────────────────────────────────────
export function allocateParties(
  learners: Learner[],
  parties: Party[],
  options: PartyAllocationOptions = {}
): AllocationResult {
  const mode = options.mode || 'UNASSIGNED_ONLY';
  const rulingRatio = options.rulingRatio || 0.55;

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

  const eventId = learners[0]?.event_id || '';
  let activeParties = parties.map(p => ({ ...p }));
  if (activeParties.length === 0) {
    activeParties = [
      { id: 'pty_default_ruling', event_id: eventId, name: 'Party 1', bench: 'Ruling', color: '#059669' },
      { id: 'pty_default_opp', event_id: eventId, name: 'Party 2', bench: 'Opposition', color: '#dc2626' }
    ];
  }

  // Ensure Ruling and Opposition benches exist on parties if not configured
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

  // Work on a shallow copy of learners
  let resultLearners = learners.map(l => ({ ...l }));

  const years: AcademicYear[] = ['4th Year', '3rd Year', '2nd Year', '1st Year'];
  const numParties = activeParties.length;

  // Determine which delegates need party allocation
  let toAllocate: Learner[];
  let preserved: Learner[] = [];

  if (mode === 'UNASSIGNED_ONLY') {
    toAllocate = resultLearners.filter(l => !l.party_id && !l.party_name);
    preserved = resultLearners.filter(l => Boolean(l.party_id || l.party_name));
  } else {
    toAllocate = [...resultLearners];
    preserved = [];
  }

  if (toAllocate.length > 0) {
    // Group delegates to allocate by Academic Year for Stratified Sampling
    const learnersByYear: Record<AcademicYear, Learner[]> = {
      '1st Year': [], '2nd Year': [], '3rd Year': [], '4th Year': []
    };
    toAllocate.forEach(l => {
      const yr = l.academic_year || '1st Year';
      if (!learnersByYear[yr]) learnersByYear[yr] = [];
      learnersByYear[yr].push(l);
    });
    years.forEach(yr => {
      learnersByYear[yr] = shuffleArray(learnersByYear[yr]);
    });

    // Compute existing party sizes for balanced top-up
    const existingPartyCounts = activeParties.map(p => {
      return preserved.filter(l => l.party_id === p.id || (!l.party_id && l.party_name === p.name)).length;
    });

    // Fill buckets prioritizing parties with fewer members
    const partyBuckets: Learner[][] = activeParties.map(() => []);
    const currentPartyCounts = [...existingPartyCounts];

    for (const yr of years) {
      const yrLearners = learnersByYear[yr];
      for (const learner of yrLearners) {
        // Find party with the minimum count
        let minIdx = 0;
        let minVal = currentPartyCounts[0];
        for (let i = 1; i < numParties; i++) {
          if (currentPartyCounts[i] < minVal) {
            minVal = currentPartyCounts[i];
            minIdx = i;
          }
        }
        partyBuckets[minIdx].push(learner);
        currentPartyCounts[minIdx]++;
      }
    }

    // Apply party assignments to toAllocate
    activeParties.forEach((party, pIdx) => {
      partyBuckets[pIdx].forEach(l => {
        l.party_name = party.name;
        l.party_id = party.id;
        // Bench is strictly governed by party bench if defined in Government Formation
        if (party.bench === 'Ruling' || party.bench === 'Opposition') {
          l.bench = party.bench;
        }
        l.role = l.role || 'Member of Legislative Assembly (MLA)';
      });
    });

    // Reconstruct list preserving original positions
    const allocatedMap = new Map(toAllocate.map(l => [l.id, l]));
    resultLearners = resultLearners.map(l => allocatedMap.get(l.id) || l);
  }

  // Assign Constituency numbers to unassigned delegates
  const usedConstituencies = new Set<number>();
  resultLearners.forEach(l => {
    if (l.constituency_number) usedConstituencies.add(Number(l.constituency_number));
  });

  const availableConstituencies = shuffleArray(
    TN_CONSTITUENCIES.filter(c => !usedConstituencies.has(c.number))
  );

  let constIdx = 0;
  resultLearners.forEach((learner) => {
    if (mode === 'REALLOCATE_ALL' || !learner.constituency_number) {
      if (constIdx < availableConstituencies.length) {
        const c = availableConstituencies[constIdx++];
        learner.constituency_number = c.number;
        learner.constituency_name = c.name;
        learner.district = c.district;
      } else {
        const extraIdx = constIdx - availableConstituencies.length + 1;
        constIdx++;
        learner.constituency_number = 234 + extraIdx;
        learner.constituency_name = `Nominated Seat ${extraIdx}`;
        learner.district = 'State Nominated';
      }
    }
  });

  // Assign Senior Roles (Chief Minister, Opposition Leader, etc.) if not already set
  const rulingLearners = resultLearners.filter(l => l.bench === 'Ruling');
  const oppLearners = resultLearners.filter(l => l.bench === 'Opposition');
  const yrOrder: Record<string, number> = { '4th Year': 4, '3rd Year': 3, '2nd Year': 2, '1st Year': 1 };

  if (mode === 'REALLOCATE_ALL' || !rulingLearners.some(l => l.role?.includes('Chief Minister'))) {
    const sortedRuling = [...rulingLearners].sort(
      (a, b) => (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1)
    );
    if (sortedRuling.length > 0) sortedRuling[0].role = 'Chief Minister (Leader of the House)';
    if (sortedRuling.length > 1) sortedRuling[1].role = 'Speaker of Legislative Assembly';
    if (sortedRuling.length > 2) sortedRuling[2].role = 'Deputy Speaker';
    for (let i = 3; i < sortedRuling.length && (i - 3) < CABINET_PORTFOLIOS.length; i++) {
      sortedRuling[i].role = CABINET_PORTFOLIOS[i - 3];
    }
  }

  if (mode === 'REALLOCATE_ALL' || !oppLearners.some(l => l.role?.includes('Leader of the Opposition'))) {
    const sortedOpp = [...oppLearners].sort(
      (a, b) => (yrOrder[b.academic_year] || 1) - (yrOrder[a.academic_year] || 1)
    );
    if (sortedOpp.length > 0) sortedOpp[0].role = 'Leader of the Opposition';
    if (sortedOpp.length > 1) sortedOpp[1].role = 'Deputy Leader of Opposition';
    for (let i = 2; i < sortedOpp.length && (i - 2) < SHADOW_PORTFOLIOS.length; i++) {
      sortedOpp[i].role = SHADOW_PORTFOLIOS[i - 2];
    }
  }

  // Compute Stats
  const stats = computeAllocationStats(resultLearners);

  return {
    updatedLearners: resultLearners,
    updatedParties: activeParties,
    stats
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INDEPENDENT COMMITTEE ALLOCATION (NEVER OVERWRITES PARTIES, BENCH, OR CONSTITUENCIES)
// ─────────────────────────────────────────────────────────────────────────────
export function allocateCommittees(
  learners: Learner[],
  committees: Committee[],
  options: CommitteeAllocationOptions = {}
): { updatedLearners: Learner[]; stats: Record<string, number> } {
  const mode = options.mode || 'UNASSIGNED_ONLY';

  if (learners.length === 0 || !committees || committees.length === 0) {
    const emptyStats: Record<string, number> = {};
    (committees || []).forEach(c => { emptyStats[c.name] = 0; });
    return { updatedLearners: learners, stats: emptyStats };
  }

  const resultLearners = learners.map(l => ({ ...l }));

  // Identify learners needing committee assignment
  let toAllocate: Learner[];
  let preserved: Learner[] = [];

  if (mode === 'UNASSIGNED_ONLY') {
    toAllocate = resultLearners.filter(l => !l.committee_id && !l.committee_name);
    preserved = resultLearners.filter(l => Boolean(l.committee_id || l.committee_name));
  } else {
    toAllocate = [...resultLearners];
    preserved = [];
  }

  if (toAllocate.length > 0) {
    // Calculate current members per committee from preserved learners
    const committeeMemberCounts: Record<string, number> = {};
    committees.forEach(c => { committeeMemberCounts[c.id] = 0; });

    preserved.forEach(l => {
      const match = committees.find(c => c.id === l.committee_id || c.name.toLowerCase() === l.committee_name?.toLowerCase());
      if (match) {
        committeeMemberCounts[match.id] = (committeeMemberCounts[match.id] || 0) + 1;
      }
    });

    // Group toAllocate by party so every committee gets a balanced mix across parties
    const partyBuckets: Record<string, Learner[]> = {};
    toAllocate.forEach(l => {
      const p = l.party_name || 'Independent';
      if (!partyBuckets[p]) partyBuckets[p] = [];
      partyBuckets[p].push(l);
    });

    // Interleave party delegates into committees
    // Pick the committee with the least current members
    const partyKeys = Object.keys(partyBuckets);
    let anyRemaining = true;
    let round = 0;

    while (anyRemaining) {
      anyRemaining = false;
      for (const p of partyKeys) {
        const bucket = partyBuckets[p];
        if (round < bucket.length) {
          anyRemaining = true;
          const learner = bucket[round];

          // Find committee with minimum members
          let minComm = committees[0];
          let minCount = committeeMemberCounts[minComm.id] ?? 999999;
          for (let i = 1; i < committees.length; i++) {
            const c = committees[i];
            const cnt = committeeMemberCounts[c.id] ?? 0;
            if (cnt < minCount) {
              minCount = cnt;
              minComm = c;
            }
          }

          // Assign committee strictly (LEAVING PARTY, BENCH, ROLE, CONSTITUENCY INTACT!)
          learner.committee_id = minComm.id;
          learner.committee_name = minComm.name;
          committeeMemberCounts[minComm.id] = (committeeMemberCounts[minComm.id] || 0) + 1;
        }
      }
      round++;
    }

    // Merge back
    const allocatedMap = new Map(toAllocate.map(l => [l.id, l]));
    resultLearners.forEach((l, idx) => {
      const updated = allocatedMap.get(l.id);
      if (updated) {
        resultLearners[idx] = updated;
      }
    });
  }

  // Compute committee distribution stats
  const stats: Record<string, number> = {};
  committees.forEach(c => { stats[c.name] = 0; });
  resultLearners.forEach(l => {
    if (l.committee_name) {
      stats[l.committee_name] = (stats[l.committee_name] || 0) + 1;
    }
  });

  return {
    updatedLearners: resultLearners,
    stats
  };
}

// Helper to compute statistics across all learners
function computeAllocationStats(learners: Learner[]) {
  const partyDist: Record<string, number> = {};
  const benchDist = { ruling: 0, opposition: 0, independent: 0 };
  const committeeDist: Record<string, number> = {};
  const yearMix: Record<AcademicYear, Record<string, number>> = {
    '1st Year': {}, '2nd Year': {}, '3rd Year': {}, '4th Year': {}
  };

  learners.forEach(l => {
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
    totalAllocated: learners.length,
    constituenciesUsed: learners.filter(l => Boolean(l.constituency_number)).length,
    partyDistribution: partyDist,
    benchDistribution: benchDist,
    committeeDistribution: committeeDist,
    academicYearMix: yearMix
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE RUN AUTO ALLOCATION (Runs both in sequence for backwards compatibility)
// ─────────────────────────────────────────────────────────────────────────────
export function runAutoAllocation(
  learners: Learner[],
  parties: Party[],
  committees: Committee[],
  rulingRatio: number = 0.55
): AllocationResult {
  const partyResult = allocateParties(learners, parties, { mode: 'REALLOCATE_ALL', rulingRatio });
  const committeeResult = allocateCommittees(partyResult.updatedLearners, committees, { mode: 'REALLOCATE_ALL' });

  return {
    updatedLearners: committeeResult.updatedLearners,
    updatedParties: partyResult.updatedParties,
    stats: computeAllocationStats(committeeResult.updatedLearners)
  };
}


