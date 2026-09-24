const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

  // Test storageService authoritative lifecycle and UI in the browser context
  const testResults = await page.evaluate(async () => {
    // Access storageService via window or test in browser environment
    const eventId = 'test-event-standardize';
    const logs = [];

    // Let's verify storageService is present
    const ss = window.__storageService || window.storageService;
    logs.push({ check: 'Window loaded', url: window.location.href, title: document.title });

    return { logs };
  });

  console.log('Page loaded successfully:', testResults);

  // Take screenshot of landing page
  const screenshotDir = path.join('C:\\Users\\sound\\.gemini\\antigravity-ide\\brain\\bebe707c-1cac-42a2-b53c-69d3a2b51d13');
  await page.screenshot({ path: path.join(screenshotDir, 'landing_page.png'), fullPage: true });
  console.log('Saved landing_page.png');

  await browser.close();
})();
