const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8089;

// Simple static server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.xml': 'application/xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  let filePath = path.join(ROOT_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

async function runVerification() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      results.push({ message, pass: true });
    } else {
      console.error(`  FAIL: ${message}`);
      results.push({ message, pass: false });
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Truth and Safety
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Truth & Safety ---');
    await page.goto(`http://localhost:${PORT}/horizon-preview.html`);
    const horizonTitle = await page.title();
    assert(horizonTitle.includes('Preview'), 'Horizon title contains Preview label');
    const horizonContent = await page.content();
    assert(!horizonContent.includes('Live Virality Engine: Active'), 'No fake live virality engine claim');
    assert(!horizonContent.includes('1.73M+ views'), 'No fake views claims');

    await page.goto(`http://localhost:${PORT}/horizon-113.html`);
    const h113Content = await page.content();
    assert(!h113Content.includes('Guaranteed Reach'), 'No guaranteed reach claims in horizon-113');

    await page.goto(`http://localhost:${PORT}/aroha.html`);
    const arohaContent = await page.content();
    assert(!arohaContent.includes('guaranteed payment milestones'), 'No guaranteed payment claims in aroha');

    // -------------------------------------------------------------------------
    // TEST 2: Header and Navigation (Desktop 1440px)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Header and Navigation (Desktop 1440px) ---');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForLoadState('networkidle');

    // Pre-test intro screen dismiss if present
    const introOverlay = await page.$('#introLoaderOverlay');
    if (introOverlay) {
      await page.evaluate(() => {
        const ov = document.getElementById('introLoaderOverlay');
        if (ov) ov.remove();
      });
    }

    const navLinks = await page.$$eval('.nav__links a', (links) =>
      links.map((l) => ({ text: l.textContent.trim(), href: l.getAttribute('href') }))
    );
    console.log('  Nav links found:', navLinks);
    assert(navLinks.some((l) => l.text.includes('Services')), 'Services link present');
    assert(navLinks.some((l) => l.text.includes('Client Portal')), 'Client Portal link present in nav');
    assert(navLinks.some((l) => l.text.includes('ATOM ZEN')), 'ATOM ZEN link present in nav');
    assert(navLinks.some((l) => l.text.includes('Writing')), 'Writing link present in nav');
    assert(!navLinks.some((l) => l.text.includes('Tools')), 'Tools link removed from nav');
    assert(!navLinks.some((l) => l.text.includes('Contact')), 'Contact link removed from header nav');

    // Check WhatsApp CTA in header
    const navCta = await page.$('.nav__cta');
    assert(navCta !== null, 'Nav WhatsApp CTA present');

    // -------------------------------------------------------------------------
    // TEST 2b: Header on Mobile Breakpoints (320px, 360px, 390px, 430px)
    // -------------------------------------------------------------------------
    console.log('\n--- 2b. Testing Mobile Header & Touch Targets (320, 360, 390, 430px) ---');
    const mobileWidths = [320, 360, 390, 430];
    for (const w of mobileWidths) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.waitForTimeout(200);

      const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert(!hasHorizontalScroll, `No horizontal scroll at ${w}px width`);

      const toggleBox = await page.locator('.theme-toggle').boundingBox();
      const menuBtnBox = await page.locator('.mobile-menu-btn').boundingBox();
      assert(toggleBox && toggleBox.width >= 44 && toggleBox.height >= 44, `Theme toggle is >= 44x44px at ${w}px (got ${Math.round(toggleBox?.width || 0)}x${Math.round(toggleBox?.height || 0)})`);
      assert(menuBtnBox && menuBtnBox.width >= 44 && menuBtnBox.height >= 44, `Mobile menu button is >= 44x44px at ${w}px (got ${Math.round(menuBtnBox?.width || 0)}x${Math.round(menuBtnBox?.height || 0)})`);

      // Check no collision between brand and buttons
      const brandBox = await page.locator('.brand').boundingBox();
      assert(brandBox && toggleBox && brandBox.x + brandBox.width <= toggleBox.x, `Zero overlap between brand and toggle at ${w}px`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Hero Logo Transformation Animation
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Hero Logo Transformation ---');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/`);
    await page.evaluate(() => {
      const ov = document.getElementById('introLoaderOverlay');
      if (ov) ov.remove();
    });

    const motif = await page.$('#heroSculptedMotif');
    assert(motif !== null, 'Hero sculpted motif element exists');

    // Wait 1.5s for transformation timer to fire
    await page.waitForTimeout(1500);
    const isTransformed = await page.$eval('#heroSculptedMotif', (el) => el.classList.contains('is-transformed'));
    assert(isTransformed, 'Hero motif receives is-transformed class after delay');

    // -------------------------------------------------------------------------
    // TEST 4: "What We Do" Section (3 Cards)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing What We Do (3-card grid) ---');
    const svcCards = await page.$$eval('.svc-card', (cards) =>
      cards.map((c) => ({
        title: c.querySelector('.svc-card__title')?.textContent?.trim(),
        outcome: c.querySelector('.svc-card__outcome')?.textContent?.trim(),
        href: c.querySelector('.svc-card__btn')?.getAttribute('href')
      }))
    );
    assert(svcCards.length === 3, `Exactly 3 service cards found (got ${svcCards.length})`);
    assert(svcCards[0].title.includes('Email automation'), 'Card 1 is Email automation');
    assert(svcCards[1].title.includes('Physical footfall booster'), 'Card 2 is Physical footfall booster');
    assert(svcCards[2].title.includes('Digital assets'), 'Card 3 is Digital assets');
    assert(svcCards[0].href.includes('Email%20automation'), 'Card 1 has custom prefilled WhatsApp message');
    assert(svcCards[1].href.includes('Footfall'), 'Card 2 has custom prefilled WhatsApp message');
    assert(svcCards[2].href.includes('Digital%20Asset'), 'Card 3 has custom prefilled WhatsApp message');

    const customNote = await page.$('.svc-custom-note');
    assert(customNote !== null, 'Custom note "We build around what your business needs" exists');
    const secondaryLink = await page.$('.svc-secondary-link');
    assert(secondaryLink !== null, 'Secondary link "Reels and content for local businesses" exists');

    // -------------------------------------------------------------------------
    // TEST 5: Proof & Testimonials Section
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Proof & Testimonials ---');
    const proofSection = await page.$('#proof');
    assert(proofSection !== null, '#proof section exists directly after services');

    const quoteCards = await page.$$('.proof-quote-card');
    assert(quoteCards.length >= 3, `Client message cards present (${quoteCards.length} cards)`);
    const placeholderBadges = await page.$$('.placeholder-badge');
    assert(placeholderBadges.length >= 3, `Obvious Coming Soon placeholder badges present (${placeholderBadges.length} found)`);

    const builtCards = await page.$$('.proof-product-card');
    assert(builtCards.length === 3, `3 built products cards present (${builtCards.length})`);

    const reelCards = await page.$$('.proof-reel-card');
    assert(reelCards.length === 3, `3 sample reel cards present (${reelCards.length})`);

    // Ensure removed sections are gone
    const workSection = await page.$('#work');
    assert(workSection === null, '#work ("How we work") removed from page flow');
    const elementsSection = await page.$('#elements');
    assert(elementsSection === null, '#elements (atom animation) removed from page flow');
    const ticker = await page.$('.ticker');
    assert(ticker === null, '.ticker marquee removed from page flow');

    // -------------------------------------------------------------------------
    // TEST 6: Tools Redirect & Business Inquiry Form
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Tools Redirect and Business Inquiry Form ---');
    await page.goto(`http://localhost:${PORT}/tools.html`);
    await page.waitForTimeout(500);
    const currentUrl = page.url();
    assert(currentUrl.includes('#business-inquiry'), `tools.html redirected to #business-inquiry (got ${currentUrl})`);

    const inqForm = await page.$('#businessInquiryForm');
    assert(inqForm !== null, '#businessInquiryForm exists');

    // Fill form and test validation
    await page.fill('#inqName', 'Test Founder');
    await page.fill('#inqBusiness', 'Green Orchard Cafe');
    await page.selectOption('#inqType', 'Café / Restaurant');
    await page.fill('#inqPhone', '+91 99999 88888');
    await page.check('input[value="More customers in my shop"]');
    await page.check('#inqConsent');

    // Submit form (intercept popup)
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 4000 }).catch(() => null),
      page.click('#inqSubmitBtn')
    ]);

    const successMsgVisible = await page.isVisible('#inqSuccessMsg');
    assert(successMsgVisible, 'On-page confirmation message is displayed after inquiry submission');

    // -------------------------------------------------------------------------
    // TEST 7: ATOM ZEN Configurator
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing ATOM ZEN Configurator ---');
    await page.goto(`http://localhost:${PORT}/atom-zen/`);
    await page.waitForLoadState('networkidle');

    const backBtn = await page.$('.btn-back');
    assert(backBtn !== null, 'Back to website button exists in ATOM ZEN header');

    // Step 1: Select offers
    await page.click('#cardOfferFootfall'); // select footfall too
    await page.click('#btnNextToStep2');
    await page.waitForTimeout(300);

    const step2Active = await page.$eval('#stepPane2', (el) => el.classList.contains('is-active'));
    assert(step2Active, 'Step 2 (Scope Questions) became active');

    // Step 2 -> Step 3
    await page.click('#btnNextToStep3');
    await page.waitForTimeout(300);
    const step3Active = await page.$eval('#stepPane3', (el) => el.classList.contains('is-active'));
    assert(step3Active, 'Step 3 (Deliverables Blueprint) became active');

    const summaryText = await page.textContent('#summaryCardContainer');
    assert(summaryText.includes('Email Automation System') && summaryText.includes('Physical Footfall Booster'), 'Summary blueprint correctly includes both selected systems');

    // Step 3 -> Step 4
    await page.click('#btnNextToStep4');
    await page.waitForTimeout(300);
    const step4Active = await page.$eval('#stepPane4', (el) => el.classList.contains('is-active'));
    assert(step4Active, 'Step 4 (WhatsApp Handoff) became active');

    const waLink = await page.$eval('#btnOpenWhatsApp', (el) => el.getAttribute('href'));
    assert(waLink.includes('wa.me') && waLink.includes('EMAIL%20AUTOMATION'), 'WhatsApp handoff button has formatted message link');

    // Test Explainer Modal
    await page.click('#openExplainerBtn');
    await page.waitForTimeout(300);
    const modalOpen = await page.$eval('#explainerModal', (el) => el.classList.contains('is-open'));
    assert(modalOpen, 'Explainer modal opens cleanly on click');

    await page.click('#closeExplainerBtn');
    await page.waitForTimeout(200);
    const modalClosed = await page.$eval('#explainerModal', (el) => !el.classList.contains('is-open'));
    assert(modalClosed, 'Explainer modal closes cleanly on click');

    // -------------------------------------------------------------------------
    // TEST 8: SEO, Robots & JSON-LD
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing SEO, Robots & JSON-LD ---');
    await page.goto(`http://localhost:${PORT}/`);
    const pageTitle = await page.title();
    assert(pageTitle === 'ATOMZ | Reels, Email Automation, Footfall Systems and Digital Assets', `Page title is exact match (got: "${pageTitle}")`);

    const jsonLdContent = await page.$eval('script[type="application/ld+json"]', (el) => el.textContent);
    let parsedLd = null;
    try {
      parsedLd = JSON.parse(jsonLdContent);
    } catch (e) {}
    assert(parsedLd && parsedLd['@context'] === 'https://schema.org', 'JSON-LD is valid schema.org');

    await page.goto(`http://localhost:${PORT}/robots.txt`);
    const robotsText = await page.textContent('body');
    assert(robotsText.includes('Disallow: /horizon*.html') && robotsText.includes('Disallow: /aroha*.html'), 'robots.txt disallows private client portals');

    await page.goto(`http://localhost:${PORT}/sitemap.xml`);
    const sitemapText = await page.textContent('body');
    assert(!sitemapText.includes('tools.html') && !sitemapText.includes('horizon'), 'sitemap.xml excludes tools and private portals');

    // -------------------------------------------------------------------------
    // SCREENSHOTS
    // -------------------------------------------------------------------------
    console.log('\n--- Capturing Screenshots ---');
    const shotsDir = path.join(ROOT_DIR, 'screenshots_preview');
    if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/`);
    await page.evaluate(() => {
      const ov = document.getElementById('introLoaderOverlay');
      if (ov) ov.remove();
    });
    await page.screenshot({ path: path.join(shotsDir, '01-desktop-hero.png') });

    await page.locator('#services').screenshot({ path: path.join(shotsDir, '02-services-3cards.png') });
    await page.locator('#proof').screenshot({ path: path.join(shotsDir, '03-proof-section.png') });
    await page.locator('#business-inquiry').screenshot({ path: path.join(shotsDir, '04-inquiry-form.png') });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`http://localhost:${PORT}/`);
    await page.evaluate(() => {
      const ov = document.getElementById('introLoaderOverlay');
      if (ov) ov.remove();
    });
    await page.screenshot({ path: path.join(shotsDir, '05-mobile-390-hero.png') });

    await page.goto(`http://localhost:${PORT}/atom-zen/`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(shotsDir, '06-atom-zen-step1.png') });

    console.log('All screenshots captured in screenshots_preview/');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await browser.close();
    server.close();
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);
  return failed === 0;
}

runVerification().then((ok) => {
  process.exit(ok ? 0 : 1);
});
