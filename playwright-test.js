import { chromium } from 'playwright';

(async () => {
  // Launch browser in headless mode
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to the app root
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of the initial page
  await page.screenshot({ path: 'screenshots/initial-page.png', fullPage: true });
  console.log('Saved initial page screenshot');
  
  // Check the title/heading
  const title = await page.title();
  console.log('Page title:', title);
  
  // Look for login form - check for volunteer access code input
  const volunteerCodeInput = await page.locator('input[placeholder*="badge"], input[placeholder*="code"], input[type="text"]').first();
  const inputPlaceholder = await volunteerCodeInput.getAttribute('placeholder');
  console.log('First input placeholder:', inputPlaceholder);
  
  // Check for role-based content
  const pageText = await page.textContent('body');
  console.log('Body text (first 2000 chars):', pageText?.substring(0, 2000));
  
  // Check for Vue/React elements related to volunteer
  const volunteerElements = await page.locator('text=Volunteer, text=volunteer').all();
  console.log('Volunteer-related text elements:', volunteerElements.length);
  
  // Check for check-in related elements
  const checkInElements = await page.locator('text=Check In, text=check-in, text=PRESENT, text=ABSENT').all();
  console.log('Check-in related text elements:', checkInElements.length);
  
  // Look for dashboard/tabs
  const tabs = await page.locator('button[data-tab], .nav-tab, .pill').all();
  console.log('Tab elements:', tabs.length);
  for (const tab of tabs.slice(0, 10)) {
    const tabText = await tab.textContent();
    console.log('  Tab text:', tabText);
  }
  
  await browser.close();
  console.log('Playwright test completed');
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});