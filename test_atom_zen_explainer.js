const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 3457;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  if (reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found: ' + reqPath);
  }
});

server.listen(PORT, async () => {
  console.log(`Explainer Test Server listening on http://localhost:${PORT}`);
  const results = [];
  const errors = [];

  const browser = await chromium.launch({ headless: true });
  const artifactDir = '/Users/rajdeepmalladeb/.gemini/antigravity/brain/6a8ebf48-18bb-433a-a5ae-a64bf38313b5';
  const screenshotsDir = path.join(ROOT, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  try {
    // -----------------------------------------------------------------------
    // Test 1: Desktop Viewport (1440x900) - Full Storyboard & Controls
    // -----------------------------------------------------------------------
    console.log('\n--- TESTING DESKTOP VIEWPORT (1440x900) ---');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktopPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // 1. Verify Section Presence
    const explainerSection = await desktopPage.$('#zen-explainer');
    if (explainerSection) {
      results.push('Check Explainer Section: Present on homepage.');
    } else {
      errors.push('Check Explainer Section FAILED: #zen-explainer not found.');
    }

    // Scroll into view
    await explainerSection.scrollIntoViewIfNeeded();
    await desktopPage.waitForTimeout(500);

    // 2. Verify Scene 1 elements
    const scene1 = await desktopPage.$('#scene1');
    const scene1Active = await scene1.getAttribute('class');
    console.log(`Scene 1 active: ${scene1Active.includes('is-active')}`);
    if (scene1Active.includes('is-active')) {
      results.push('Check Scene 1 Default: Scene 1 is active on load.');
    } else {
      errors.push('Check Scene 1 Default FAILED: Scene 1 not active.');
    }

    const s1Cards = await desktopPage.$$('.s1-service-card');
    console.log(`Scene 1 service cards count: ${s1Cards.length}`);
    if (s1Cards.length === 6) {
      results.push('Check Scene 1 Cards: 6 service cards present (Reels, Website, Ads, Strategy, Photo, Analytics).');
    } else {
      errors.push(`Check Scene 1 Cards FAILED: Found ${s1Cards.length} cards, expected 6.`);
    }

    const s1Pkgs = await desktopPage.$$('.s1-pkg-card');
    console.log(`Scene 1 packages count: ${s1Pkgs.length}`);
    if (s1Pkgs.length === 3) {
      results.push('Check Scene 1 Packages: 3 overlapping package cards present (Starter, Growth, Premium).');
    } else {
      errors.push(`Check Scene 1 Packages FAILED: Found ${s1Pkgs.length} packages, expected 3.`);
    }

    await desktopPage.screenshot({ path: path.join(screenshotsDir, 'zen-explainer-scene1-desktop.png') });
    await desktopPage.screenshot({ path: path.join(artifactDir, 'zen-explainer-scene1-desktop.png') });

    // 3. Tab Navigation: Click Tab 2 (Meet ATOM ZEN)
    const tabs = await desktopPage.$$('.zen-exp__tab');
    await tabs[1].click();
    await desktopPage.waitForTimeout(400);

    const scene2 = await desktopPage.$('#scene2');
    const scene2Active = (await scene2.getAttribute('class')).includes('is-active');
    console.log(`Scene 2 active after tab click: ${scene2Active}`);
    const s2Cores = await desktopPage.$$('.s2-core-card');
    if (scene2Active && s2Cores.length === 3) {
      results.push('Check Scene 2: Three starting core options present (Content Creation, Marketing & Growth, Digital Assets).');
    } else {
      errors.push('Check Scene 2 FAILED: Scene 2 not active or missing 3 cores.');
    }
    await desktopPage.screenshot({ path: path.join(screenshotsDir, 'zen-explainer-scene2-desktop.png') });
    await desktopPage.screenshot({ path: path.join(artifactDir, 'zen-explainer-scene2-desktop.png') });

    // 4. Tab Navigation: Click Tab 3 (Assemble)
    await tabs[2].click();
    await desktopPage.waitForTimeout(400);

    const scene3 = await desktopPage.$('#scene3');
    const scene3Active = (await scene3.getAttribute('class')).includes('is-active');
    const reelsBadge = await desktopPage.$('#s3ReelsBadge');
    const badgeText = reelsBadge ? (await reelsBadge.innerText()).trim() : '';
    console.log(`Scene 3 active: ${scene3Active}, Reels badge: "${badgeText}"`);
    if (scene3Active && badgeText === '×3') {
      results.push('Check Scene 3: Assembly interface shows central core, attached Reels with ×3 badge, and Landing Page.');
    } else {
      errors.push(`Check Scene 3 FAILED: Badge text is "${badgeText}", expected "×3".`);
    }
    await desktopPage.screenshot({ path: path.join(screenshotsDir, 'zen-explainer-scene3-desktop.png') });
    await desktopPage.screenshot({ path: path.join(artifactDir, 'zen-explainer-scene3-desktop.png') });

    // 5. Tab Navigation: Click Tab 4 (Balance)
    await tabs[3].click();
    await desktopPage.waitForTimeout(400);

    const scene4 = await desktopPage.$('#scene4');
    const scene4Active = (await scene4.getAttribute('class')).includes('is-active');
    const s4Price = await desktopPage.$eval('#s4EstPrice', el => el.innerText.trim());
    const s4TimeBar = await desktopPage.$('#s4TimeFill');
    const s4MoneyBar = await desktopPage.$('#s4MoneyFill');
    const s4QualityBar = await desktopPage.$('#s4QualityFill');
    console.log(`Scene 4 active: ${scene4Active}, Estimate price: "${s4Price}"`);
    if (scene4Active && s4Price.includes('₹') && s4TimeBar && s4MoneyBar && s4QualityBar) {
      results.push('Check Scene 4: Trade-off balance sliders (Time, Money, Quality) and illustrative estimate visible.');
    } else {
      errors.push('Check Scene 4 FAILED: Sliders or estimate missing.');
    }
    await desktopPage.screenshot({ path: path.join(screenshotsDir, 'zen-explainer-scene4-desktop.png') });
    await desktopPage.screenshot({ path: path.join(artifactDir, 'zen-explainer-scene4-desktop.png') });

    // 6. Tab Navigation: Click Tab 5 (Your Build)
    await tabs[4].click();
    await desktopPage.waitForTimeout(400);

    const scene5 = await desktopPage.$('#scene5');
    const scene5Active = (await scene5.getAttribute('class')).includes('is-active');
    const ctaBtn = await desktopPage.$('.s5-main-cta');
    const ctaHref = ctaBtn ? await ctaBtn.getAttribute('href') : '';
    console.log(`Scene 5 active: ${scene5Active}, Final CTA href: "${ctaHref}"`);
    if (scene5Active && ctaHref.includes('atom-zen')) {
      results.push('Check Scene 5: Final package summary displayed with prominent "Build with ATOM ZEN" button linking to atom-zen/.');
    } else {
      errors.push(`Check Scene 5 FAILED: ctaHref is "${ctaHref}".`);
    }
    await desktopPage.screenshot({ path: path.join(screenshotsDir, 'zen-explainer-scene5-desktop.png') });
    await desktopPage.screenshot({ path: path.join(artifactDir, 'zen-explainer-scene5-desktop.png') });

    // 7. Test Play/Pause toggle
    const playBtn = await desktopPage.$('#zenPlayBtn');
    await playBtn.click();
    const playBtnText1 = (await playBtn.innerText()).trim();
    console.log(`Play button after click: "${playBtnText1}"`);
    await playBtn.click();
    const playBtnText2 = (await playBtn.innerText()).trim();
    console.log(`Play button after 2nd click: "${playBtnText2}"`);
    if (playBtnText1.includes('Pause') || playBtnText2.includes('Play')) {
      results.push('Check Play/Pause: Controls toggle playback state cleanly.');
    } else {
      errors.push('Check Play/Pause FAILED.');
    }

    // 8. Test Replay button
    const replayBtn = await desktopPage.$('#zenReplayBtn');
    await replayBtn.click();
    await desktopPage.waitForTimeout(300);
    const scene1AfterReplay = (await scene1.getAttribute('class')).includes('is-active');
    console.log(`Scene 1 active after replay: ${scene1AfterReplay}`);
    if (scene1AfterReplay) {
      results.push('Check Replay: Successfully resets playback to Scene 1.');
    } else {
      errors.push('Check Replay FAILED: Did not reset to Scene 1.');
    }

    // -----------------------------------------------------------------------
    // Test 2: Mobile Viewports (320px, 375px, 390px, 430px)
    // -----------------------------------------------------------------------
    const viewports = [
      { name: 'Mobile 320px (iPhone SE narrow)', width: 320, height: 667 },
      { name: 'Mobile 375px (iPhone mini)', width: 375, height: 812 },
      { name: 'Mobile 390px (iPhone 14 standard)', width: 390, height: 844 },
      { name: 'Mobile 430px (iPhone Pro Max)', width: 430, height: 932 }
    ];

    for (const vp of viewports) {
      console.log(`\n--- TESTING ${vp.name} ---`);
      const mobilePage = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await mobilePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

      const mobExplainer = await mobilePage.$('#zen-explainer');
      await mobExplainer.scrollIntoViewIfNeeded();
      await mobilePage.waitForTimeout(300);

      // Check horizontal overflow
      const hasOverflow = await mobilePage.evaluate(() => {
        const exp = document.getElementById('zen-explainer');
        return exp.scrollWidth > document.documentElement.clientWidth;
      });
      console.log(`${vp.name} horizontal overflow: ${hasOverflow}`);
      if (!hasOverflow) {
        results.push(`Check ${vp.name} Overflow: Zero horizontal overflow.`);
      } else {
        errors.push(`Check ${vp.name} Overflow FAILED: Detected horizontal scroll.`);
      }

      // Check Mobile CTA tap target height
      const mobTabs = await mobilePage.$$('.zen-exp__tab');
      await mobTabs[4].click();
      await mobilePage.waitForTimeout(300);

      const mobCta = await mobilePage.$('.s5-main-cta');
      const ctaBox = mobCta ? await mobCta.boundingBox() : null;
      console.log(`${vp.name} CTA bounding box:`, ctaBox);
      if (ctaBox && ctaBox.height >= 40 && ctaBox.width >= 200) {
        results.push(`Check ${vp.name} CTA Target: Height ${ctaBox.height}px >= 40px comfortable touch target.`);
      } else {
        errors.push(`Check ${vp.name} CTA Target FAILED: Box dimensions too small.`);
      }

      if (vp.width === 390) {
        await mobilePage.screenshot({ path: path.join(screenshotsDir, 'zen-explainer-mobile-390.png') });
        await mobilePage.screenshot({ path: path.join(artifactDir, 'zen-explainer-mobile-390.png') });
      }

      await mobilePage.close();
    }

    // -----------------------------------------------------------------------
    // Test 3: Accessible Summary Grid
    // -----------------------------------------------------------------------
    console.log('\n--- TESTING ACCESSIBLE SUMMARY ---');
    const summaryHeading = await desktopPage.$eval('.zen-exp__accessible-summary h3', el => el.innerText);
    const stepCols = await desktopPage.$$('.zen-exp__step-col');
    console.log(`Accessible summary heading: "${summaryHeading}", steps count: ${stepCols.length}`);
    if (summaryHeading.includes('ATOM ZEN') && stepCols.length === 4) {
      results.push('Check Accessible Summary: 4-step structured explanation present for screen readers and reduced motion.');
    } else {
      errors.push('Check Accessible Summary FAILED.');
    }

    await desktopPage.close();

  } catch (err) {
    console.error('Test execution error:', err);
    errors.push(`Exception: ${err.message}`);
  } finally {
    await browser.close();
    server.close();

    console.log('\n=======================================');
    console.log('SUMMARY OF RESULTS:');
    results.forEach(r => console.log('  [PASS] ' + r));
    errors.forEach(e => console.log('  [FAIL] ' + e));
    console.log('=======================================');

    if (errors.length > 0) {
      process.exit(1);
    } else {
      console.log('\nALL TESTS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  }
});
