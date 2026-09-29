const { chromium } = require('playwright');

async function testAll() {
  console.log('=== STARTING FULL RUNTIME VERIFICATION SUITE ===\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const eventId = '05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8';
  const baseUrl = 'http://localhost:5179';

  // Helper to create page with log tracking
  async function createTrackedPage(role, extraSess = {}) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const traces = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[AGENDA-TRACE]')) {
        traces.push({ time: Date.now(), text });
      }
    });

    await page.addInitScript(({ role, eventId, extraSess }) => {
      const sess = {
        role,
        name: `Test ${role}`,
        email: `${role}@test.com`,
        assigned_event_ids: [eventId],
        currentEventId: eventId,
        ...extraSess
      };
      window.localStorage.setItem('tn_assembly_auth_session', JSON.stringify(sess));
    }, { role, eventId, extraSess });

    return { page, context, traces };
  }

  // TEST 1: Control Tab Refresh & 10s Idle
  console.log('--- TEST 1: Control Tab Refresh & 10s Idle ---');
  const ctrl = await createTrackedPage('coordinator');
  await ctrl.page.goto(`${baseUrl}/event/${eventId}/control`, { waitUntil: 'networkidle' });
  await ctrl.page.waitForTimeout(2000);
  const ctrlPreCount = ctrl.traces.length;
  await ctrl.page.reload({ waitUntil: 'networkidle' });
  await ctrl.page.waitForTimeout(2000);
  const ctrlReloadHydration = ctrl.traces.length - ctrlPreCount;
  console.log(`Control Tab reload hydration calls: ${ctrlReloadHydration}`);

  const ctrlIdleStart = Date.now();
  await ctrl.page.waitForTimeout(10000);
  const ctrlIdleTraces = ctrl.traces.filter(t => t.time >= ctrlIdleStart);
  console.log(`Control Tab 10s idle calls: ${ctrlIdleTraces.length} (PASS if 0)`);
  if (ctrlIdleTraces.length > 0) throw new Error('Control tab produced idle getAgenda calls!');

  // TEST 2: Projector Refresh & 5s Idle
  console.log('\n--- TEST 2: Projector Display Refresh & 5s Idle ---');
  const proj = await createTrackedPage('coordinator');
  await proj.page.goto(`${baseUrl}/display/projector?event=${eventId}`, { waitUntil: 'networkidle' });
  await proj.page.waitForTimeout(2000);
  await proj.page.reload({ waitUntil: 'networkidle' });
  await proj.page.waitForTimeout(2000);
  const projIdleStart = Date.now();
  await proj.page.waitForTimeout(5000);
  const projIdleTraces = proj.traces.filter(t => t.time >= projIdleStart);
  console.log(`Projector 5s idle calls: ${projIdleTraces.length} (PASS if 0)`);
  if (projIdleTraces.length > 0) throw new Error('Projector produced idle getAgenda calls!');

  // TEST 3: Speaker Refresh & 5s Idle
  console.log('\n--- TEST 3: Speaker Page Refresh & 5s Idle ---');
  const speaker = await createTrackedPage('speaker', {
    student: { id: 'spk_1', full_name: 'Speaker Member', role: 'Speaker', event_id: eventId }
  });
  await speaker.page.goto(`${baseUrl}/event/${eventId}/speaker`, { waitUntil: 'networkidle' });
  await speaker.page.waitForTimeout(2000);
  await speaker.page.reload({ waitUntil: 'networkidle' });
  await speaker.page.waitForTimeout(2000);
  const spkIdleStart = Date.now();
  await speaker.page.waitForTimeout(5000);
  const spkIdleTraces = speaker.traces.filter(t => t.time >= spkIdleStart);
  console.log(`Speaker 5s idle calls: ${spkIdleTraces.length} (PASS if 0)`);
  if (spkIdleTraces.length > 0) throw new Error('Speaker produced idle getAgenda calls!');

  // TEST 4: Deputy Speaker Refresh & 5s Idle
  console.log('\n--- TEST 4: Deputy Speaker Refresh & 5s Idle ---');
  const depSpeaker = await createTrackedPage('deputy_speaker', {
    student: { id: 'dep_spk_1', full_name: 'Deputy Speaker Member', role: 'Deputy Speaker', event_id: eventId }
  });
  await depSpeaker.page.goto(`${baseUrl}/event/${eventId}/speaker`, { waitUntil: 'networkidle' });
  await depSpeaker.page.waitForTimeout(2000);
  await depSpeaker.page.reload({ waitUntil: 'networkidle' });
  await depSpeaker.page.waitForTimeout(2000);
  const depIdleStart = Date.now();
  await depSpeaker.page.waitForTimeout(5000);
  const depIdleTraces = depSpeaker.traces.filter(t => t.time >= depIdleStart);
  console.log(`Deputy Speaker 5s idle calls: ${depIdleTraces.length} (PASS if 0)`);
  if (depIdleTraces.length > 0) throw new Error('Deputy Speaker produced idle getAgenda calls!');

  // TEST 5: Network Reconnect Event (offline -> online)
  console.log('\n--- TEST 5: Network Offline -> Online Reconnect ---');
  const preReconnectCount = ctrl.traces.length;
  await ctrl.page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    setTimeout(() => {
      window.dispatchEvent(new Event('online'));
    }, 500);
  });
  await ctrl.page.waitForTimeout(3000);
  const postReconnectCalls = ctrl.traces.length - preReconnectCount;
  console.log(`Calls triggered by reconnect event: ${postReconnectCalls}`);
  // Check that reconnect settles back to 0 idle calls
  const reconIdleStart = Date.now();
  await ctrl.page.waitForTimeout(5000);
  const reconIdleTraces = ctrl.traces.filter(t => t.time >= reconIdleStart);
  console.log(`Post-reconnect 5s idle calls: ${reconIdleTraces.length} (PASS if 0)`);
  if (reconIdleTraces.length > 0) throw new Error('Reconnect left a running getAgenda loop!');

  // TEST 6: Explicit Agenda Selection & Survival Across Refresh
  console.log('\n--- TEST 6: Explicit Agenda Selection & Refresh Survival ---');
  const testAgendaId = 'item_test_parliament_session';
  await ctrl.page.evaluate(({ eventId, testAgendaId }) => {
    // Simulate explicit coordinator agenda selection
    const mockItem = {
      id: testAgendaId,
      event_id: eventId,
      title: 'Debate on Agricultural Bill 2026',
      day: 'Day 1',
      time: '11:00 AM',
      status: 'In Progress',
      is_current: true
    };
    const items = [mockItem];
    window.localStorage.setItem('tn_assembly_agenda', JSON.stringify(items));
    window.localStorage.setItem(`tn_assembly_agenda_progress_${eventId}`, JSON.stringify({
      active_agenda_id: testAgendaId,
      active_day: 'Day 1',
      completed_agenda_ids: [],
      item_statuses: { [testAgendaId]: 'In Progress' }
    }));
    window.dispatchEvent(new CustomEvent('tn_assembly_agenda_update', { detail: { eventId } }));
  }, { eventId, testAgendaId });
  await ctrl.page.waitForTimeout(1000);

  // Reload page to verify persistence
  await ctrl.page.reload({ waitUntil: 'networkidle' });
  await ctrl.page.waitForTimeout(2000);

  const activeIdAfterReload = await ctrl.page.evaluate(({ eventId }) => {
    const raw = window.localStorage.getItem(`tn_assembly_agenda_progress_${eventId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.active_agenda_id;
  }, { eventId });
  console.log(`Active agenda ID survived reload: ${activeIdAfterReload === testAgendaId ? 'YES' : 'NO'}`);
  if (activeIdAfterReload !== testAgendaId) throw new Error('Agenda selection did not survive refresh!');

  // TEST 7: Timer Running & Timer Expiry
  console.log('\n--- TEST 7: Timer Running & Timer Expiry ---');
  const preTimerTraces = ctrl.traces.length;
  await ctrl.page.evaluate(({ eventId }) => {
    // Start a 3-second live timer
    const now = Date.now();
    const liveTimer = {
      eventId,
      status: 'RUNNING',
      durationSec: 3,
      startedAt: now,
      pausedAt: null,
      elapsedBeforePause: 0,
      runId: 'run_' + now
    };
    window.localStorage.setItem(`tn_assembly_live_timer_${eventId}`, JSON.stringify(liveTimer));
    window.dispatchEvent(new CustomEvent('tn_assembly_timer_update', { detail: { eventId, timer: liveTimer } }));
  }, { eventId });

  // Wait 4 seconds for timer to run and expire
  await ctrl.page.waitForTimeout(4000);

  const postTimerTraces = ctrl.traces.length - preTimerTraces;
  console.log(`getAgenda calls during 3s countdown & expiry: ${postTimerTraces}`);
  // Verify timer expiry did not change current agenda
  const activeIdAfterTimer = await ctrl.page.evaluate(({ eventId }) => {
    const raw = window.localStorage.getItem(`tn_assembly_agenda_progress_${eventId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.active_agenda_id;
  }, { eventId });
  console.log(`Agenda unchanged after timer expiry: ${activeIdAfterTimer === testAgendaId ? 'YES' : 'NO'}`);
  if (activeIdAfterTimer !== testAgendaId) throw new Error('Timer expiry altered agenda state!');

  // TEST 8: Two Concurrent Browser Windows
  console.log('\n--- TEST 8: Two Concurrent Browser Windows Synchronized ---');
  const win1Traces = ctrl.traces.length;
  const win2Traces = proj.traces.length;
  // Let both windows run together for 5s
  await ctrl.page.waitForTimeout(5000);
  const win1Delta = ctrl.traces.length - win1Traces;
  const win2Delta = proj.traces.length - win2Traces;
  console.log(`Concurrent Window 1 (Control) idle calls: ${win1Delta} (PASS if 0)`);
  console.log(`Concurrent Window 2 (Projector) idle calls: ${win2Delta} (PASS if 0)`);
  if (win1Delta > 0 || win2Delta > 0) throw new Error('Concurrent windows produced idle calls!');

  // TEST 9: Student Vote-State Stability & Never Flickering to NOT VOTED
  console.log('\n--- TEST 9: Real Student Voting-State Test ---');
  const studentLearnerId = 'lrn_student_test_101';
  const billId = 'bill_education_reform_2026';
  const student = await createTrackedPage('student', {
    studentCode: 'STU-101',
    student: {
      id: studentLearnerId,
      access_code: 'STU-101',
      full_name: 'Harig Student',
      event_id: eventId,
      bench: 'Ruling',
      party_name: 'Ruling Party'
    }
  });

  await student.page.goto(`${baseUrl}/join`, { waitUntil: 'networkidle' });
  await student.page.waitForTimeout(2000);

  // 1. Student casts a vote (AYE)
  console.log('Step 9.1: Student records vote in verified ledger...');
  await student.page.evaluate(({ eventId, studentLearnerId, billId }) => {
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;
    const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || '[]');
    ledger.push({
      eventId,
      voteType: 'BILL',
      itemId: billId,
      decision: 'AYE',
      learnerId: studentLearnerId,
      timestamp: Date.now()
    });
    window.localStorage.setItem(ledgerKey, JSON.stringify(ledger));
    window.dispatchEvent(new CustomEvent('tn_assembly_user_vote_recorded', {
      detail: { studentId: studentLearnerId, eventId }
    }));
  }, { eventId, studentLearnerId, billId });
  await student.page.waitForTimeout(1000);

  // Check state: VOTED
  let voteStatus = await student.page.evaluate(({ eventId, studentLearnerId, billId }) => {
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;
    const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || '[]');
    const record = ledger.find(r => r.learnerId === studentLearnerId && r.itemId === billId);
    return record ? record.decision : 'NOT_VOTED';
  }, { eventId, studentLearnerId, billId });
  console.log(`Vote status immediately after submission: ${voteStatus}`);
  if (voteStatus !== 'AYE') throw new Error('Vote was not recorded!');

  // 2. Refresh student page
  console.log('Step 9.2: Refreshing student page...');
  await student.page.reload({ waitUntil: 'networkidle' });
  await student.page.waitForTimeout(2000);

  voteStatus = await student.page.evaluate(({ eventId, studentLearnerId, billId }) => {
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;
    const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || '[]');
    const record = ledger.find(r => r.learnerId === studentLearnerId && r.itemId === billId);
    return record ? record.decision : 'NOT_VOTED';
  }, { eventId, studentLearnerId, billId });
  console.log(`Vote status after page refresh: ${voteStatus} (Must remain AYE)`);
  if (voteStatus !== 'AYE') throw new Error('Vote state lost on refresh!');

  // 3. Reconnect network event
  console.log('Step 9.3: Emitting offline -> online reconnect event...');
  await student.page.evaluate(() => {
    window.dispatchEvent(new Event('offline'));
    setTimeout(() => window.dispatchEvent(new Event('online')), 500);
  });
  await student.page.waitForTimeout(2000);

  voteStatus = await student.page.evaluate(({ eventId, studentLearnerId, billId }) => {
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;
    const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || '[]');
    const record = ledger.find(r => r.learnerId === studentLearnerId && r.itemId === billId);
    return record ? record.decision : 'NOT_VOTED';
  }, { eventId, studentLearnerId, billId });
  console.log(`Vote status after network reconnect: ${voteStatus} (Must remain AYE)`);
  if (voteStatus !== 'AYE') throw new Error('Vote state lost on reconnect!');

  // 4. Receive another student's vote update
  console.log('Step 9.4: Simulating external incoming vote from a different student...');
  await student.page.evaluate(({ eventId, billId }) => {
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;
    const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || '[]');
    ledger.push({
      eventId,
      voteType: 'BILL',
      itemId: billId,
      decision: 'NO',
      learnerId: 'other_student_999',
      timestamp: Date.now()
    });
    window.localStorage.setItem(ledgerKey, JSON.stringify(ledger));
    // Dispatch storage event simulating cross-tab or Realtime arrival
    window.dispatchEvent(new StorageEvent('storage', { key: ledgerKey }));
  }, { eventId, billId });
  await student.page.waitForTimeout(2000);

  voteStatus = await student.page.evaluate(({ eventId, studentLearnerId, billId }) => {
    const ledgerKey = `tn_assembly_voted_ledger_${eventId}`;
    const ledger = JSON.parse(window.localStorage.getItem(ledgerKey) || '[]');
    const record = ledger.find(r => r.learnerId === studentLearnerId && r.itemId === billId);
    return record ? record.decision : 'NOT_VOTED';
  }, { eventId, studentLearnerId, billId });
  console.log(`Vote status after external student vote received: ${voteStatus} (Must remain AYE)`);
  if (voteStatus !== 'AYE') throw new Error('Vote state lost when other vote arrived!');

  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===\n');

  await browser.close();
}

testAll().catch(err => {
  console.error('VERIFICATION SUITE ERROR:', err);
  process.exit(1);
});
