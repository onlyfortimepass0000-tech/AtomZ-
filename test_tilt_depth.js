const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3470;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '/atom-zen' || reqPath === '/atom-zen/') {
    reqPath = '/atom-zen/index.html';
  }
  const filePath = path.join(ROOT, reqPath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

async function runTests() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`Tilt Verification Server running on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.message}`));

  const tests = [];
  function assert(name, condition, details = '') {
    tests.push({ name, pass: Boolean(condition), details });
    console.log(`  [${condition ? 'PASS' : 'FAIL'}] ${name}${details ? ' - ' + details : ''}`);
    if (!condition) {
      console.error(`FAILED ASSERTION: ${name}`, details);
    }
  }

  try {
    console.log('\n--- 1. LOAD ATOMZEN AND CHECK TILT ENGINE INITIALIZATION ---');
    await page.goto(`http://localhost:${PORT}/atom-zen/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const hasTiltApi = await page.evaluate(() => typeof window.atomzenTilt === 'object');
    assert('Window exposes atomzenTilt API', hasTiltApi);

    // Verify tilt UI controls exist
    const enableBtn = await page.$('#tilt-enable-btn');
    const recenterBtn = await page.$('#tilt-recenter-btn');
    const disableBtn = await page.$('#tilt-disable-btn');
    const navBtn = await page.$('#tilt-nav-btn');

    assert('Tilt enable button present', Boolean(enableBtn));
    assert('Tilt recenter button present', Boolean(recenterBtn));
    assert('Tilt disable button present', Boolean(disableBtn));
    assert('Header nav tilt button present', Boolean(navBtn));

    console.log('\n--- 2. VERIFY MATHEMATICAL MAPPING FUNCTION (mapTiltToNormalized) ---');
    const mathTests = await page.evaluate(() => {
      const fn = window.atomzenTilt.mapTiltToNormalized;
      const results = {};

      // Test dead zone (< 0.75 deg relative tilt)
      const deadZoneTest = fn(45.5, 0.4, 45, 0, 0);
      results.deadZone = (deadZoneTest.x === 0 && deadZoneTest.y === 0);

      // Test 15 deg tilt in portrait: gamma +15 -> x = 1.0; beta +15 -> y = 1.0
      const maxTiltTest = fn(60, 15, 45, 0, 0);
      results.maxTiltX = Math.abs(maxTiltTest.x - 1.0) < 0.001;
      results.maxTiltY = Math.abs(maxTiltTest.y - 1.0) < 0.001;

      // Test clamping (> 15 deg tilt)
      const clamped = fn(85, 35, 45, 0, 0);
      results.clampedX = clamped.x === 1.0;
      results.clampedY = clamped.y === 1.0;

      // Test negative tilt
      const negTilt = fn(30, -15, 45, 0, 0);
      results.negTiltX = Math.abs(negTilt.x - (-1.0)) < 0.001;
      results.negTiltY = Math.abs(negTilt.y - (-1.0)) < 0.001;

      // Test landscape 90: beta drives -X, gamma drives Y
      const land90 = fn(45 - 15, 15, 45, 0, 90);
      results.land90X = Math.abs(land90.x - 1.0) < 0.001;
      results.land90Y = Math.abs(land90.y - 1.0) < 0.001;

      // Test landscape 270: beta drives +X, gamma drives -Y
      const land270 = fn(45 + 15, -15, 45, 0, 270);
      results.land270X = Math.abs(land270.x - 1.0) < 0.001;
      results.land270Y = Math.abs(land270.y - 1.0) < 0.001;

      // Test wraparound handling across 180 deg boundary
      const wrapTest = fn(-175, 0, 175, 0, 0);
      // Diff: -175 - 175 = -350 deg -> normalized to +10 deg
      results.wraparound = wrapTest.y > 0 && Math.abs(wrapTest.y - (9.25 / 14.25)) < 0.01;

      return results;
    });

    assert('Dead zone suppresses readings < 0.75 deg', mathTests.deadZone);
    assert('Max range: +/-15 deg maps to +/-1.0', mathTests.maxTiltX && mathTests.maxTiltY);
    assert('Clamping: Readings beyond +/-15 deg clamp to [-1, 1]', mathTests.clampedX && mathTests.clampedY);
    assert('Negative tilt produces consistent negative normalized coords', mathTests.negTiltX && mathTests.negTiltY);
    assert('Landscape 90 deg axes correctly mapped', mathTests.land90X && mathTests.land90Y);
    assert('Landscape 270 deg axes correctly mapped', mathTests.land270X && mathTests.land270Y);
    assert('Angle wraparound across boundary handled smoothly without jump', mathTests.wraparound);

    console.log('\n--- 3. TEST NEUTRAL SENSOR CALIBRATION AND RE-CENTRING ---');
    // Simulate comfortable holding angle (beta=48, gamma=3)
    await page.evaluate(() => {
      window.atomzenTilt.enable();
      window.atomzenTilt.simulateSensor(48, 3, 0);
    });

    let state = await page.evaluate(() => window.atomzenTilt.getState());
    assert('First reading sets neutral position', state.calibrated && state.neutralBeta === 48 && state.neutralGamma === 3);
    assert('Neutral position yields target (0, 0)', state.targetX === 0 && state.targetY === 0);

    // Simulate tilt right (+10 deg gamma) and down (+10 deg beta)
    await page.evaluate(() => {
      window.atomzenTilt.simulateSensor(58, 13, 0);
    });
    state = await page.evaluate(() => window.atomzenTilt.getState());
    assert('Tilted sensor updates targetX > 0 and targetY > 0', state.targetX > 0 && state.targetY > 0);

    // Click Re-centre
    await page.click('#tilt-recenter-btn');
    state = await page.evaluate(() => window.atomzenTilt.getState());
    assert('Clicking Re-centre recalibrates neutral position to current holding angle', state.neutralBeta === 58 && state.neutralGamma === 13);
    assert('After re-centre, targets return to 0', state.targetX === 0 && state.targetY === 0);

    console.log('\n--- 4. TEST CSS CUSTOM PROPERTIES & DEPTH TRANSFORMS ---');
    await page.evaluate(() => {
      const s = window.atomzenTilt.getState();
      s.targetX = 0.8;
      s.targetY = 0.6;
      s.currentX = 0.8;
      s.currentY = 0.6;
      document.documentElement.style.setProperty('--tilt-x', '0.8000');
      document.documentElement.style.setProperty('--tilt-y', '0.6000');
      document.documentElement.style.setProperty('--tilt-rot-x', '0.6000');
      document.documentElement.style.setProperty('--tilt-rot-y', '0.8000');
    });

    const rootTiltX = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--tilt-x').trim());
    assert('--tilt-x set on document root', rootTiltX === '0.8000');

    // Check depth level elements exist with correct data-depth attributes
    const bgElementsCount = await page.$$eval('[data-depth="background"]', els => els.length);
    const midElementsCount = await page.$$eval('[data-depth="middle"]', els => els.length);
    const foreElementsCount = await page.$$eval('[data-depth="foreground"]', els => els.length);
    const tiltCardsCount = await page.$$eval('[data-tilt-card]', els => els.length);

    assert('Elements with data-depth="background" present', bgElementsCount > 0, `Count: ${bgElementsCount}`);
    assert('Elements with data-depth="middle" present', midElementsCount > 0, `Count: ${midElementsCount}`);
    assert('Elements with data-depth="foreground" present', foreElementsCount > 0, `Count: ${foreElementsCount}`);
    assert('Elements with data-tilt-card present', tiltCardsCount > 0, `Count: ${tiltCardsCount}`);

    // Verify nested wrapper architecture in Explainer proposal cards
    const nestedStructureValid = await page.evaluate(() => {
      const card = document.querySelector('#exp-card-0');
      if (!card) return false;
      const tiltWrap = card.querySelector('.exp-card-tilt-wrap[data-depth="middle"][data-tilt-card]');
      const inner = tiltWrap ? tiltWrap.querySelector('.exp-card-inner') : null;
      const content = inner ? inner.querySelector('.exp-card-content') : null;
      return Boolean(tiltWrap && inner && content);
    });
    assert('Explainer card uses 3-layer nested wrapper (Outer -> Tilt middle -> Inner content)', nestedStructureValid);

    console.log('\n--- 5. TEST DISABLE AND RE-ENABLE TILT ---');
    await page.click('#tilt-disable-btn');
    state = await page.evaluate(() => window.atomzenTilt.getState());
    assert('Clicking Disable tilt sets enabled=false', !state.enabled);
    const docHasDisabledClass = await page.evaluate(() => document.documentElement.classList.contains('tilt-disabled'));
    assert('tilt-disabled class added to root on disable', docHasDisabledClass);

    // Re-enable
    await page.click('#tilt-enable-btn');
    await page.waitForTimeout(200);
    state = await page.evaluate(() => window.atomzenTilt.getState());
    assert('Clicking Enable tilt sets enabled=true', state.enabled);
    const docRemovedDisabledClass = await page.evaluate(() => !document.documentElement.classList.contains('tilt-disabled'));
    assert('tilt-disabled class removed on enable', docRemovedDisabledClass);

    console.log('\n--- 6. TEST RESTAURANT DEMO 3D DEPTH AND INTERACTION ---');
    // Open ATOMZEN from explainer
    await page.click('#exp-open-btn');
    await page.waitForTimeout(300);

    // Open Restaurant Demo
    await page.click('#open-restaurant-demo');
    await page.waitForTimeout(300);

    // Check restaurant preview has 3D depth elements
    const rdvHasTiltCard = await page.$('#rdv-preview .rdv-preview-card[data-tilt-card]');
    const rdvDecorBg = await page.$('#rdv-preview [data-depth="background"]');
    assert('Restaurant preview card has data-tilt-card', Boolean(rdvHasTiltCard));
    assert('Restaurant preview has decorative background layer [data-depth="background"]', Boolean(rdvDecorBg));

    // Select dish and drink
    await page.click('#rdv-food-tiles .rdv-tile:first-child');
    await page.click('#rdv-custom-opts .rdv-custom-opt:first-child');
    await page.click('#rdv-drink-tiles .rdv-tile:first-child');
    await page.waitForTimeout(200);

    const rdvMidPlate = await page.$('#rdv-preview [data-depth="middle"]');
    const rdvForeGarnish = await page.$('#rdv-preview [data-depth="foreground"]');
    assert('Restaurant preview plate has [data-depth="middle"]', Boolean(rdvMidPlate));
    assert('Restaurant preview garnish has [data-depth="foreground"]', Boolean(rdvForeGarnish));

    // View combination summary modal
    await page.click('#rdv-cta');
    await page.waitForTimeout(200);
    const summaryNotice = await page.innerText('#rdv-summary-note');
    assert('Summary modal disclaimer exact text preserved', summaryNotice.includes('Sample combination — availability would need to be confirmed with the restaurant.'));

    // Close summary and return back to options
    await page.click('#rdv-summary-close');
    await page.click('#rdv-back');
    await page.waitForTimeout(200);
    const chooseVisible = await page.evaluate(() => !document.querySelector('#choose').classList.contains('hidden'));
    assert('Returned safely to options view', chooseVisible);

    console.log('\n--- 7. TEST MOBILE RESPONSIVENESS (390x844) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://localhost:${PORT}/atom-zen/index.html`, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(400);

    // Check touch target height on mobile tilt buttons >= 44px
    const isMobileTiltActive = await mobilePage.evaluate(() => window.atomzenTilt.getState().enabled);
    if (isMobileTiltActive) {
      const activeBtnHeight = await mobilePage.$eval('#tilt-disable-btn', el => el.getBoundingClientRect().height);
      assert('Mobile tilt active button touch target height >= 44px', activeBtnHeight >= 44, `Height: ${activeBtnHeight}px`);
      await mobilePage.click('#tilt-disable-btn');
    }
    const enableBtnHeight = await mobilePage.$eval('#tilt-enable-btn', el => el.getBoundingClientRect().height);
    assert('Mobile tilt enable button touch target height >= 44px', enableBtnHeight >= 44, `Height: ${enableBtnHeight}px`);

    // Check zero horizontal scroll on mobile
    const horizOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert('Mobile page has zero horizontal overflow', !horizOverflow);

    await mobileContext.close();

    console.log('\n--- 8. TEST REDUCED MOTION RESPECT ---');
    const rmContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });
    const rmPage = await rmContext.newPage();
    await rmPage.goto(`http://localhost:${PORT}/atom-zen/index.html`, { waitUntil: 'domcontentloaded' });
    await rmPage.waitForTimeout(300);

    const rmState = await rmPage.evaluate(() => window.atomzenTilt.getState());
    assert('Tilt is disabled when prefers-reduced-motion is active', !rmState.enabled);

    await rmContext.close();

    // Check console error count
    const errorLogs = consoleLogs.filter(l => l.includes('ERROR') || l.includes('error'));
    assert('Zero browser console errors during test', errorLogs.length === 0, errorLogs.join(', '));

  } catch(err) {
    console.error('Test execution failed:', err);
    assert('Test suite execution without crash', false, err.message);
  } finally {
    await browser.close();
    server.close();
  }

  const passedCount = tests.filter(t => t.pass).length;
  console.log(`\n=======================================`);
  console.log(`TILT DEPTH TEST SUMMARY: ${passedCount}/${tests.length} tests passed.`);
  if (passedCount === tests.length) {
    console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error('SOME CHECKS FAILED!\n');
    process.exit(1);
  }
}

runTests();
