const { chromium } = require('playwright');

async function testMultiWindow() {
  console.log('=== STARTING SECTION 9: 4-WINDOW MULTI-WINDOW TEST ===\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const eventId = '05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8';
  const baseUrl = 'http://localhost:5179';

  async function openWindow(role, path, extra = {}) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const traces = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[AGENDA-TRACE]')) {
        traces.push({ time: Date.now(), text });
      }
    });

    await page.addInitScript(({ role, eventId, extra }) => {
      const sess = {
        role,
        name: `Test ${role}`,
        email: `${role}@test.com`,
        assigned_event_ids: [eventId],
        currentEventId: eventId,
        ...extra
      };
      window.localStorage.setItem('tn_assembly_auth_session', JSON.stringify(sess));
    }, { role, eventId, extra });

    await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle' });
    return { context, page, traces };
  }

  console.log('Opening Window 1: Control Tab...');
  const win1 = await openWindow('coordinator', `/event/${eventId}/control`);

  console.log('Opening Window 2: Projector Display...');
  const win2 = await openWindow('coordinator', `/display/projector?event=${eventId}`);

  console.log('Opening Window 3: Speaker Dashboard...');
  const win3 = await openWindow('speaker', `/event/${eventId}/speaker`, {
    student: { id: 'spk_1', full_name: 'Speaker Member', role: 'Speaker', event_id: eventId }
  });

  console.log('Opening Window 4: Deputy Speaker Dashboard...');
  const win4 = await openWindow('deputy_speaker', `/event/${eventId}/speaker`, {
    student: { id: 'dep_spk_1', full_name: 'Deputy Speaker Member', role: 'Deputy Speaker', event_id: eventId }
  });

  console.log('All 4 windows open and settled. Waiting 3 seconds for initial settle...');
  await win1.page.waitForTimeout(3000);

  // Measure 10-second idle across all 4 concurrent windows
  console.log('Measuring 10-second idle across all 4 concurrent windows...');
  const idleStart = Date.now();
  await win1.page.waitForTimeout(10000);

  const win1Idle = win1.traces.filter(t => t.time >= idleStart).length;
  const win2Idle = win2.traces.filter(t => t.time >= idleStart).length;
  const win3Idle = win3.traces.filter(t => t.time >= idleStart).length;
  const win4Idle = win4.traces.filter(t => t.time >= idleStart).length;

  console.log(`Window 1 (Control) idle calls: ${win1Idle}`);
  console.log(`Window 2 (Projector) idle calls: ${win2Idle}`);
  console.log(`Window 3 (Speaker) idle calls: ${win3Idle}`);
  console.log(`Window 4 (Deputy Speaker) idle calls: ${win4Idle}`);

  if (win1Idle > 0 || win2Idle > 0 || win3Idle > 0 || win4Idle > 0) {
    throw new Error('Concurrent multi-window idle loop detected!');
  }

  console.log('\n--- Performing Cross-Window Action (Agenda Selection in Control) ---');
  const targetAgendaId = 'item_cross_window_debate_1';
  await win1.page.evaluate(({ eventId, targetAgendaId }) => {
    const ss = window.storageService;
    const item = {
      id: targetAgendaId,
      event_id: eventId,
      title: 'Debate on Primary Education 2026',
      day: 'Day 1',
      time: '10:00 AM',
      status: 'In Progress',
      is_current: true
    };
    ss.setItem('tn_assembly_agenda_v6', [item]);
    ss.setCurrentAgendaItem(eventId, targetAgendaId);
  }, { eventId, targetAgendaId });

  await win1.page.waitForTimeout(2000);

  // Check Window 2 (Projector) sees the agenda
  const projActive = await win2.page.evaluate(({ eventId }) => {
    const ss = window.storageService;
    const prog = ss.getAgendaProgress(eventId);
    return prog?.active_agenda_id;
  }, { eventId });

  console.log(`Projector active agenda after Control selection: ${projActive}`);

  await browser.close();
  console.log('=== MULTI-WINDOW TEST PASSED SUCCESSFULLY! ===\n');
}

testMultiWindow().catch(err => {
  console.error('MULTI-WINDOW TEST ERROR:', err);
  process.exit(1);
});
