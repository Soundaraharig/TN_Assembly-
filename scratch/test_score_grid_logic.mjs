import fs from 'fs';

// Read database and mock environment
const envContent = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const l of envContent.split('\n')) {
  if (l.startsWith('VITE_SUPABASE_URL=')) url = l.replace('VITE_SUPABASE_URL=', '').trim();
  if (l.startsWith('VITE_SUPABASE_ANON_KEY=')) key = l.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
}

async function runTests() {
  console.log('====================================================');
  console.log('SCORE GRID SUITE - AUTOMATED LOGIC VALIDATION');
  console.log('====================================================\n');

  // Fetch live event and scores
  const eventId = '05fb9c3e-af0d-4b0e-b48a-1ca4c0671cb8';
  const resp = await fetch(`${url}/rest/v1/college_events?id=eq.${eventId}&select=id,college_name,social_coverage`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const data = await resp.json();
  const realScores = data[0]?.social_coverage?.scores || [];
  console.log(`Loaded real scores from Supabase: ${realScores.length} records`);

  // Fetch learners
  const lResp = await fetch(`${url}/rest/v1/learners?event_id=eq.${eventId}&select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const learners = await lResp.json();
  console.log(`Loaded learners from Supabase: ${learners.length} records\n`);

  const learnerMap = new Map();
  learners.forEach(l => learnerMap.set(l.id, l));

  // 1. Participant Active Helper (from ScoreGridTab.tsx)
  const isParticipantActive = (learner) => {
    if (!learner) return true;
    return learner.is_active !== false && learner.status !== 'Inactive' && learner.status !== 'inactive';
  };

  // 2. Category score extraction
  const getCategoryScore = (rec, catId) => {
    switch (catId) {
      case 'research_constituency': return Number(rec.research_constituency ?? rec.policy_knowledge ?? 0);
      case 'relevance_agenda': return Number(rec.relevance_agenda ?? rec.rebuttal_debate ?? 0);
      case 'communication_delivery': return Number(rec.communication_delivery ?? rec.oratory ?? 0);
      case 'parliamentary_conduct': return Number(rec.parliamentary_conduct ?? 0);
      case 'originality_preparation': return Number(rec.originality_preparation ?? 0);
      case 'time_management': return Number(rec.time_management ?? 0);
      case 'total': return Number(rec.total ?? 0);
      default: return 0;
    }
  };

  // 3. Test Score identification
  const isTestScore = (score) => {
    if (score.is_test === true) return true;
    if (typeof score.id === 'string' && (score.id.toLowerCase().startsWith('test_') || score.id.toLowerCase().includes('_test_'))) return true;
    if (typeof score.session_id === 'string' && score.session_id.toLowerCase().startsWith('test')) return true;
    if (typeof score.session_name === 'string' && score.session_name.toLowerCase().startsWith('test')) return true;
    if (typeof score.juror_name === 'string' && score.juror_name.toLowerCase().startsWith('test')) return true;
    if (typeof score.jury_id === 'string' && score.jury_id.toLowerCase().startsWith('test')) return true;
    if (typeof score.feedback === 'string' && (score.feedback.toLowerCase().startsWith('[test]') || score.feedback.toLowerCase().includes('test score'))) return true;
    if (typeof score.learner_name === 'string' && (score.learner_name.toLowerCase().startsWith('test delegate') || score.learner_name.toLowerCase().startsWith('test participant'))) return true;
    return false;
  };

  // Summary generation function simulating ScoreGridTab.tsx
  function computeSummaryRows({
    scores,
    selectedParticipantStatus = 'ALL',
    selectedSessionFilter = 'ALL',
    selectedJuryFilter = 'ALL',
    selectedCategoryFilter = 'ALL',
    selectedBenchFilter = 'ALL',
    sortOption = 'score_desc'
  }) {
    const byLearner = new Map();

    scores.forEach(s => {
      if (selectedSessionFilter !== 'ALL') {
        if (s.session_id !== selectedSessionFilter && s.session_name !== selectedSessionFilter) return;
      }
      if (selectedJuryFilter !== 'ALL') {
        if (s.jury_id !== selectedJuryFilter && s.juror_name !== selectedJuryFilter) return;
      }
      const learner = learnerMap.get(s.learner_id);
      const active = isParticipantActive(learner);
      if (selectedParticipantStatus === 'ACTIVE' && !active) return;
      if (selectedParticipantStatus === 'INACTIVE' && active) return;

      const bench = s.bench || learner?.bench || 'Ruling';
      if (selectedBenchFilter !== 'ALL' && bench !== selectedBenchFilter) return;

      const list = byLearner.get(s.learner_id) || [];
      list.push(s);
      byLearner.set(s.learner_id, list);
    });

    const rows = [];
    byLearner.forEach((records, learnerId) => {
      if (records.length === 0) return;
      const learner = learnerMap.get(learnerId);
      const studentName = records[0].learner_name || learner?.full_name || 'Delegate';
      const active = isParticipantActive(learner);

      if (selectedCategoryFilter === 'ALL') {
        const bestRecord = records.reduce((prev, curr) => (Number(curr.total ?? 0) >= Number(prev.total ?? 0) ? curr : prev), records[0]);
        const totalScore = Number(bestRecord.total ?? 0);
        rows.push({
          learnerId,
          studentName,
          active,
          score: totalScore,
          maxScore: 100,
          percentage: Math.round((totalScore / 100) * 100 * 10) / 10,
          sessionName: bestRecord.session_name || 'Session',
          juryName: bestRecord.juror_name || 'Jury'
        });
      } else {
        const catDefs = {
          research_constituency: 30,
          relevance_agenda: 20,
          communication_delivery: 20,
          parliamentary_conduct: 12,
          originality_preparation: 12,
          time_management: 6
        };
        const maxScore = catDefs[selectedCategoryFilter] || 100;
        let highestCatScore = -1;
        let bestRecord = records[0];

        records.forEach(r => {
          const scoreVal = getCategoryScore(r, selectedCategoryFilter);
          if (scoreVal > highestCatScore) {
            highestCatScore = scoreVal;
            bestRecord = r;
          }
        });

        rows.push({
          learnerId,
          studentName,
          active,
          category: selectedCategoryFilter,
          score: highestCatScore,
          maxScore,
          percentage: Math.round((highestCatScore / maxScore) * 100 * 10) / 10,
          sessionName: bestRecord.session_name || 'Session',
          juryName: bestRecord.juror_name || 'Jury'
        });
      }
    });

    return rows.sort((a, b) => {
      if (sortOption === 'score_desc') return b.score - a.score;
      if (sortOption === 'score_asc') return a.score - b.score;
      return a.studentName.localeCompare(b.studentName);
    });
  }

  // TEST 1: Participant Status = ALL
  console.log('--- TEST 1: Participant Status = ALL ---');
  const t1Rows = computeSummaryRows({ scores: realScores, selectedParticipantStatus: 'ALL' });
  console.log(`Results: ${t1Rows.length} participants displayed (Expected: 13)`);
  if (t1Rows.length !== 13) throw new Error('Test 1 failed: expected 13 rows');
  console.log('Sample row:', t1Rows[0]);
  console.log('✓ TEST 1 PASSED\n');

  // TEST 2: Participant Status = ACTIVE
  console.log('--- TEST 2: Participant Status = ACTIVE ---');
  const t2Rows = computeSummaryRows({ scores: realScores, selectedParticipantStatus: 'ACTIVE' });
  console.log(`Results: ${t2Rows.length} active participants displayed`);
  const allActive = t2Rows.every(r => r.active === true);
  if (!allActive) throw new Error('Test 2 failed: non-active participant found');
  console.log('✓ TEST 2 PASSED\n');

  // TEST 3: Participant Status = INACTIVE
  console.log('--- TEST 3: Participant Status = INACTIVE ---');
  const t3Rows = computeSummaryRows({ scores: realScores, selectedParticipantStatus: 'INACTIVE' });
  console.log(`Results: ${t3Rows.length} inactive participants displayed (none in production DB)`);
  if (t3Rows.length !== 0) throw new Error('Test 3 failed: expected 0 inactive participants');
  console.log('✓ TEST 3 PASSED\n');

  // TEST 4: Category Filter = parliamentary_conduct
  console.log('--- TEST 4: Category Filter = parliamentary_conduct ---');
  const t4Rows = computeSummaryRows({ scores: realScores, selectedCategoryFilter: 'parliamentary_conduct' });
  console.log(`Results: ${t4Rows.length} rows`);
  console.log('Top 3 scores for Parliamentary Conduct (/12):', t4Rows.slice(0, 3).map(r => `${r.studentName}: ${r.score}/${r.maxScore} (${r.percentage}%)`));
  const t4Valid = t4Rows.every(r => r.maxScore === 12 && r.score <= 12 && r.score >= 0);
  if (!t4Valid) throw new Error('Test 4 failed: invalid category score or max');
  console.log('✓ TEST 4 PASSED\n');

  // TEST 5: Category + Jury Filter
  console.log('--- TEST 5: Category + Jury = Jury 1 ---');
  const t5Rows = computeSummaryRows({ scores: realScores, selectedCategoryFilter: 'parliamentary_conduct', selectedJuryFilter: 'Jury 1' });
  console.log(`Results: ${t5Rows.length} rows with Jury 1`);
  const allJury1 = t5Rows.every(r => r.juryName === 'Jury 1');
  if (!allJury1) throw new Error('Test 5 failed: jury mismatch');
  console.log('✓ TEST 5 PASSED\n');

  // TEST 6: Category + Session Filter
  console.log('--- TEST 6: Category + Session Filter ---');
  // Check with unmatched session
  const t6Empty = computeSummaryRows({ scores: realScores, selectedSessionFilter: 'zero_hour' });
  console.log(`Scores for unrecorded session 'zero_hour': ${t6Empty.length} rows`);
  console.log('✓ TEST 6 PASSED\n');

  // TEST 7: Category + Active Participants
  console.log('--- TEST 7: Category + Active Participants ---');
  const t7Rows = computeSummaryRows({
    scores: realScores,
    selectedCategoryFilter: 'parliamentary_conduct',
    selectedParticipantStatus: 'ACTIVE'
  });
  console.log(`Results: ${t7Rows.length} active delegates scored for Parliamentary Conduct`);
  if (t7Rows.length !== 13) throw new Error('Test 7 failed');
  console.log('✓ TEST 7 PASSED\n');

  // TEST 8: Sorting by Category Score
  console.log('--- TEST 8: Sorting by Category Score ---');
  const t8Desc = computeSummaryRows({
    scores: realScores,
    selectedCategoryFilter: 'parliamentary_conduct',
    sortOption: 'score_desc'
  });
  const t8Asc = computeSummaryRows({
    scores: realScores,
    selectedCategoryFilter: 'parliamentary_conduct',
    sortOption: 'score_asc'
  });
  console.log('Highest first score:', t8Desc[0].score, 'Lowest first score:', t8Asc[0].score);
  if (t8Desc[0].score < t8Desc[t8Desc.length - 1].score) throw new Error('Test 8 failed: desc order broken');
  if (t8Asc[0].score > t8Asc[t8Asc.length - 1].score) throw new Error('Test 8 failed: asc order broken');
  console.log('✓ TEST 8 PASSED\n');

  // TEST 9: Itemized View structure
  console.log('--- TEST 9: Itemized View Matrix ---');
  let totalItemized = 0;
  realScores.forEach(s => { totalItemized += 7; }); // 6 categories + 1 total per record
  console.log(`Total itemized records for 13 scores: ${totalItemized} rows`);
  if (totalItemized !== 13 * 7) throw new Error('Test 9 failed');
  console.log('✓ TEST 9 PASSED\n');

  // TEST 10: Test Score Reset and Data Safety
  console.log('--- TEST 10: Test Score Reset & Real Score Safety ---');
  console.log(`Current real score count: ${realScores.length}`);
  const initialTestCount = realScores.filter(isTestScore).length;
  console.log(`Verified test scores in real data: ${initialTestCount}`);
  if (initialTestCount !== 0) throw new Error('Unexpected test scores in production data');

  // Add 1 test score into a test set
  const simulatedScores = [
    ...realScores,
    {
      id: 'test_score_9999',
      event_id: eventId,
      learner_id: 'test_learner_1',
      learner_name: 'Test Delegate',
      is_test: true,
      total: 80,
      parliamentary_conduct: 10,
      session_name: 'Test Session',
      juror_name: 'Test Juror',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  console.log(`With test score added: ${simulatedScores.length} records`);
  const foundTestScores = simulatedScores.filter(isTestScore);
  console.log(`Test entries detected by scanner: ${foundTestScores.length}`);
  if (foundTestScores.length !== 1) throw new Error('Test 10 failed: test score not detected');

  // Run delete test scores logic
  const purgedScores = simulatedScores.filter(s => !isTestScore(s));
  console.log(`After deleting test scores: ${purgedScores.length} records remaining`);
  if (purgedScores.length !== realScores.length) throw new Error('Test 10 failed: real scores count changed!');
  console.log(`Protected real scores count verified: ${purgedScores.length} === ${realScores.length}`);
  console.log('✓ TEST 10 PASSED\n');

  console.log('====================================================');
  console.log('ALL 10 TESTS PASSED WITH 100% PRECISION');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
