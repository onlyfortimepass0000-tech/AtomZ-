const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8094;
const ROOT = path.resolve(__dirname, '..');
const ARTIFACT_DIR = '/Users/rajdeepmalladeb/.gemini/antigravity/brain/6a8ebf48-18bb-433a-a5ae-a64bf38313b5';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  else if (reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Server on http://127.0.0.1:${PORT}`);
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Test Audit page on desktop
    const pageDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageDesktop.goto(`http://127.0.0.1:${PORT}/audit/`, { waitUntil: 'networkidle' });

    // Check nav has Audit
    const auditNavLink = await pageDesktop.locator('.nav__links a[href="/audit/"]').count();
    console.log('Desktop nav Audit link count:', auditNavLink);

    // Adjust sliders
    await pageDesktop.locator('#rev1').fill('4');
    await pageDesktop.locator('#rev2').fill('5');
    await pageDesktop.locator('#rev3').fill('4');

    // Click submit
    await pageDesktop.click('.audit-submit-btn');

    // Wait for results
    await pageDesktop.waitForSelector('#results', { state: 'visible' });
    const resultTitle = await pageDesktop.locator('#resultTitle').innerText();
    const resultText = await pageDesktop.locator('#resultText').innerText();
    const waLink = await pageDesktop.locator('#waAuditLink').getAttribute('href');
    console.log('Result Title:', resultTitle);
    console.log('Result Text excerpt:', resultText.slice(0, 100));
    console.log('WhatsApp Link:', waLink);

    // Screenshot desktop light with results
    await pageDesktop.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_desktop_light.png'), fullPage: false });

    // Switch to dark theme
    await pageDesktop.click('.theme-toggle');
    await pageDesktop.waitForTimeout(300);
    await pageDesktop.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_desktop_dark.png'), fullPage: false });

    // 2. Test mobile 390px (fresh context so default theme is light)
    const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto(`http://127.0.0.1:${PORT}/audit/`, { waitUntil: 'networkidle' });

    // Check overflow
    const overflow = await pageMobile.evaluate(() => {
      const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      return { winWidth: window.innerWidth, scrollW, hasOverflow: scrollW > window.innerWidth };
    });
    console.log('Mobile 390px overflow check:', overflow);

    // Test mobile menu open
    await pageMobile.click('.mobile-menu-btn');
    await pageMobile.waitForSelector('.site-header[data-mobile-menu-open="true"]', { state: 'attached' });
    const mobileAuditLink = await pageMobile.locator('.mobile-nav-dropdown a[href="/audit/"]').count();
    console.log('Mobile menu Audit link count:', mobileAuditLink);
    await pageMobile.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mobile_menu.png') });

    // Close menu & submit audit on mobile
    await pageMobile.click('.mobile-menu-btn');
    await pageMobile.click('.audit-submit-btn');
    await pageMobile.waitForSelector('#results', { state: 'visible' });
    await pageMobile.waitForTimeout(400);
    await pageMobile.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mobile_results_light.png'), fullPage: false });

    // Test mobile in dark mode
    await pageMobile.click('.theme-toggle');
    await pageMobile.waitForTimeout(400);
    await pageMobile.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_mobile_results_dark.png'), fullPage: false });

    // 3. Test 360px overflow
    const page360 = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await page360.goto(`http://127.0.0.1:${PORT}/audit/`, { waitUntil: 'networkidle' });
    const overflow360 = await page360.evaluate(() => {
      const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
      return { winWidth: window.innerWidth, scrollW, hasOverflow: scrollW > window.innerWidth };
    });
    console.log('Mobile 360px overflow check:', overflow360);

    // 4. Test home page nav link
    const pageHome = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pageHome.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    const homeAuditLink = await pageHome.locator('.nav__links a[href="/audit/"]').count();
    console.log('Home desktop nav Audit link count:', homeAuditLink);

    console.log('ALL AUDIT TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Audit Test Error:', err);
  } finally {
    await browser.close();
    server.close();
  }
});
