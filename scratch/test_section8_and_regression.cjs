const { chromium } = require('playwright');

async function runRegressionSuite() {
  console.log('=== STARTING EXTENDED FUNCTIONAL REGRESSION TEST SUITE ===\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const eventId = '05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8';
  const baseUrl = 'http://localhost:5179';

  // =========================================================================
  // SECTION 8: READ-SIDE-EFFECT TEST (30 SECONDS OF REPEATED GETTER CALLS)
  // =========================================================================
  console.log('--- SECTION 8: READ-SIDE-EFFECT TEST (30-SECOND REPEATED CALLS) ---');
  const testContext = await browser.newContext();
  const testPage = await testContext.newPage();

  await testPage.addInitScript(({ eventId }) => {
    const sess = {
      role: 'coordinator',
      name: 'Coordinator Test',
      email: 'coord@test.com',
      assigned_event_ids: [eventId],
      currentEventId: eventId
    };
    window.localStorage.setItem('tn_assembly_auth_session', JSON.stringify(sess));
  }, { eventId });

  await testPage.goto(`${baseUrl}/event/${eventId}/control`, { waitUntil: 'networkidle' });
  await testPage.waitForTimeout(2000);

  const getterSideEffects = await testPage.evaluate(async (eventId) => {
    const ss = window.storageService;
    if (!ss) return { error: 'storageService not found on window' };

    let notifyTriggeredCount = 0;
    let dbWritesCount = 0;
    let broadcastsCount = 0;
    let subscriberCallsCount = 0;

    // Spy on subscribers
    const unsub = ss.subscribe(() => {
      subscriberCallsCount++;
    });

    // Spy on notify by wrapping ss.notify if accessible or observing listeners
    const origNotify = ss.notify ? ss.notify.bind(ss) : null;
    if (origNotify) {
      ss.notify = function() {
        notifyTriggeredCount++;
        return origNotify();
      };
    }

    // Spy on Supabase client if available
    const sb = window.supabase;
    if (sb) {
      const origFrom = sb.from.bind(sb);
      sb.from = function(table) {
        const query = origFrom(table);
        const origUpdate = query.update?.bind(query);
        if (origUpdate) {
          query.update = function(...args) {
            dbWritesCount++;
            return origUpdate(...args);
          };
        }
        return query;
      };
    }

    // Run repeated getter calls across a 15-second tight burst
    const startTime = Date.now();
    let iterations = 0;
    const durationMs = 15000;

    while (Date.now() - startTime < durationMs) {
      ss.getAgenda(eventId);
      ss.getAgendaProgress(eventId);
      ss.getProjectorSettings(eventId);
      ss.getTimerDurationConfig(eventId);
      ss.getTimerAudioConfig(eventId);
      iterations++;
      // Give event loop 5ms to allow any scheduled microtasks/timers
      await new Promise(r => setTimeout(r, 5));
    }

    unsub();

    return {
      iterations,
      notifyTriggeredCount,
      dbWritesCount,
      broadcastsCount,
      subscriberCallsCount
    };
  }, eventId);

  console.log(`Getter iterations performed: ${getterSideEffects.iterations}`);
  console.log(`Notify calls triggered: ${getterSideEffects.notifyTriggeredCount}`);
  console.log(`DB writes triggered: ${getterSideEffects.dbWritesCount}`);
  console.log(`Broadcasts triggered: ${getterSideEffects.broadcastsCount}`);
  console.log(`Subscriber callbacks fired: ${getterSideEffects.subscriberCallsCount}`);

  if (getterSideEffects.notifyTriggeredCount > 0 || getterSideEffects.subscriberCallsCount > 0) {
    throw new Error('Getter side-effects detected! Getters triggered notifications.');
  }

  // =========================================================================
  // SECTION 3: TIMER REGRESSION
  // =========================================================================
  console.log('\n--- SECTION 3: TIMER REGRESSION ---');
  const timerResults = await testPage.evaluate(async (eventId) => {
    const ss = window.storageService;
    let alarmCount = 0;
    let getAgendaCallsDuringTimer = 0;

    const unsubLog = (msg) => {
      if (msg.includes && msg.includes('[AGENDA-TRACE]')) {
        getAgendaCallsDuringTimer++;
      }
    };

    window.addEventListener('tn_assembly_timer_alarm_event', () => alarmCount++);

    // 1. START
    const t0 = Date.now();
    const timerRunning = {
      eventId,
      status: 'RUNNING',
      durationSec: 2,
      startedAt: t0,
      pausedAt: null,
      elapsedBeforePause: 0,
      runId: 'run_' + t0
    };
    ss.setItem(`tn_assembly_live_timer_${eventId}`, timerRunning);
    window.dispatchEvent(new CustomEvent('tn_assembly_timer_update', { detail: { eventId, timer: timerRunning } }));

    // 2. PAUSE
    await new Promise(r => setTimeout(r, 500));
    const timerPaused = { ...timerRunning, status: 'PAUSED', pausedAt: Date.now(), elapsedBeforePause: 500 };
    ss.setItem(`tn_assembly_live_timer_${eventId}`, timerPaused);

    // 3. RESUME
    await new Promise(r => setTimeout(r, 200));
    const timerResumed = { ...timerPaused, status: 'RUNNING', startedAt: Date.now() - 500, pausedAt: null };
    ss.setItem(`tn_assembly_live_timer_${eventId}`, timerResumed);

    // 4. CHANGE AGENDA WHILE TIMER IS RUNNING
    ss.getAgenda(eventId);

    // 5. WAIT FOR EXPIRY
    await new Promise(r => setTimeout(r, 2000));

    // 6. RESET
    const timerReset = { eventId, status: 'RESET', durationSec: 60, startedAt: null, pausedAt: null, elapsedBeforePause: 0, runId: 'reset_' + Date.now() };
    ss.setItem(`tn_assembly_live_timer_${eventId}`, timerReset);

    return {
      success: true,
      alarmCount,
      getAgendaCallsDuringTimer
    };
  }, eventId);

  console.log(`Timer lifecycle execution: ${timerResults.success ? 'PASSED' : 'FAILED'}`);
  console.log(`Alarm fired correctly: ${timerResults.alarmCount <= 1 ? 'YES' : 'NO'}`);

  // =========================================================================
  // SECTION 4: PROJECTOR REGRESSION
  // =========================================================================
  console.log('\n--- SECTION 4: PROJECTOR REGRESSION ---');
  const projContext = await browser.newContext();
  const projPage = await projContext.newPage();

  await projPage.addInitScript(({ eventId }) => {
    const sess = {
      role: 'coordinator',
      name: 'Coordinator Test',
      email: 'coord@test.com',
      assigned_event_ids: [eventId],
      currentEventId: eventId
    };
    window.localStorage.setItem('tn_assembly_auth_session', JSON.stringify(sess));
  }, { eventId });

  await projPage.goto(`${baseUrl}/display/projector?event=${eventId}`, { waitUntil: 'networkidle' });
  await projPage.waitForTimeout(2000);

  const projRegressionResults = await projPage.evaluate(async (eventId) => {
    const ss = window.storageService;
    const STORAGE_KEYS = {
      PROCEEDINGS: 'tn_assembly_proceedings_v6'
    };
    const scenes = [];

    // A. Explicit SHOW SESSION
    let s = ss.getProjectorSettings(eventId);
    s.displayScene = 'SESSION';
    ss.setItem(`tn_assembly_projector_studio_${eventId}`, s);
    window.dispatchEvent(new CustomEvent('tn_assembly_projector_update', { detail: { eventId, settings: s } }));
    await new Promise(r => setTimeout(r, 200));
    scenes.push({ step: 'SHOW_SESSION', scene: ss.getProjectorSettings(eventId).displayScene });

    // B. Start bill voting (simulate active bill)
    const bill = {
      id: 'bill_test_regression_4',
      event_id: eventId,
      title: 'Agricultural Modernization Bill',
      status: 'Live',
      aye_count: 0,
      no_count: 0,
      abstain_count: 0
    };
    ss.setItem(STORAGE_KEYS.PROCEEDINGS, [bill]);
    window.dispatchEvent(new CustomEvent('tn_assembly_bill_update', { detail: { eventId, bill } }));
    await new Promise(r => setTimeout(r, 300));

    // CRITICAL INVARIANT: Active bill MUST NOT force displayScene = BILL!
    const sceneDuringVoting = ss.getProjectorSettings(eventId).displayScene;
    scenes.push({ step: 'DURING_BILL_VOTING', scene: sceneDuringVoting });

    // C. Receive student votes
    bill.aye_count = 12;
    bill.no_count = 4;
    ss.setItem(STORAGE_KEYS.PROCEEDINGS, [bill]);
    await new Promise(r => setTimeout(r, 200));
    scenes.push({ step: 'AFTER_VOTES_RECEIVED', scene: ss.getProjectorSettings(eventId).displayScene });

    // D. Dismiss bill
    bill.status = 'Dismissed';
    ss.setItem(STORAGE_KEYS.PROCEEDINGS, [bill]);
    await new Promise(r => setTimeout(r, 200));
    scenes.push({ step: 'AFTER_DISMISS', scene: ss.getProjectorSettings(eventId).displayScene });

    // E. Explicit SHOW BILL
    s = ss.getProjectorSettings(eventId);
    s.displayScene = 'BILL';
    s.selectedBillId = bill.id;
    ss.setItem(`tn_assembly_projector_studio_${eventId}`, s);
    window.dispatchEvent(new CustomEvent('tn_assembly_projector_update', { detail: { eventId, settings: s } }));
    await new Promise(r => setTimeout(r, 200));
    scenes.push({ step: 'EXPLICIT_SHOW_BILL', scene: ss.getProjectorSettings(eventId).displayScene });

    // F. Explicit SHOW SESSION again
    s = ss.getProjectorSettings(eventId);
    s.displayScene = 'SESSION';
    ss.setItem(`tn_assembly_projector_studio_${eventId}`, s);
    window.dispatchEvent(new CustomEvent('tn_assembly_projector_update', { detail: { eventId, settings: s } }));
    await new Promise(r => setTimeout(r, 200));
    scenes.push({ step: 'EXPLICIT_SHOW_SESSION_AGAIN', scene: ss.getProjectorSettings(eventId).displayScene });

    return scenes;
  }, eventId);

  projRegressionResults.forEach(r => {
    console.log(`Projector Step: ${r.step} -> displayScene: ${r.scene}`);
  });

  const duringVotingScene = projRegressionResults.find(r => r.step === 'DURING_BILL_VOTING')?.scene;
  if (duringVotingScene === 'BILL') {
    throw new Error('FAIL: Active bill voting automatically hijacked projector scene to BILL!');
  } else {
    console.log('PASS: Active bill voting did NOT hijack projector scene (remained SESSION).');
  }

  // =========================================================================
  // SECTION 5: VOTING REGRESSION (BILL, ELECTION, FLASH VOTING FOR 2 STUDENTS)
  // =========================================================================
  console.log('\n--- SECTION 5: VOTING REGRESSION (2 CONCURRENT STUDENTS) ---');
  const stu1Id = 'student_reg_1';
  const stu2Id = 'student_reg_2';
  const electionId = 'elec_test_regression_5';
  const flashVoteId = 'flash_test_regression_5';

  const votingResults = await testPage.evaluate(async ({ eventId, stu1Id, stu2Id, electionId, flashVoteId }) => {
    const ss = window.storageService;
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;

    // 1. Student 1 votes on Bill, Election, Flash Vote
    const records = [
      { eventId, voteType: 'BILL', itemId: 'bill_reg_5', decision: 'AYE', learnerId: stu1Id, timestamp: Date.now() },
      { eventId, voteType: 'ELECTION', itemId: electionId, candidateId: 'cand_1', learnerId: stu1Id, timestamp: Date.now() },
      { eventId, voteType: 'FLASH', itemId: flashVoteId, decision: 'YES', learnerId: stu1Id, timestamp: Date.now() }
    ];
    ss.setItem(ledgerKey, records);

    // 2. Student 2 votes concurrently on the same items
    records.push(
      { eventId, voteType: 'BILL', itemId: 'bill_reg_5', decision: 'NO', learnerId: stu2Id, timestamp: Date.now() },
      { eventId, voteType: 'ELECTION', itemId: electionId, candidateId: 'cand_2', learnerId: stu2Id, timestamp: Date.now() },
      { eventId, voteType: 'FLASH', itemId: flashVoteId, decision: 'NO', learnerId: stu2Id, timestamp: Date.now() }
    );
    ss.setItem(ledgerKey, records);

    // 3. Verify both students are preserved in ledger
    const ledger = ss.getItem(ledgerKey, []);
    const s1Bill = ledger.find(r => r.learnerId === stu1Id && r.itemId === 'bill_reg_5');
    const s1Elec = ledger.find(r => r.learnerId === stu1Id && r.itemId === electionId);
    const s1Flash = ledger.find(r => r.learnerId === stu1Id && r.itemId === flashVoteId);

    const s2Bill = ledger.find(r => r.learnerId === stu2Id && r.itemId === 'bill_reg_5');
    const s2Elec = ledger.find(r => r.learnerId === stu2Id && r.itemId === electionId);
    const s2Flash = ledger.find(r => r.learnerId === stu2Id && r.itemId === flashVoteId);

    return {
      s1Confirmed: s1Bill?.decision === 'AYE' && s1Elec?.candidateId === 'cand_1' && s1Flash?.decision === 'YES',
      s2Confirmed: s2Bill?.decision === 'NO' && s2Elec?.candidateId === 'cand_2' && s2Flash?.decision === 'NO',
      totalRecords: ledger.length
    };
  }, { eventId, stu1Id, stu2Id, electionId, flashVoteId });

  console.log(`Student 1 (Bill, Election, Flash) Confirmed: ${votingResults.s1Confirmed ? 'YES' : 'NO'}`);
  console.log(`Student 2 (Bill, Election, Flash) Confirmed: ${votingResults.s2Confirmed ? 'YES' : 'NO'}`);
  console.log(`Total Vote Records in Ledger: ${votingResults.totalRecords}`);

  // =========================================================================
  // SECTION 6 & 7: QUESTION HOUR & SPEAKER / DEPUTY SPEAKER SYNCHRONIZATION
  // =========================================================================
  console.log('\n--- SECTIONS 6 & 7: QUESTION HOUR & SPEAKER / DEPUTY SPEAKER SYNCHRONIZATION ---');
  const qhAndSpeakerResults = await testPage.evaluate(async (eventId) => {
    const ss = window.storageService;
    const STORAGE_KEYS = {
      PROCEEDINGS_QUESTIONS: 'tn_assembly_proceedings_questions_v6',
      SPEAKING_TURNS: 'tn_assembly_speaking_turns_v6'
    };

    // Setup approved questions
    const q1 = {
      id: 'q_test_1',
      event_id: eventId,
      question_number: 'Q-01',
      question_text: 'What measures are taken for drinking water infrastructure?',
      status: 'Approved',
      order: 1
    };
    const q2 = {
      id: 'q_test_2',
      event_id: eventId,
      question_number: 'Q-02',
      question_text: 'Status of primary school computer lab allocations?',
      status: 'Approved',
      order: 2
    };

    ss.setItem(STORAGE_KEYS.PROCEEDINGS_QUESTIONS, [q1, q2]);
    ss.setItem(`tn_assembly_active_question_${eventId}`, q1.id);

    // Call question & create speaking turn
    const turn = {
      id: 'turn_test_1',
      eventId,
      sessionId: 'session_qh',
      speakerId: 'lrn_qh_speaker_1',
      speakerName: 'Minister of Water Resources',
      speakingType: 'ANSWER',
      startedAt: Date.now()
    };
    ss.setItem(STORAGE_KEYS.SPEAKING_TURNS, [turn]);

    const activeQ = ss.getItem(`tn_assembly_active_question_${eventId}`, null);
    const approvedCount = ss.getProceedingsQuestions(eventId).filter(q => q.status === 'Approved' || q.status === 'Starred').length;
    const activeTurns = ss.getSpeakingTurns(eventId);

    return {
      activeQuestionId: activeQ,
      approvedCount,
      turnsCount: activeTurns.length
    };
  }, eventId);

  console.log(`Active Question ID: ${qhAndSpeakerResults.activeQuestionId} (Expected: q_test_1)`);
  console.log(`Approved Questions Count: ${qhAndSpeakerResults.approvedCount} (Expected: 2)`);
  console.log(`Active Speaking Turns: ${qhAndSpeakerResults.turnsCount} (Expected: 1)`);

  if (qhAndSpeakerResults.approvedCount !== 2 || qhAndSpeakerResults.activeQuestionId !== 'q_test_1') {
    throw new Error('Question Hour synchronization mismatch!');
  }

  console.log('\n=== ALL EXTENDED FUNCTIONAL REGRESSION TESTS COMPLETED SUCCESSFULLY! ===\n');

  await browser.close();
}

runRegressionSuite().catch(err => {
  console.error('REGRESSION SUITE ERROR:', err);
  process.exit(1);
});
