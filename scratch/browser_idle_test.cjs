const { chromium } = require('playwright');

async function run() {
  console.log('Starting Playwright browser idle test (using Microsoft Edge)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const agendaTraces = [];
  const allLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    allLogs.push(text);
    if (text.includes('[AGENDA-TRACE]')) {
      agendaTraces.push({
        time: Date.now(),
        text
      });
      console.log('Browser Trace:', text);
    }
  });

  // Set mock superadmin/coordinator auth session in localStorage so we land on control tab
  await page.addInitScript(() => {
    const sess = {
      role: 'coordinator',
      name: 'Test Coordinator',
      email: 'test@example.com',
      assigned_event_ids: ['05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8'],
      currentEventId: '05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8'
    };
    window.localStorage.setItem('tn_assembly_auth_session', JSON.stringify(sess));
  });

  console.log('Navigating to http://localhost:5179/event/05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8/control ...');
  await page.goto('http://localhost:5179/event/05fb9c3e-af0d-4b0e-b48b-1ca4c0671cb8/control', { waitUntil: 'networkidle' });

  console.log('Initial page load complete. Waiting 3 seconds for initial hydration settling...');
  await page.waitForTimeout(3000);

  const initialCount = agendaTraces.length;
  console.log(`\n--- Initial Hydration Complete ---`);
  console.log(`Initial getAgenda() calls during load: ${initialCount}`);

  console.log(`\n--- Starting 30-Second Controlled Idle Measurement ---`);
  const idleStartTime = Date.now();
  await page.waitForTimeout(30000);
  const idleEndTime = Date.now();

  const idleTraces = agendaTraces.filter(t => t.time >= idleStartTime && t.time <= idleEndTime);
  const idleCount = idleTraces.length;
  const idleDurationSec = (idleEndTime - idleStartTime) / 1000;
  const callsPerSec = idleCount / idleDurationSec;

  console.log(`\n--- 30-Second Idle Period Results ---`);
  console.log(`Idle duration: ${idleDurationSec.toFixed(1)}s`);
  console.log(`Idle getAgenda() calls: ${idleCount}`);
  console.log(`Idle call rate: ${callsPerSec.toFixed(3)} calls/sec`);

  // Test page reload
  console.log('\n--- Testing Page Reload ---');
  const preReloadCount = agendaTraces.length;
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const reloadCount = agendaTraces.length - preReloadCount;
  console.log(`getAgenda() calls during reload hydration: ${reloadCount}`);

  // Test 10s idle post-reload
  const postReloadIdleStart = Date.now();
  await page.waitForTimeout(10000);
  const postReloadIdleTraces = agendaTraces.filter(t => t.time >= postReloadIdleStart);
  console.log(`Post-reload 10s idle calls: ${postReloadIdleTraces.length}`);

  await browser.close();

  console.log('\n=== SUMMARY ===');
  console.log(`Loop eliminated: ${idleCount === 0 ? 'YES' : 'NO'}`);
  console.log(`Before fix rate: ~18-20 calls/sec`);
  console.log(`After fix rate: ${callsPerSec.toFixed(3)} calls/sec`);

  if (idleCount > 0) {
    console.error('FAIL: getAgenda was called during idle period!');
    process.exit(1);
  } else {
    console.log('SUCCESS: ZERO getAgenda calls during idle period!');
  }
}

run().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
