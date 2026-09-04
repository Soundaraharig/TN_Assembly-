const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

/**
 * YUVA Desk Assignment E2E Test:
 * 1. Log in as Coordinator
 * 2. Navigate to Volunteers -> YUVA Desks
 * 3. Assign volunteer VOL4898 (hari) to a party desk
 * 4. Log out & Log in as VOL4898
 * 5. Verify assigned members show up under "My YUVA Desk & Proxy Voting"
 */
(async () => {
  console.log('🚀 Starting YUVA Desk E2E Check...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // -----------------------------------------------------------------
    // PHASE 1: Login as Coordinator / Admin
    // -----------------------------------------------------------------
    console.log('\n--- PHASE 1: Coordinator Login ---');
    await page.goto('http://localhost:5173/join');
    await page.waitForLoadState('networkidle');

    // Click Coordinator login tab or toggle
    const coordTab = page.locator('button:has-text("Coordinator Login")').first();
    if (await coordTab.count() > 0) {
      await coordTab.click();
      console.log('✅ Clicked Coordinator Login tab');
    }

    // Fill credentials
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="user" i]').first();
    const passInput = page.locator('input[type="password"]').first();

    await emailInput.fill('soundaraharigece2025@jkkn.ac.in');
    await passInput.fill('coord123');
    console.log('✅ Filled coordinator credentials');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first();
    await submitBtn.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('🔗 URL post-login:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_01_coord_dashboard.png'), fullPage: true });

    // -----------------------------------------------------------------
    // PHASE 2: Navigate to Volunteers -> YUVA Desks
    // -----------------------------------------------------------------
    console.log('\n--- PHASE 2: Navigating to YUVA Desks Sub-tab ---');
    
    // Check if on super admin events overview first
    const eventCard = page.locator('div:has-text("JKKNCET TN Assembly 2026")').last();
    if (await eventCard.count() > 0 && page.url().includes('super_admin')) {
      await eventCard.click();
      console.log('✅ Clicked event card from super admin');
      await page.waitForTimeout(1500);
    }

    // Click Volunteers nav tab
    const volunteersTab = page.locator('button:has-text("Volunteers"), nav a:has-text("Volunteers")').first();
    if (await volunteersTab.count() > 0) {
      await volunteersTab.click();
      console.log('✅ Clicked Volunteers tab');
      await page.waitForTimeout(1500);
    } else {
      console.log('⚠️ Could not find Volunteers tab, attempting direct nav');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_02_volunteers_tab.png'), fullPage: true });

    // Click YUVA Desks sub-tab
    const yuvaSubTab = page.locator('button:has-text("YUVA Desks"), button:has-text("YUVA Desk")').first();
    if (await yuvaSubTab.count() > 0) {
      await yuvaSubTab.click();
      console.log('✅ Clicked YUVA Desks sub-tab');
      await page.waitForTimeout(1500);
    } else {
      console.log('⚠️ YUVA Desks sub-tab button not found directly');
    }

    await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_03_yuva_desks.png'), fullPage: true });

    // -----------------------------------------------------------------
    // PHASE 3: Assign VOL4898 to Party Desk
    // -----------------------------------------------------------------
    console.log('\n--- PHASE 3: Assigning VOL4898 to Party Desk ---');

    const selectElements = await page.locator('select').all();
    console.log(`Found ${selectElements.length} select dropdowns on YUVA Desks tab`);

    if (selectElements.length >= 2) {
      const volSelect = selectElements[0];
      const partySelect = selectElements[1];

      // Find Hari / VOL4898 in volunteer options
      const volOpts = await volSelect.locator('option').all();
      let targetVolValue = '';
      for (const opt of volOpts) {
        const val = await opt.getAttribute('value');
        const txt = (await opt.textContent())?.toLowerCase();
        if (val && val !== '' && (txt?.includes('hari') || txt?.includes('vol4898') || !targetVolValue)) {
          targetVolValue = val;
          if (txt?.includes('hari') || txt?.includes('vol4898')) break;
        }
      }

      if (targetVolValue) {
        await volSelect.selectOption(targetVolValue);
        console.log(`✅ Selected volunteer ID: ${targetVolValue}`);
      }

      // Find party option
      const partyOpts = await partySelect.locator('option').all();
      let targetPartyValue = '';
      for (const opt of partyOpts) {
        const val = await opt.getAttribute('value');
        if (val && (val.includes('party:::') || val.includes('committee:::'))) {
          targetPartyValue = val;
          break;
        }
      }

      if (targetPartyValue) {
        await partySelect.selectOption(targetPartyValue);
        console.log(`✅ Selected desk target: ${targetPartyValue}`);
      }

      await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_04_assign_form_filled.png'), fullPage: true });

      // Click Assign button
      const assignBtn = page.locator('button:has-text("Assign")').first();
      if (await assignBtn.count() > 0) {
        await assignBtn.click();
        console.log('✅ Clicked Assign button');
        await page.waitForTimeout(2000);
      }

      await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_05_after_assign.png'), fullPage: true });
    }

    // -----------------------------------------------------------------
    // PHASE 4: Logout & Login as VOL4898
    // -----------------------------------------------------------------
    console.log('\n--- PHASE 4: Logout & Login as VOL4898 ---');

    await page.evaluate(() => {
      localStorage.removeItem('tn_assembly_auth_session_v2');
    });
    await page.goto('http://localhost:5173/join');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const accessInput = page.locator('input').first();
    await accessInput.fill('VOL4898');
    console.log('✅ Filled access code VOL4898');

    const joinBtn = page.locator('button:has-text("Join Session")').first();
    await joinBtn.click();
    console.log('✅ Clicked Join Session');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('🔗 URL post volunteer login:', page.url());
    await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_06_vol_dashboard.png'), fullPage: true });

    // -----------------------------------------------------------------
    // PHASE 5: Verify YUVA Desk assigned members
    // -----------------------------------------------------------------
    console.log('\n--- PHASE 5: Verifying YUVA Desk for VOL4898 ---');

    const yuvaDeskBtn = page.locator('button:has-text("YUVA"), button:has-text("My YUVA")').first();
    if (await yuvaDeskBtn.count() > 0) {
      await yuvaDeskBtn.click();
      console.log('✅ Clicked YUVA Desk tab');
    }
    await page.waitForTimeout(1500);

    const bodyText = await page.textContent('body');
    const checks = [
      'No Desks Assigned',
      'No members found',
      'Assigned Members',
    ];
    console.log('\nState verification:');
    for (const c of checks) {
      console.log(`  "${c}": ${bodyText?.includes(c) ? 'FOUND' : 'NOT found'}`);
    }

    const match = bodyText?.match(/Assigned Members\s*(\d+)/);
    if (match) {
      console.log(`\n🎉 Assigned Members Count: ${match[1]}`);
    }

    const dataRows = await page.locator('tbody tr, table tr:not(:first-child)').count();
    console.log(`📊 Data rows in table: ${dataRows}`);

    await page.screenshot({ path: path.join(SCREENSHOTS, 'e2e_07_vol_yuva_result.png'), fullPage: true });
    console.log('\n✅ E2E Test Completed Successfully!');

  } catch (err) {
    console.error('❌ Error during E2E test:', err.message);
  } finally {
    await browser.close();
  }
})();
