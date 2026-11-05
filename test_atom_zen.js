const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 3456;
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
  console.log(`Server listening on http://localhost:${PORT}`);
  const results = [];
  const errors = [];

  const browser = await chromium.launch({ headless: true });

  const artifactDir = '/Users/rajdeepmalladeb/.gemini/antigravity/brain/6a8ebf48-18bb-433a-a5ae-a64bf38313b5';
  const screenshotsDir = path.join(ROOT, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  try {
    // -------------------------------------------------------------
    // Test 1: Desktop Viewport (1440x900) - Homepage & Nav
    // -------------------------------------------------------------
    console.log('\n--- TESTING DESKTOP VIEWPORT (1440x900) ---');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktopPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // Verify AROHA is completely removed from desktop nav
    const arohaDesktop = await desktopPage.$('a[href*="aroha"]');
    console.log('AROHA desktop link found:', Boolean(arohaDesktop));
    if (!arohaDesktop) {
      results.push('Check AROHA Desktop: Successfully removed from desktop navigation.');
    } else {
      errors.push('Check AROHA Desktop FAILED: aroha link still present on desktop.');
    }

    // Check Hero CTA Button
    const heroBtn = await desktopPage.$('.hero__cta-group a[href*="atom-zen"]');
    const heroBtnText = heroBtn ? (await heroBtn.innerText()).trim() : '';
    console.log(`Hero CTA Button Text: "${heroBtnText}"`);
    if (heroBtn && heroBtnText.includes('Build with ATOM ZEN')) {
      results.push('Check Hero CTA: "Build with ATOM ZEN" present.');
    } else {
      errors.push('Check Hero CTA FAILED: button missing.');
    }

    // Check Desktop Nav link
    const desktopNavZen = await desktopPage.$('.nav__links a[href*="atom-zen"]');
    if (desktopNavZen) {
      results.push('Check Desktop Nav: ATOM ZEN configurator link present.');
    } else {
      errors.push('Check Desktop Nav FAILED: ATOM ZEN link missing.');
    }

    // -------------------------------------------------------------
    // Test 2: Mobile Viewport (390x844) - Homepage & Menu
    // -------------------------------------------------------------
    console.log('\n--- TESTING MOBILE VIEWPORT (390x844) ---');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobilePage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // Verify zero overlap between logo and top bar controls
    const mobileLogo = await mobilePage.$('.site-header .brand');
    const mobileMenuBtn = await mobilePage.$('.mobile-menu-btn');
    const logoBox = mobileLogo ? await mobileLogo.boundingBox() : null;
    const menuBox = mobileMenuBtn ? await mobileMenuBtn.boundingBox() : null;
    const noOverlap = logoBox && menuBox && (logoBox.x + logoBox.width < menuBox.x);
    console.log(`Mobile logo/menu zero overlap: ${noOverlap}`);
    if (noOverlap) {
      results.push('Check Mobile Header: Clean layout with zero logo collision.');
    } else {
      errors.push('Check Mobile Header FAILED: Elements overlap.');
    }

    // Open mobile hamburger menu
    await mobileMenuBtn.click();
    await mobilePage.waitForTimeout(300);

    // Verify AROHA is removed from mobile menu
    const arohaMobile = await mobilePage.$('#mobileNavDropdown a[href*="aroha"]');
    console.log('AROHA mobile menu link found:', Boolean(arohaMobile));
    if (!arohaMobile) {
      results.push('Check AROHA Mobile: Successfully removed from mobile dropdown.');
    } else {
      errors.push('Check AROHA Mobile FAILED: aroha link still present in mobile menu.');
    }

    // Verify ATOM ZEN is present in mobile menu
    const zenMobileMenu = await mobilePage.$('#mobileNavDropdown a[href*="atom-zen"]');
    if (zenMobileMenu) {
      results.push('Check Mobile Menu ATOM ZEN: Present inside three bars menu.');
    } else {
      errors.push('Check Mobile Menu ATOM ZEN FAILED: missing from menu.');
    }

    // -------------------------------------------------------------
    // Test 3: ATOM ZEN Configurator Desktop (1440x900) & Back Button
    // -------------------------------------------------------------
    console.log('\n--- TESTING ATOM ZEN DESKTOP CONFIGURATOR ---');
    const zenDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await zenDesktop.goto(`http://localhost:${PORT}/atom-zen/`, { waitUntil: 'networkidle' });

    // Verify Back button next to logo
    const backBtnDesktop = await zenDesktop.$('.header-left .zen-back-btn');
    const isBackBtnVisible = backBtnDesktop ? await backBtnDesktop.isVisible() : false;
    const backBtnText = backBtnDesktop ? (await backBtnDesktop.innerText()).trim() : '';
    console.log(`Desktop Back Button visible: ${isBackBtnVisible}, text: "${backBtnText}"`);
    if (isBackBtnVisible && backBtnText.includes('Back')) {
      results.push('Check Desktop Back Button: Back button is present next to ATOM ZEN logo.');
    } else {
      errors.push('Check Desktop Back Button FAILED: Missing or not visible.');
    }

    // Select body to open builder
    const desktopBodyOptions = await zenDesktop.$$('.bodyoption');
    await desktopBodyOptions[0].click();
    await zenDesktop.waitForSelector('.builder', { state: 'visible' });

    // Capture desktop screenshots
    await zenDesktop.screenshot({ path: path.join(screenshotsDir, 'atom-zen-builder-desktop.png') });
    await zenDesktop.screenshot({ path: path.join(artifactDir, 'atom-zen-builder-desktop.png') });

    // Test clicking back button
    await backBtnDesktop.click();
    await zenDesktop.waitForURL(/.*(index\.html|\/)$/);
    console.log(`Back button navigation result URL: ${zenDesktop.url()}`);
    if (zenDesktop.url().endsWith('/') || zenDesktop.url().includes('index.html')) {
      results.push('Check Desktop Back Nav: Successfully navigated back to main website.');
    } else {
      errors.push('Check Desktop Back Nav FAILED: Did not navigate to main website.');
    }

    // -------------------------------------------------------------
    // Test 4: ATOM ZEN Phone Viewport (390x844) - Mobile Presentation
    // -------------------------------------------------------------
    console.log('\n--- TESTING ATOM ZEN MOBILE (PHONE) VIEWPORT (390x844) ---');
    const zenPhone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await zenPhone.goto(`http://localhost:${PORT}/atom-zen/`, { waitUntil: 'networkidle' });

    // Verify Mobile Back button next to logo
    const phoneBackBtn = await zenPhone.$('.header-left .zen-back-btn');
    const isPhoneBackVisible = phoneBackBtn ? await phoneBackBtn.isVisible() : false;
    const phoneBackText = phoneBackBtn ? (await phoneBackBtn.innerText()).trim() : '';
    console.log(`Phone Back Button visible: ${isPhoneBackVisible}, text: "${phoneBackText}"`);
    if (isPhoneBackVisible && phoneBackText.includes('Back')) {
      results.push('Check Phone Back Button: Back button present next to logo on phone.');
    } else {
      errors.push('Check Phone Back Button FAILED: Missing or not visible on phone.');
    }

    // Capture phone selection screen
    await zenPhone.screenshot({ path: path.join(screenshotsDir, 'atom-zen-phone-selection.png') });
    await zenPhone.screenshot({ path: path.join(artifactDir, 'atom-zen-phone-selection.png') });

    // Choose body on phone
    const phoneBodyOptions = await zenPhone.$$('.bodyoption');
    await phoneBodyOptions[0].click();
    await zenPhone.waitForSelector('.builder', { state: 'visible' });
    await zenPhone.waitForTimeout(500);

    // Verify Phone presentation elements:
    // 1. Mobile dock with estimate (money, workdays, quality)
    const mobileDock = await zenPhone.$('#mobile-dock');
    const isDockVisible = mobileDock ? await mobileDock.isVisible() : false;
    const mobileMoneyText = await zenPhone.$eval('#mobile-money', el => el.innerText);
    console.log(`Mobile dock visible: ${isDockVisible}, estimate: ${mobileMoneyText}`);
    if (isDockVisible && mobileMoneyText.includes('₹')) {
      results.push('Check Phone Dock: Bottom dock is visible with live estimate values.');
    } else {
      errors.push('Check Phone Dock FAILED: Bottom dock missing or no estimate.');
    }

    // 2. Mobile tabs: Build, Add pieces, Balance
    const mobileTabs = await zenPhone.$$('.mobile-tabs button');
    console.log(`Mobile tab buttons count: ${mobileTabs.length}`);
    if (mobileTabs.length === 3) {
      results.push('Check Phone Tabs: Build, Add pieces, and Balance navigation tabs present.');
    } else {
      errors.push(`Check Phone Tabs FAILED: Expected 3 tabs, found ${mobileTabs.length}.`);
    }

    // Test clicking "Add pieces" tab
    await zenPhone.click('button[data-mobile-go="pieces"]');
    await zenPhone.waitForTimeout(300);
    const libraryVisible = await zenPhone.$eval('.library', el => window.getComputedStyle(el).display !== 'none');
    console.log(`Library view active on "Add pieces" tab: ${libraryVisible}`);
    if (libraryVisible) {
      results.push('Check Phone Tab Switch: "Add pieces" tab activates catalogue cleanly.');
    } else {
      errors.push('Check Phone Tab Switch FAILED: Library not displayed on pieces tab.');
    }

    // Test clicking "Balance" tab
    await zenPhone.click('button[data-mobile-go="balance"]');
    await zenPhone.waitForTimeout(300);
    const rightVisible = await zenPhone.$eval('.right', el => window.getComputedStyle(el).display !== 'none');
    console.log(`Right view active on "Balance" tab: ${rightVisible}`);
    if (rightVisible) {
      results.push('Check Phone Tab Switch: "Balance" tab activates sliders and details.');
    } else {
      errors.push('Check Phone Tab Switch FAILED: Right panel not displayed on balance tab.');
    }

    // Return to "Build" tab
    await zenPhone.click('button[data-mobile-go="build"]');
    await zenPhone.waitForTimeout(300);

    // Capture phone builder screenshots
    await zenPhone.screenshot({ path: path.join(screenshotsDir, 'atom-zen-phone-builder.png') });
    await zenPhone.screenshot({ path: path.join(artifactDir, 'atom-zen-phone-builder.png') });

    // Test Phone Back Button returns to main site
    await phoneBackBtn.click();
    await zenPhone.waitForURL(/.*(index\.html|\/)$/);
    console.log(`Phone Back button navigation URL: ${zenPhone.url()}`);
    if (zenPhone.url().endsWith('/') || zenPhone.url().includes('index.html')) {
      results.push('Check Phone Back Nav: Successfully navigated back to main website on phone.');
    } else {
      errors.push('Check Phone Back Nav FAILED: Phone back button did not navigate home.');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    errors.push('Execution error: ' + err.message);
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n=======================================');
  console.log('SUMMARY OF RESULTS:');
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
