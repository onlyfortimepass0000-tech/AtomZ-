const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PORT = 8092;
const ROOT = path.resolve(__dirname, '..');
const ARTIFACT_DIR = '/Users/rajdeepmalladeb/.gemini/antigravity/brain/6a8ebf48-18bb-433a-a5ae-a64bf38313b5';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
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
  console.log(`Verification server running on http://127.0.0.1:${PORT}`);
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: 'mobile_360', width: 360, height: 740 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_430', width: 430, height: 932 },
    { name: 'desktop_1440', width: 1440, height: 900 }
  ];

  const pagesToTest = [
    { url: '/', name: 'home' },
    { url: '/atom-zen/', name: 'atom_zen' },
    { url: '/writing/', name: 'writing' },
    { url: '/blog/attention-is-not-a-business.html', name: 'blog_cpg' },
    { url: '/blog/quality-creates-community.html', name: 'blog_agency' }
  ];

  const results = {
    overflowIssues: [],
    tapTargetIssues: [],
    perfMetrics: {},
    a11yIssues: [],
    sectionOrder: null,
    redirects: []
  };

  try {
    // 1. Test redirect of /tools.html
    const redirectPage = await browser.newPage();
    await redirectPage.goto(`http://127.0.0.1:${PORT}/tools.html`, { waitUntil: 'load' });
    const finalUrl = redirectPage.url();
    results.redirects.push({ from: '/tools.html', to: finalUrl, success: finalUrl === `http://127.0.0.1:${PORT}/` });
    await redirectPage.close();

    // 2. Test pages across viewports
    for (const p of pagesToTest) {
      for (const vp of viewports) {
        const page = await browser.newPage({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 2
        });

        await page.goto(`http://127.0.0.1:${PORT}${p.url}`, { waitUntil: 'networkidle' });

        // Evaluate horizontal overflow
        const overflow = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const winWidth = window.innerWidth;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const hasOverflow = scrollWidth > winWidth;

          let offending = [];
          if (hasOverflow) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const r = el.getBoundingClientRect();
              if (r.right > winWidth + 1) {
                offending.push({
                  tag: el.tagName,
                  id: el.id,
                  className: (typeof el.className === 'string') ? el.className.slice(0, 50) : '',
                  right: Math.round(r.right),
                  winWidth
                });
                if (offending.length >= 5) break;
              }
            }
          }

          return { winWidth, scrollWidth, hasOverflow, offending };
        });

        if (overflow.hasOverflow) {
          results.overflowIssues.push({ page: p.name, vp: vp.name, overflow });
        }

        // Tap target analysis on mobile
        if (vp.width <= 430) {
          const tapTargets = await page.evaluate(() => {
            const clickables = Array.from(document.querySelectorAll('a, button, [role="button"], input[type="checkbox"], input[type="radio"]'));
            const smallTargets = [];
            for (const el of clickables) {
              // skip hidden elements
              const style = window.getComputedStyle(el);
              if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              // Check if in visible flow
              if (r.height < 40 && !el.closest('footer') && !el.classList.contains('back-link')) {
                // Ignore small inline links inside prose paragraphs
                if (el.tagName === 'A' && el.parentElement && el.parentElement.tagName === 'P') continue;
                smallTargets.push({
                  tag: el.tagName,
                  text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30),
                  w: Math.round(r.width),
                  h: Math.round(r.height),
                  className: (typeof el.className === 'string') ? el.className.slice(0, 50) : ''
                });
              }
            }
            return smallTargets.slice(0, 5);
          });
          if (tapTargets.length > 0) {
            results.tapTargetIssues.push({ page: p.name, vp: vp.name, count: tapTargets.length, items: tapTargets });
          }
        }

        // Screenshot capture for 390px and 1440px
        if (vp.name === 'mobile_390' || vp.name === 'desktop_1440') {
          const ssPath = path.join(ARTIFACT_DIR, `qa_${p.name}_${vp.name}.png`);
          await page.screenshot({ path: ssPath, fullPage: true });
        }

        // Home section order check
        if (p.name === 'home' && vp.name === 'desktop_1440') {
          const sections = await page.evaluate(() => {
            const list = [];
            const header = document.querySelector('header.site-header');
            if (header) list.push('header');
            const hero = document.querySelector('.hero');
            if (hero) list.push('hero');
            const proof = document.querySelector('.proof-strip');
            if (proof) list.push('proof-strip');
            const work = document.querySelector('#work');
            if (work) list.push('work (#work)');
            const services = document.querySelector('#services');
            if (services) list.push('services (#services)');
            const process = document.querySelector('#process');
            if (process) list.push('process (#process)');
            const zen = document.querySelector('.home-zen');
            if (zen) list.push('atom-zen-block');
            const elements = document.querySelector('#elements');
            if (elements) list.push('elements (#elements)');
            const marquee = document.querySelector('.ticker');
            if (marquee) list.push('ticker');
            const cta = document.querySelector('.final-cta');
            if (cta) list.push('final-cta');
            const footer = document.querySelector('footer.site-footer');
            if (footer) list.push('footer');
            return list;
          });
          results.sectionOrder = sections;
        }

        // Accessibility checks
        if (vp.name === 'mobile_390') {
          const a11y = await page.evaluate(() => {
            const issues = [];
            // check images without alt
            const imgs = Array.from(document.querySelectorAll('img:not([alt])'));
            if (imgs.length > 0) issues.push({ type: 'img-alt-missing', count: imgs.length });
            // check buttons without text or aria-label
            const emptyBtns = Array.from(document.querySelectorAll('button')).filter(b => {
              const text = (b.innerText || b.getAttribute('aria-label') || '').trim();
              return text.length === 0;
            });
            if (emptyBtns.length > 0) issues.push({ type: 'empty-button-label', count: emptyBtns.length });
            return issues;
          });
          if (a11y.length > 0) {
            results.a11yIssues.push({ page: p.name, issues: a11y });
          }
        }

        // Performance metrics on desktop
        if (vp.name === 'desktop_1440' && p.name === 'home') {
          const perf = await page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            const fcp = paint.find(p => p.name === 'first-contentful-paint');
            return {
              domContentLoaded: Math.round(nav ? nav.domContentLoadedEventEnd : 0),
              loadTime: Math.round(nav ? nav.loadEventEnd : 0),
              fcp: fcp ? Math.round(fcp.startTime) : null
            };
          });
          results.perfMetrics[p.name] = perf;
        }

        await page.close();
      }
    }

    console.log('=== QA RUN COMPLETE ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('QA Error:', err);
  } finally {
    await browser.close();
    server.close();
  }
});
