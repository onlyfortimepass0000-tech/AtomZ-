const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = '/Users/rajdeepmalladeb/.gemini/antigravity/brain/6a8ebf48-18bb-433a-a5ae-a64bf38313b5';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

async function run() {
  const phase = process.argv[2] || 'check';
  const targetUrl = process.argv[3] || '/';

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at http://localhost:${PORT}`);

  const browser = await chromium.launch();
  try {
    // 1440px desktop
    const pageDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    pageDesktop.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await pageDesktop.goto(`http://localhost:${PORT}${targetUrl}`, { waitUntil: 'networkidle' });
    const desktopScreenshotPath = path.join(ARTIFACTS_DIR, `${phase}_desktop_1440.png`);
    await pageDesktop.screenshot({ path: desktopScreenshotPath, fullPage: false });

    // 390px mobile
    const pageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    pageMobile.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await pageMobile.goto(`http://localhost:${PORT}${targetUrl}`, { waitUntil: 'networkidle' });
    const mobileScreenshotPath = path.join(ARTIFACTS_DIR, `${phase}_mobile_390.png`);
    await pageMobile.screenshot({ path: mobileScreenshotPath, fullPage: false });

    // Check overflow on mobile
    const scrollWidth = await pageMobile.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await pageMobile.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalOverflow = scrollWidth > clientWidth;

    console.log(`[${phase}] Desktop 1440px: OK -> ${desktopScreenshotPath}`);
    console.log(`[${phase}] Mobile 390px: OK -> ${mobileScreenshotPath}`);
    console.log(`[${phase}] Mobile scrollWidth: ${scrollWidth}px, clientWidth: ${clientWidth}px (Overflow: ${hasHorizontalOverflow})`);
    if (consoleErrors.length > 0) {
      console.warn(`[${phase}] Console errors:`, consoleErrors);
    }

    if (hasHorizontalOverflow) {
      console.error(`[${phase}] FAILED: Horizontal overflow detected on mobile!`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});
