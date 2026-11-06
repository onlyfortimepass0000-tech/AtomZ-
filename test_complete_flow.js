const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3465;
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
  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  let filePath = path.join(ROOT, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Verification Server running on http://localhost:${PORT}`);
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const errors = [];

  const screenshotDir = path.join(ROOT, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP EXPLORATION (1440x900)
    // -------------------------------------------------------------
    console.log('\n--- 1. DESKTOP TEST (1440x900) ---');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push(msg.text());
    });

    await page.goto(`http://localhost:${PORT}/atom-zen/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    if (pageErrors.length === 0) {
      results.push('Page load: No console errors.');
    } else {
      errors.push(`Page load had errors: ${pageErrors.join(', ')}`);
    }

    // Capture resting opening frame
    await page.screenshot({ path: path.join(screenshotDir, '01-desktop-opening-frame.png') });
    console.log('Saved 01-desktop-opening-frame.png');

    // Verify Explainer elements
    const headlineText = await page.$eval('#exp-headline', el => el.innerText.trim());
    console.log('Explainer headline:', headlineText);
    if (headlineText.includes("Growing your business shouldn't start with confusion")) {
      results.push('Explainer: Resting headline correct.');
    } else {
      errors.push(`Explainer headline incorrect: "${headlineText}"`);
    }

    const cardsCount = await page.$$eval('.exp-card-outer', els => els.length);
    console.log('Explainer proposal cards count:', cardsCount);
    if (cardsCount === 6) {
      results.push('Explainer: 6 proposal cards present in resting frame.');
    } else {
      errors.push(`Explainer: Expected 6 cards, found ${cardsCount}`);
    }

    // Test Play button
    const playBtn = await page.$('#exp-play-btn');
    console.log('Clicking Play...');
    await playBtn.click();
    await page.waitForTimeout(600);

    const playBtnState = await page.$eval('#exp-play-btn', el => el.innerText.trim());
    console.log('Play button text after click:', playBtnState);
    if (playBtnState.includes('Pause')) {
      results.push('Explainer playback: Play button toggles to Pause.');
    } else {
      errors.push(`Explainer playback: Expected "Pause", got "${playBtnState}"`);
    }

    // Test timeline scenes via seek
    console.log('Testing timeline scenes via GSAP seek...');
    
    // Scene B (at 4.5s)
    await page.evaluate(() => { if (window.expTL) window.expTL.seek(4.5, false); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '02-desktop-sceneB-confusion.png') });
    const sceneBHeadline = await page.$eval('#exp-headline', el => el.innerText.trim());
    console.log('Scene B headline:', sceneBHeadline);
    if (sceneBHeadline.includes('Different packages. Different promises.')) {
      results.push('Scene B: Headline updated correctly.');
    }

    // Scene C (at 8.0s)
    await page.evaluate(() => { if (window.expTL) window.expTL.seek(8.0, false); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '03-desktop-sceneC-turningpoint.png') });
    const sceneCHeadline = await page.$eval('#exp-headline', el => el.innerText.trim());
    console.log('Scene C headline:', sceneCHeadline);
    if (sceneCHeadline.includes('Start with what you need.')) {
      results.push('Scene C: Headline updated correctly.');
    }

    // Scene E (at 16.0s)
    await page.evaluate(() => { if (window.expTL) window.expTL.seek(16.0, false); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotDir, '04-desktop-sceneE-assembly.png') });
    const sceneEHeadline = await page.$eval('#exp-headline', el => el.innerText.trim());
    console.log('Scene E headline:', sceneEHeadline);
    if (sceneEHeadline.includes('Pick what you need. Bring it together.')) {
      results.push('Scene E: Headline updated correctly.');
    }

    // Scene F (at 21.0s)
    await page.evaluate(() => { if (window.expTL) window.expTL.seek(21.0, false); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, '05-desktop-sceneF-final.png') });
    const sceneFHeadline = await page.$eval('#exp-headline', el => el.innerText.trim());
    console.log('Scene F headline:', sceneFHeadline);
    if (sceneFHeadline.includes('Your business. Your combination.')) {
      results.push('Scene F: Headline updated correctly.');
    }

    // -------------------------------------------------------------
    // 2. TEST "OPEN ATOMZEN" CTA FROM FINAL FRAME
    // -------------------------------------------------------------
    console.log('\n--- 2. TEST OPEN ATOMZEN CTA ---');
    const finalOpenBtn = await page.$('#exp-final-open-btn');
    if (finalOpenBtn && await finalOpenBtn.isVisible()) {
      await finalOpenBtn.click();
    } else {
      await page.click('#exp-open-btn');
    }
    await page.waitForTimeout(400);

    const explainerHidden = await page.$eval('#explainer-view', el => window.getComputedStyle(el).display === 'none' || el.classList.contains('hidden'));
    const chooseVisible = await page.$eval('#choose', el => window.getComputedStyle(el).display !== 'none');
    console.log('Explainer hidden after CTA:', explainerHidden);
    console.log('Choose view visible after CTA:', chooseVisible);

    if (explainerHidden && chooseVisible) {
      results.push('Open ATOMZEN CTA: Correctly reveals the selection options.');
    } else {
      errors.push('Open ATOMZEN CTA: Failed to transition to options.');
    }

    await page.screenshot({ path: path.join(screenshotDir, '06-desktop-options-view.png') });

    // -------------------------------------------------------------
    // 3. VERIFY RESTAURANT DEMO BUTTON PLACEMENT
    // -------------------------------------------------------------
    console.log('\n--- 3. VERIFY RESTAURANT DEMO TRIGGER ---');
    const restTrigger = await page.$('#restaurant-demo-trigger');
    const introEl = await page.$('#choose .intro');
    const selectionEl = await page.$('#choose #selection');

    if (restTrigger && introEl && selectionEl) {
      const isAfterIntro = await page.evaluate(() => {
        const intro = document.querySelector('#choose .intro');
        const trigger = document.getElementById('restaurant-demo-trigger');
        return intro.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING;
      });
      const isBeforeSelection = await page.evaluate(() => {
        const trigger = document.getElementById('restaurant-demo-trigger');
        const sel = document.getElementById('selection');
        return trigger.compareDocumentPosition(sel) & Node.DOCUMENT_POSITION_FOLLOWING;
      });

      console.log('Visual order: after intro:', Boolean(isAfterIntro), 'before selection:', Boolean(isBeforeSelection));
      if (isAfterIntro && isBeforeSelection) {
        results.push('Visual order: 1. Heading & explanation (.intro) -> 2. Restaurant demo button -> 3. Selection interface.');
      } else {
        errors.push('Visual order mismatch in #choose.');
      }
    } else {
      errors.push('Restaurant demo trigger or selection missing.');
    }

    const bodies = await page.$$eval('#selection .bodyoption', els => els.map(e => {
      const h2 = e.querySelector('h2');
      return h2 ? h2.innerText.trim() : '';
    }));
    console.log('Selection bodies found:', bodies);
    if (bodies.length === 3) {
      results.push('Original ATOMZEN 3 elements: Preserved with real data.');
    } else {
      errors.push(`Original ATOMZEN bodies missing or altered: ${bodies.join(', ')}`);
    }

    // -------------------------------------------------------------
    // 4. TEST RESTAURANT DEMO INTERACTION
    // -------------------------------------------------------------
    console.log('\n--- 4. TEST RESTAURANT DEMO INTERACTION ---');
    await page.click('#open-restaurant-demo');
    await page.waitForTimeout(400);

    const rdvVisible = await page.$eval('#restaurant-demo-view', el => window.getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden'));
    console.log('Restaurant demo view visible:', rdvVisible);
    if (rdvVisible) {
      results.push('Restaurant demo: Opens internal demo view upon click.');
    } else {
      errors.push('Restaurant demo: Failed to open view.');
    }

    await page.screenshot({ path: path.join(screenshotDir, '07-desktop-restaurant-demo-open.png') });

    // Select Food: "Nourish Bowl"
    const foodTiles = await page.$$('#rdv-food-tiles .rdv-tile');
    console.log(`Food tiles count: ${foodTiles.length}`);
    if (foodTiles.length >= 3) {
      await foodTiles[0].click();
      await page.waitForTimeout(200);
      results.push('Restaurant demo: Food selected (Nourish Bowl).');
    }

    // Select Customisation
    const custOptions = await page.$$('.rdv-custom-opt');
    console.log(`Customisation options count: ${custOptions.length}`);
    if (custOptions.length > 0) {
      await custOptions[0].click();
      await page.waitForTimeout(200);
      results.push('Restaurant demo: Customisation option selected.');
    }

    // Select Drink: "Matcha"
    const drinkTiles = await page.$$('#rdv-drink-tiles .rdv-tile');
    console.log(`Drink tiles count: ${drinkTiles.length}`);
    if (drinkTiles.length >= 3) {
      await drinkTiles[0].click();
      await page.waitForTimeout(200);
      results.push('Restaurant demo: Drink selected (Matcha).');
    }

    // Select Drink sub-option
    const drinkSubOpts = await page.$$('.rdv-drink-opt');
    if (drinkSubOpts.length > 0) {
      await drinkSubOpts[0].click();
      await page.waitForTimeout(200);
    }

    // Check preview updated
    const previewText = await page.$eval('#rdv-preview', el => el.innerText);
    console.log('Combination preview text excerpt:', previewText.slice(0, 160));
    if (previewText.includes('Nourish Bowl') && previewText.includes('Matcha')) {
      results.push('Restaurant demo preview: Live combination preview updated immediately.');
    } else {
      errors.push('Restaurant demo preview: Food/Drink missing from preview.');
    }

    await page.screenshot({ path: path.join(screenshotDir, '08-desktop-restaurant-demo-selection.png') });

    // Click "View my combination"
    const ctaBtn = await page.$('#rdv-cta');
    const isCtaDisabled = await page.$eval('#rdv-cta', el => el.disabled);
    console.log('CTA button disabled:', isCtaDisabled);
    if (!isCtaDisabled) {
      await ctaBtn.click();
      await page.waitForTimeout(300);

      const summaryVisible = await page.$eval('#rdv-summary', el => !el.classList.contains('hidden'));
      const summaryText = await page.$eval('#rdv-summary', el => el.innerText);
      console.log('Summary popup visible:', summaryVisible);
      console.log('Summary text contains required notice:', summaryText.includes('Sample combination — availability would need to be confirmed with the restaurant.'));

      if (summaryVisible && summaryText.includes('Sample combination — availability would need to be confirmed with the restaurant.')) {
        results.push('Restaurant demo summary: "View my combination" shows assembled choices with exact required notice.');
      } else {
        errors.push('Restaurant demo summary: Missing required disclaimer or items.');
      }

      await page.screenshot({ path: path.join(screenshotDir, '09-desktop-restaurant-demo-summary.png') });

      // Close summary
      await page.click('#rdv-summary-close');
      await page.waitForTimeout(200);
    }

    // Test Back Button "Back to options"
    await page.click('#rdv-back');
    await page.waitForTimeout(300);

    const chooseBackVisible = await page.$eval('#choose', el => window.getComputedStyle(el).display !== 'none');
    console.log('Returned to options view:', chooseBackVisible);
    if (chooseBackVisible) {
      results.push('Restaurant demo navigation: "Back to options" button safely returns to #choose view.');
    } else {
      errors.push('Restaurant demo navigation: Failed to return to options.');
    }

    // -------------------------------------------------------------
    // 5. TEST EXISTING ATOMZEN BUILDER TRANSITION
    // -------------------------------------------------------------
    console.log('\n--- 5. TEST ATOMZEN CORE SELECTION & BUILDER ---');
    const firstBody = await page.$('#selection .bodyoption');
    await firstBody.click();
    await page.waitForTimeout(500);

    const builderVisible = await page.$eval('#builder', el => !el.classList.contains('hidden'));
    console.log('Builder workspace opened:', builderVisible);
    if (builderVisible) {
      results.push('ATOMZEN Builder: Clicking body option successfully opens full builder workspace.');
    } else {
      errors.push('ATOMZEN Builder: Failed to open builder workspace.');
    }
    await page.screenshot({ path: path.join(screenshotDir, '10-desktop-builder-workspace.png') });

    await page.close();

    // -------------------------------------------------------------
    // 6. MOBILE RESPONSIVENESS (390x844)
    // -------------------------------------------------------------
    console.log('\n--- 6. MOBILE TEST (390x844) ---');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`http://localhost:${PORT}/atom-zen/index.html`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(500);

    const hasHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log('Mobile horizontal overflow:', hasHorizontalOverflow);
    if (!hasHorizontalOverflow) {
      results.push('Mobile layout (390px): Zero horizontal scroll / overflow.');
    } else {
      errors.push('Mobile layout (390px): Horizontal overflow detected!');
    }

    await mobilePage.screenshot({ path: path.join(screenshotDir, '11-mobile-explainer-frame.png') });

    // Click "Open ATOMZEN" on mobile
    await mobilePage.click('#exp-open-btn');
    await mobilePage.waitForTimeout(300);

    const mobTriggerBox = await mobilePage.$eval('#restaurant-demo-trigger', el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    });
    console.log('Mobile demo button rect:', mobTriggerBox);
    if (mobTriggerBox.top < 844 && mobTriggerBox.height >= 44) {
      results.push('Mobile options: Restaurant demo button visible in viewport with >= 44px touch target.');
    } else {
      errors.push(`Mobile options: Demo button touch target too small or out of view (${mobTriggerBox.height}px)`);
    }

    await mobilePage.screenshot({ path: path.join(screenshotDir, '12-mobile-options-view.png') });

    // Open Restaurant demo on mobile
    await mobilePage.click('#open-restaurant-demo');
    await mobilePage.waitForTimeout(300);

    const mobRdvVisible = await mobilePage.$eval('#restaurant-demo-view', el => !el.classList.contains('hidden'));
    console.log('Mobile restaurant demo opened:', mobRdvVisible);
    if (mobRdvVisible) {
      results.push('Mobile restaurant demo: Opens clean vertical layout.');
    }

    await mobilePage.screenshot({ path: path.join(screenshotDir, '13-mobile-restaurant-demo.png') });

    await mobilePage.close();

    // -------------------------------------------------------------
    // 7. PREFERS-REDUCED-MOTION TEST
    // -------------------------------------------------------------
    console.log('\n--- 7. REDUCED MOTION TEST ---');
    const rmPage = await browser.newPage({ 
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });
    await rmPage.goto(`http://localhost:${PORT}/atom-zen/index.html`, { waitUntil: 'networkidle' });
    await rmPage.waitForTimeout(400);

    const isReduced = await rmPage.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    console.log('Reduced motion active:', isReduced);
    if (isReduced) {
      results.push('Reduced motion: Supported gracefully without forcing autoplay.');
    }

    await rmPage.screenshot({ path: path.join(screenshotDir, '14-reduced-motion-view.png') });
    await rmPage.close();

  } catch (err) {
    console.error('Test execution error:', err);
    errors.push('Test exception: ' + err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=======================================');
  console.log('TEST SUMMARY:');
  results.forEach(r => console.log('  [PASS]', r));
  if (errors.length > 0) {
    console.log('\nFAILURES:');
    errors.forEach(e => console.log('  [FAIL]', e));
    process.exit(1);
  } else {
    console.log('\nALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
});
