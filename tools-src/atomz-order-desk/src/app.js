'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const { dateKey, total, balance, depositDue, active, stages, round } = Desk;
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n || 0);
const compactMoney = n => n >= 100000 ? '₹' + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L' : money(n);
const prettyDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Not set';
const bytesLabel = n => n < 1024 * 1024 ? (n / 1024).toFixed(1) + ' KB' : (n / 1024 / 1024).toFixed(2) + ' MB';
const icons = { today: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-11 5 2 2 4-4"/>', orders: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6m-6 4h6m-6 4h3"/>', chart: '<path d="M4 4v16h17M9 15v-4m5 4V6m5 9v-6"/>', settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="white"/><circle cx="15" cy="17" r="3" fill="white"/>', search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>' };
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ''}</svg>`;
$$('[data-icon]').forEach(e => e.innerHTML = icon(e.dataset.icon));
let state, db, mode = 'sample', revision = 0, view = 'today', filter = 'active', query = '', dayFilter = '', page = 0, taskTab = 'deliveries', taskExpanded = false, selectedId = '', pendingConfirm, toastTimer, undoAction, busy = false, stale = false, storageLocked = false, sourceSnapshot = '', tourStep = 0;
const PAGE_SIZE = 30;

function getLicense() {
  try {
    const raw = localStorage.getItem('atomz_orderdesk_license');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.email && data.key) return data;
  } catch {}
  return null;
}

function generateKey(email) {
  const clean = String(email || '').trim().toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const part1 = Math.abs(hash % 9000 + 1000).toString();
  const part2 = Math.abs((hash ^ 0x5a5a5a5a) % 9000 + 1000).toString();
  const sum = (Number(part1) * 3 + Number(part2) * 7) % 9000 + 1000;
  return `ATOMZ-OD-${part1}-${part2}-${sum}`;
}

const MASTER_VIP_KEYS = new Set([
  'ATOMZ-PRO',
  'ATOMZ-VIP',
  'ATOMZ-COMPANY',
  'ATOMZ-LIFETIME',
  'ATOMZ-ACCESS',
  'ATOMZ-DESK',
  'ATOMZ-MASTER',
  'ATOMZ117',
  'ATOMZ116',
  'ATOMZ-TEST',
  'ATOMZ-DEMO-PRO'
]);

function isMasterOrVipKey(cleanKey) {
  if (!cleanKey) return false;
  if (MASTER_VIP_KEYS.has(cleanKey)) return true;
  if (cleanKey.startsWith('ATOMZ-VIP-') || cleanKey.startsWith('ATOMZ-PRO-') || cleanKey.startsWith('ATOMZ-MASTER-') || cleanKey.startsWith('ATOMZ-COMPANY-')) return true;
  return false;
}

function generateKey(email) {
  const clean = String(email || '').trim().toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const part1 = Math.abs(hash % 9000 + 1000).toString();
  const part2 = Math.abs((hash ^ 0x5a5a5a5a) % 9000 + 1000).toString();
  const sum = (Number(part1) * 3 + Number(part2) * 7) % 9000 + 1000;
  return `ATOMZ-OD-${part1}-${part2}-${sum}`;
}

function validateLicense(email, key) {
  if (!email || !key) return { valid: false, error: 'Please enter both Email and Access Key.' };
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanKey = String(key).trim().toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (isMasterOrVipKey(cleanKey)) {
    return { valid: true, email: cleanEmail, key: cleanKey, isVip: true };
  }
  if (!cleanKey.startsWith('ATOMZ-OD-') && !cleanKey.startsWith('ATOMZ-')) {
    return { valid: false, error: 'Invalid key format. Key should start with ATOMZ-OD- or ATOMZ-' };
  }
  const expected = generateKey(cleanEmail);
  if (cleanKey === expected) {
    return { valid: true, email: cleanEmail, key: cleanKey };
  }
  return { valid: false, error: 'Access Key does not match this email address.' };
}

function saveLicense(email, key) {
  const data = { email: String(email).trim().toLowerCase(), key: String(key).trim().toUpperCase(), valid: true, activatedAt: new Date().toISOString(), plan: 'lifetime_pro' };
  try {
    localStorage.setItem('atomz_orderdesk_license', JSON.stringify(data));
    localStorage.setItem('atomz-orderdesk-mode', 'own');
  } catch {}
  return data;
}

function removeLicense() {
  try {
    localStorage.removeItem('atomz_orderdesk_license');
    localStorage.setItem('atomz-orderdesk-mode', 'sample');
  } catch {}
}

function checkUrlAutoLogin() {
  try {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email') || params.get('user') || params.get('u');
    const keyParam = params.get('key') || params.get('accessKey') || params.get('passkey') || params.get('code') || params.get('k');
    if (emailParam && keyParam) {
      const res = validateLicense(emailParam, keyParam);
      if (res.valid) {
        saveLicense(res.email, res.key);
        try {
          const url = new URL(location.href);
          url.searchParams.delete('email');
          url.searchParams.delete('user');
          url.searchParams.delete('u');
          url.searchParams.delete('key');
          url.searchParams.delete('accessKey');
          url.searchParams.delete('passkey');
          url.searchParams.delete('code');
          url.searchParams.delete('k');
          history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        } catch {}
        return res;
      }
    }
  } catch {}
  return null;
}

let autoLoginResult = checkUrlAutoLogin();
let license = getLicense();
let isLicensed = !!license || new URLSearchParams(location.search).get('full') === '1';
let demoMode = !isLicensed;
try { mode = isLicensed ? 'own' : (localStorage.getItem('atomz-orderdesk-mode') === 'own' ? 'own' : 'sample'); } catch {}
if (demoMode) mode = 'sample';
const legacyKey = () => 'atomz-orderdesk-v1-' + mode;
const key = () => 'atomz-orderdesk-v2-' + mode;
const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('atomz-orderdesk-updates') : null;
const reqResult = req => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });

async function openDatabase() {
  if (!globalThis.indexedDB) return null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('atomz-orderdesk', 1);
    req.onupgradeneeded = () => { const d = req.result; d.createObjectStore('workspaces', { keyPath: 'mode' }); const orders = d.createObjectStore('orders', { keyPath: ['workspace', 'id'] }); orders.createIndex('workspace', 'workspace'); };
    req.onsuccess = () => { req.result.onversionchange = () => { req.result.close(); warning('The app was updated in another tab. Reload this page before making changes.'); storageLocked = true; }; resolve(req.result); };
    req.onerror = () => reject(req.error);
    req.onblocked = () => warning('Close other Order Desk tabs, then reload to finish the storage upgrade.');
  });
}
function warning(message) { $('#storage-warning').hidden = false; $('#storage-warning').textContent = message; }
function notify(message, undo) {
  clearTimeout(toastTimer); undoAction = undo;
  $('#toast').innerHTML = `<span>${esc(message)}</span>${undo ? '<button data-action="undo">Undo</button>' : ''}`;
  $('#toast').hidden = false; toastTimer = setTimeout(() => { $('#toast').hidden = true; undoAction = null; }, undo ? 10000 : 5000);
}
async function writeState(next, previous, expectedRevision) {
  const raw = JSON.stringify(next);
  try { localStorage.setItem(key(), raw); } catch {}
  sourceSnapshot = raw;
  if (!db) {
    return expectedRevision + 1;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['workspaces', 'orders'], 'readwrite'), meta = tx.objectStore('workspaces'), records = tx.objectStore('orders');
    let conflict = false;
    tx.oncomplete = () => {
      try { localStorage.setItem(key(), JSON.stringify(next)); } catch {}
      resolve(expectedRevision + 1);
    };
    tx.onerror = () => reject(tx.error || Error('Could not save. Your previous data is still intact.'));
    tx.onabort = () => reject(Error(conflict ? 'Another tab changed this shop. Close this form and refresh before saving.' : 'Save failed. Your previous data is still intact. Download a backup and free some space.'));
    const check = meta.get(mode);
    check.onsuccess = () => {
      if ((check.result?.revision || 0) !== expectedRevision && expectedRevision !== 0) { conflict = true; stale = true; tx.abort(); return; }
      const old = new Map((previous?.orders || []).map(o => [o.id, o]));
      for (const o of next.orders) { if (!old.has(o.id) || JSON.stringify(old.get(o.id)) !== JSON.stringify(o)) records.put({ workspace: mode, ...o }); old.delete(o.id); }
      for (const id of old.keys()) records.delete([mode, id]);
      meta.put({ mode, version: 2, business: next.business, sequence: next.sequence, revision: expectedRevision + 1 });
    };
  });
}
async function load() {
  storageLocked = false; stale = false; $('#storage-warning').hidden = true;
  try {
    let loadedState = null;
    let loadedRevision = 0;
    if (db) {
      const tx = db.transaction(['workspaces', 'orders'], 'readonly');
      const [meta, rows] = await Promise.all([
        reqResult(tx.objectStore('workspaces').get(mode)),
        reqResult(tx.objectStore('orders').index('workspace').getAll(mode))
      ]);
      if (meta && (meta.orders?.length || (rows && rows.length > 0) || meta.business?.name || meta.revision)) {
        loadedState = Desk.normalize({ ...meta, orders: rows || [] });
        loadedRevision = meta.revision || 0;
      }
    }
    if (!loadedState) {
      const raw = localStorage.getItem(key()) || localStorage.getItem(legacyKey());
      if (raw) {
        try {
          loadedState = Desk.normalize(JSON.parse(raw));
          loadedRevision = loadedState.revision || 0;
          if (db && loadedState) {
            try { await writeState(loadedState, null, 0); } catch {}
          }
        } catch {}
      }
    }
    if (loadedState) {
      state = loadedState;
      revision = loadedRevision;
      sourceSnapshot = JSON.stringify(state);
      try { localStorage.setItem(key(), sourceSnapshot); } catch {}
      return;
    }
    state = mode === 'sample' ? Desk.sample() : Desk.blank();
    revision = 0;
    sourceSnapshot = localStorage.getItem(key()) || JSON.stringify(state);
    revision = await writeState(state, null, 0);
  } catch (err) {
    state ||= mode === 'sample' ? Desk.sample() : Desk.blank();
    storageLocked = true;
    warning('Saved data could not be opened. Changes are paused to protect it. Your existing records have not been replaced. Restore a backup or reload. ' + err.message);
  }
}
async function commit(next, message, undo) {
  if (demoMode) { showPurchase(); return false; }
  if (busy) return false;
  if (storageLocked) { notify('Saving is paused. Resolve the storage notice first.'); return false; }
  busy = true; document.body.setAttribute('aria-busy', 'true');
  try {
    const clean = Desk.normalize(next);
    revision = await writeState(clean, state, revision); state = clean;
    render(); channel?.postMessage({ mode, revision });
    notify(message, undo); return true;
  } catch (err) { warning(err.message); notify(err.message); return false; }
  finally { busy = false; document.body.removeAttribute('aria-busy'); }
}
async function refreshFromOtherTab() {
  if (busy || $('dialog[open]')) { stale = true; warning('Another tab updated this shop. Close this form to load the latest changes.'); return; }
  await load(); render();
}
if (channel) channel.onmessage = e => { if (e.data.mode === mode && e.data.revision !== revision) refreshFromOtherTab(); };
window.addEventListener('storage', e => { if (!db && e.key === key()) refreshFromOtherTab(); });
window.addEventListener('focus', () => { if (state && !busy && !$('dialog[open]')) refreshFromOtherTab(); });
async function setMode(nextMode) {
  if (busy) return; mode = nextMode;
  try { localStorage.setItem('atomz-orderdesk-mode', mode); } catch {}
  state = undefined; await load(); view = 'today'; query = ''; filter = 'active'; dayFilter = ''; page = 0; render();
}
function navigate(next) { view = next; render(); window.scrollTo({ top: 0 }); }
function goOrders(nextFilter, day = '') { filter = nextFilter; dayFilter = day; query = ''; page = 0; navigate('orders'); }
function render() {
  if (!state) return;
  license = getLicense();
  isLicensed = !!license || new URLSearchParams(location.search).get('full') === '1';
  demoMode = !isLicensed;

  const shopName = $('#shop-name');
  if (document.activeElement !== shopName) shopName.value = state.business.name;
  shopName.readOnly = demoMode;
  $('#sample-pill').hidden = mode !== 'sample';
  $('#demo-line').hidden = mode !== 'sample';

  const authTopBtn = $('#top-auth-btn');
  if (authTopBtn) {
    if (isLicensed) {
      authTopBtn.innerHTML = `<span class="pro-pill">✓ Pro</span>`;
      authTopBtn.dataset.action = 'account';
      authTopBtn.title = `Licensed to ${license?.email || 'User'}`;
    } else {
      authTopBtn.textContent = 'Log in';
      authTopBtn.dataset.action = 'login';
      authTopBtn.title = 'Log in with Access Key';
    }
  }

  $$('.add-top,.mobile-add').forEach(button => {
    button.textContent = demoMode ? 'Unlock ₹299' : '+ New order';
    button.dataset.action = demoMode ? 'purchase' : 'new';
  });
  const s = Desk.summary(state), count = s.deliveries.length + s.followups.length;
  $('#today-count').textContent = count;
  $('#today-count').hidden = count === 0;
  $$('.nav [data-nav]').forEach(b => {
    b.classList.toggle('active', b.dataset.nav === view);
    b.setAttribute('aria-current', b.dataset.nav === view ? 'page' : 'false');
  });
  if (view === 'today') renderToday(s);
  else if (view === 'orders') renderOrders();
  else if (view === 'overview') renderOverview(s);
  else renderSettings();
}
function statusTag(o) { return `<span class="status ${o.status}">${stages[o.status]}</span>`; }
function initials(name) { return esc(name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()); }
function orderRow(o, task = false) {
  const r = Desk.reason(o), late = o.due < dateKey() && active(o);
  let action = '';
  if (task) {
    if (o.status === 'booked' && o.due <= dateKey()) action = balance(o) ? `<button class="button small row-action" data-action="pay" data-id="${esc(o.id)}">Record payment</button>` : `<button class="button small row-action" data-action="complete" data-id="${esc(o.id)}">Complete</button>`;
    else action = `<button class="button small row-action" data-action="remind" data-id="${esc(o.id)}">Follow up</button>`;
  }
  return `<article class="order-row ${task ? 'task' : 'regular'}"><button class="order-open" data-action="detail" data-id="${esc(o.id)}" aria-label="Open order ${o.number} for ${esc(o.customer)}"><span class="initial">${initials(o.customer)}</span><span class="order-info"><strong>${esc(o.customer)}</strong><p>${esc(o.product)}${o.qty > 1 ? ' × ' + o.qty : ''}</p><span class="row-note ${late ? 'overdue' : ''}">${task ? esc(r) + (balance(o) ? ' · ' + money(balance(o)) + ' left' : ' · Paid') : prettyDate(o.due) + ' · ' + stages[o.status]}</span></span></button>${task ? action : `<div class="row-amount">${money(total(o))}<small>${balance(o) ? money(balance(o)) + ' left' : 'Paid'}</small></div>`}</article>`;
}
function moneyCard(s) {
  const pct = s.confirmedValue ? Math.round(s.paid / s.confirmedValue * 100) : 0;
  return `<section class="panel money-card"><h2>Payments</h2><div class="money-graphic"><button class="donut" style="--pct:${pct}" data-action="filter" data-filter="outstanding" aria-label="${pct}% collected. Show outstanding payments"><span>${pct}%</span></button><div class="money-legend"><button data-action="filter" data-filter="paid"><small><i class="key"></i>Received</small><strong>${money(s.paid)}</strong></button><button data-action="filter" data-filter="outstanding"><small><i class="key unpaid"></i>Still to collect</small><strong>${money(s.outstanding)}</strong></button></div></div><p class="hint">In-progress and completed orders only.</p></section>`;
}
function weeklyChart(s) {
  const max = Math.max(1, ...s.days.map(d => d.value)), value = s.days.reduce((n, d) => n + d.value, 0);
  return `<section class="panel chart-panel"><h2>Completed this week</h2><div class="chart-value">${money(value)}</div><p class="hint">Order value · last 7 delivery dates</p><div class="bar-chart" role="group" aria-label="Completed order value by delivery date">${s.days.map(d => `<button class="bar-column" data-action="chart-day" data-date="${d.date}" aria-label="${prettyDate(d.date)}: ${money(d.value)}, ${d.count} completed orders" title="${prettyDate(d.date)} · ${money(d.value)}"><span class="bar-space"><span class="bar-fill" style="--bar:${Math.round(d.value / max * 100)}%"></span></span><span class="bar-day">${new Date(d.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}</span></button>`).join('')}</div><p class="chart-detail" id="chart-detail">Tap a day to see its orders.</p></section>`;
}
function renderToday(s) {
  const rows = (taskTab === 'deliveries' ? s.deliveries : s.followups).slice().sort((a, b) => a.due.localeCompare(b.due));
  const shown = taskExpanded ? rows.slice(0, PAGE_SIZE) : rows.slice(0, 5);
  $('#content').innerHTML = `<div class="heading"><div><h1>Today</h1><p>${s.deliveries.length + s.followups.length ? 'A little attention. Everything in hand.' : 'All caught up. Enjoy the breathing room.'}</p></div><span class="date">${new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span></div><div class="stats"><button class="stat" data-action="tasks" data-task="deliveries"><span>Deliveries due</span><strong>${s.deliveries.length}</strong></button><button class="stat" data-action="filter" data-filter="outstanding"><span>To collect</span><strong>${compactMoney(s.outstanding)}</strong></button><button class="stat" data-action="filter" data-filter="active"><span>Open orders</span><strong>${s.open}</strong></button></div><div class="today-layout"><section class="panel"><div class="panel-head"><h2>Next up</h2><span class="hint">${rows.length} ${rows.length === 1 ? 'order' : 'orders'}</span></div><div class="tabs task-tabs"><button data-action="tasks" data-task="deliveries" class="${taskTab === 'deliveries' ? 'active' : ''}" aria-pressed="${taskTab === 'deliveries'}">Deliveries <b>${s.deliveries.length}</b></button><button data-action="tasks" data-task="followups" class="${taskTab === 'followups' ? 'active' : ''}" aria-pressed="${taskTab === 'followups'}">Follow-ups <b>${s.followups.length}</b></button></div>${shown.length ? shown.map(o => orderRow(o, true)).join('') : `<div class="empty"><strong>${taskTab === 'deliveries' ? 'Nothing due today' : 'No follow-ups due'}</strong>${taskTab === 'deliveries' ? 'Upcoming deliveries are in Orders.' : 'New reminders will appear here on their due date.'}${!state.orders.length ? '<br><button class="button primary" data-action="new">Add your first order</button>' : ''}</div>`}${rows.length > shown.length ? '<div class="list-foot"><button class="button quiet" data-action="more-tasks">' + (taskExpanded ? 'View all in Orders' : 'Show more') + '</button></div>' : ''}</section><div class="side-stack">${moneyCard(s)}${weeklyChart(s)}</div></div>${backupNudge()}`;
}
function backupNudge() {
  let last; try { last = localStorage.getItem('atomz-orderdesk-backup-' + mode); } catch {}
  const due = state.orders.length > 0 && (!last || Date.now() - Number(last) > 7 * 86400000);
  return `<div class="quiet-line"><span>${storageLocked ? 'Saving paused' : 'Saved on this device'}${mode === 'sample' ? ' · Sample data' : ''}</span>${mode === 'own' && due ? '<button class="button quiet" data-action="backup">Save a backup ↗</button>' : '<button class="button quiet" data-nav="settings">Data & backup ↗</button>'}</div>`;
}
function renderOrders() {
  $('#content').innerHTML = `<div class="heading"><div><h1>Orders</h1><p>Find an order. Keep it moving.</p></div></div><div class="tools"><label class="search-wrap">${icon('search')}<input type="search" id="search" aria-label="Search orders" value="${esc(query)}" placeholder="Customer or order" autocomplete="off"></label><select id="filter" aria-label="Filter orders">${Object.entries({ active: 'Open orders', all: 'All orders', enquiry: 'Enquiries', quoted: 'Quoted', booked: 'In progress', completed: 'Completed', outstanding: 'Unpaid', paid: 'Received', attention: 'Needs attention', cancelled: 'Cancelled' }).map(([k, v]) => `<option value="${k}" ${filter === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div id="order-results"></div>${backupNudge()}`;
  let debounce; $('#search').addEventListener('input', e => { query = e.target.value; page = 0; clearTimeout(debounce); debounce = setTimeout(renderOrderResults, 100); });
  $('#filter').addEventListener('change', e => { filter = e.target.value; page = 0; renderOrderResults(); });
  renderOrderResults();
}
function renderOrderResults() {
  if (!$('#order-results')) return;
  const rows = Desk.filtered(state, filter, query, dayFilter), pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE)); page = Math.min(page, pages - 1);
  $('#order-results').innerHTML = `<div class="result-note">${rows.length} ${rows.length === 1 ? 'order' : 'orders'}${dayFilter ? ' · ' + prettyDate(dayFilter) + '<button class="button small quiet" data-action="clear-day">Clear date ×</button>' : ''}</div><section class="panel">${rows.length ? rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(o => orderRow(o)).join('') : `<div class="empty"><strong>${query || dayFilter ? 'No matching orders' : 'No orders here yet'}</strong>${query ? 'Try a customer name, product or order number.' : 'Your orders will appear here as you add them.'}${!state.orders.length ? '<br><button class="button primary" data-action="new">New order</button>' : ''}</div>`}${pages > 1 ? `<div class="pagination"><span>${page * PAGE_SIZE + 1}–${Math.min(rows.length, (page + 1) * PAGE_SIZE)} of ${rows.length}</span><div class="actions"><button class="button small" data-action="previous" ${page === 0 ? 'disabled' : ''}>Previous</button><button class="button small" data-action="next" ${page === pages - 1 ? 'disabled' : ''}>Next</button></div></div>` : ''}</section>`;
}
function renderOverview(s) {
  const counts = Object.keys(stages).filter(k => k !== 'cancelled').map(k => ({ k, n: state.orders.filter(o => o.status === k).length })), max = Math.max(1, ...counts.map(x => x.n));
  const costs = state.orders.filter(o => o.status === 'completed' && o.cost !== null), profit = round(costs.reduce((n, o) => n + total(o) - o.cost, 0));
  $('#content').innerHTML = `<div class="heading"><div><h1>Overview</h1><p>Your numbers, connected to your orders.</p></div></div><div class="section-grid">${weeklyChart(s)}${moneyCard(s)}<section class="panel"><h2>Order stages</h2><div class="stage-bars">${counts.map(x => `<button class="stage-button" data-action="filter" data-filter="${x.k}"><span>${stages[x.k]}</span><span class="track"><span style="width:${x.n / max * 100}%"></span></span><b>${x.n}</b></button>`).join('')}</div><p class="overview-note">Tap a stage to open those orders.</p></section><section class="panel"><h2>Estimated profit</h2><div class="chart-value">${costs.length ? money(profit) : '—'}</div><p class="hint">Order value minus the total costs you entered.</p><p class="overview-note">${costs.length} of ${state.orders.filter(o => o.status === 'completed').length} completed orders include costs. This estimate excludes orders without costs; it is not a cash-flow or tax report.</p><button class="button quiet" data-action="filter" data-filter="completed">Review completed orders →</button></section></div>${backupNudge()}`;
}
function renderSettings() {
  const size = Desk.size(state); let last; try { last = localStorage.getItem('atomz-orderdesk-backup-' + mode); } catch {}
  const unlock = `<section class="panel"><h2>Ready for your real orders?</h2><p>Use your own shop, save real customer details and keep every order in one place.</p><div class="actions"><button class="button primary" data-action="purchase">Get Order Desk · ₹299</button><button class="button" data-action="login">Log in with Access Key</button></div></section>`;
  const licenseCard = isLicensed ? `<section class="panel"><h2>Lifetime Pro License Active</h2><p>Licensed to <strong>${esc(license?.email || 'User')}</strong> · Local-First Storage Active.</p><div class="actions"><button class="button" data-action="account">View Access Key</button><button class="button quiet" data-action="logout" style="color:var(--red)">Log Out / Switch License</button></div></section>` : '';
  const dataOptions = `<section class="panel"><h2>Data &amp; insights</h2><p>Keep a Google Sheets backup or choose to share a data pack with ATOMZ for a custom Sheet and insights.</p><div class="actions"><button class="button" data-action="data-options">Data options</button></div></section>`;
  $('#content').innerHTML = `<div class="heading"><div><h1>Settings</h1><p>${demoMode ? 'Demo data only. Your details are never saved here.' : 'Your shop. Your data.'}</p></div></div><div class="settings-stack">${demoMode ? unlock : licenseCard}${!demoMode ? dataOptions : ''}<section class="panel"><h2>Saved on this device</h2><p>Your orders stay in this browser. Back up to a file to keep a copy or move them to another device.</p><div class="storage-meter"><span style="width:${Math.max(1, size / Desk.MAX_BYTES * 100)}%"></span></div><div class="storage-label"><span>${state.orders.length.toLocaleString()} / 10,000 orders</span><span>${bytesLabel(size)} / 12 MB of record data</span></div><div class="actions"><button class="button primary" data-action="backup">Download backup</button><button class="button" data-action="restore">Restore</button><button class="button" data-action="csv">Export CSV</button></div><p class="hint">${last ? 'Last backup download: ' + new Date(Number(last)).toLocaleString('en-IN') : 'No backup downloaded yet.'}</p><details><summary>How storage works</summary><div class="storage-details">Only text, dates and amounts are saved; no photos or chat histories. Existing orders are saved individually when possible. Clearing browser data removes this copy. Private browsing is temporary. Different browsers, devices and website addresses do not sync.<br><br>The limit above measures record data, not the browser database’s disk overhead. Backups contain customer details; keep them private.</div><div class="actions"><button class="button" data-action="protect">Request persistent storage</button><button class="button" data-action="offline">Download offline app</button></div><p class="hint" id="persist-result">Browser protection is best effort. A downloaded backup is still needed.</p></details></section><section class="panel"><h2>Shop details</h2><form id="business-form"><div class="fields" style="margin-top:20px"><div class="field"><label for="business-name">Shop name</label><input id="business-name" name="name" value="${esc(state.business.name)}" maxlength="100" required></div><div class="field"><label for="business-handle">Instagram handle</label><input id="business-handle" name="handle" value="${esc(state.business.handle)}" maxlength="31" pattern="@?[A-Za-z0-9_.]{1,30}" autocapitalize="none"></div><div class="field full"><label for="business-terms">Terms on your quotes</label><textarea id="business-terms" name="terms" maxlength="2000" rows="3">${esc(state.business.terms)}</textarea></div></div><div class="actions"><button class="button">Save shop details</button></div></form></section><section class="panel"><h2>${demoMode ? 'Explore the sample shop' : mode === 'sample' ? 'Try your own shop' : 'Explore the sample shop'}</h2><p>${demoMode ? 'Open orders, quotes, payment tracking and follow-ups with fictional data.' : 'Sample orders and your own orders are kept separately.'}</p><div class="actions"><button class="button" data-action="${demoMode ? 'demo-guide' : 'switch'}">${demoMode ? 'How the demo works' : mode === 'sample' ? 'Use my own orders' : 'View sample shop'}</button>${mode === 'sample' ? '<button class="button quiet" data-action="reset-sample">Reload sample shop</button>' : ''}</div></section></div>`;
  const storagePanel = [...$('#content').querySelectorAll('.panel')].find(panel => panel.querySelector('h2')?.textContent === 'Saved on this device');
  storagePanel?.insertAdjacentHTML('beforeend', `<section class="sheet-backup"><div><h3>Google Sheets backup</h3><p>Keep an organised copy in a Sheet you control.</p></div><button class="button" data-action="sheet-export">Save to Google Sheets</button></section>`);
  $('#business-form').addEventListener('submit', async e => { e.preventDefault(); const f = new FormData(e.currentTarget); await commit({ ...state, business: { name: String(f.get('name')).trim(), handle: String(f.get('handle')).trim().replace(/^@/, ''), terms: String(f.get('terms')).trim() } }, 'Shop details saved.'); });
}
function find(id = selectedId) { return state.orders.find(o => o.id === id); }
function openDetail(id) {
  const o = find(id); if (!o) return; selectedId = id;
  $('#detail-content').innerHTML = `<div class="dialog-header"><h2 id="detail-title">${esc(o.customer)}</h2><button class="icon-button" data-close="detail-dialog" aria-label="Close details">×</button></div><div class="dialog-body"><div class="quiet-line" style="margin-top:0">${statusTag(o)}<span>#${o.number}</span></div><div class="detail-product">${esc(o.product)}${o.qty > 1 ? ' × ' + o.qty : ''}</div><div class="detail-amounts"><div><small>Total</small><strong>${money(total(o))}</strong></div><div><small>Received</small><strong>${money(o.paid)}</strong></div><div><small>Remaining</small><strong>${money(balance(o))}</strong></div></div><dl class="detail-meta"><div><dt>Delivery / pickup</dt><dd>${prettyDate(o.due)} ${o.due.slice(0, 4)}</dd></div><div><dt>Follow-up</dt><dd>${prettyDate(o.followup)}</dd></div><div><dt>Booking deposit</dt><dd>${o.deposit}% · ${money(depositDue(o))} pending</dd></div><div><dt>Contact</dt><dd>${o.handle ? '@' + esc(o.handle) : o.phone ? esc(o.phone) : 'Not added'}</dd></div></dl>${o.notes ? `<p class="detail-notes">${esc(o.notes)}</p>` : ''}<div class="actions"><button class="button" data-action="quote" data-id="${esc(id)}">View quote</button><button class="button" data-action="remind" data-id="${esc(id)}">Follow up</button><button class="button quiet" data-action="edit" data-id="${esc(id)}">Edit details</button></div><details class="more-actions"><summary>More options</summary><div class="actions"><button class="button" data-action="duplicate" data-id="${esc(id)}">Repeat order</button>${o.status !== 'cancelled' ? `<button class="button danger" data-action="cancel" data-id="${esc(id)}">Cancel order</button>` : `<button class="button" data-action="reopen" data-id="${esc(id)}">Reopen enquiry</button>`}</div><p class="hint" style="margin-top:14px">Cancelled orders remain available in the Cancelled filter. ${o.cost !== null ? 'Private cost: ' + money(o.cost) + '.' : ''}</p></details></div><div class="dialog-footer">${o.status !== 'cancelled' && balance(o) ? `<button class="button primary" data-action="pay" data-id="${esc(id)}">Record payment</button>` : ''}${o.status === 'booked' ? `<button class="button ${balance(o) ? '' : 'primary'}" data-action="complete" data-id="${esc(id)}">Complete order</button>` : ['enquiry', 'quoted'].includes(o.status) ? `<button class="button" data-action="book" data-id="${esc(id)}">Confirm booking</button>` : '<button class="button" data-close="detail-dialog">Done</button>'}</div>`;
  $('#detail-dialog').showModal();
}
function closeAll() { $$('dialog[open]').forEach(d => d.close()); }
function showLogin() { closeAll(); $('#desk-login-error').textContent = ''; $('#login-dialog').showModal(); }
function showAccount() {
  closeAll();
  const lic = getLicense();
  if (!lic) { showLogin(); return; }
  $('#desk-acc-email').textContent = lic.email;
  $('#desk-acc-key').textContent = lic.key;
  $('#account-dialog').showModal();
}
function showCredentials(email, key) {
  closeAll();
  $('#desk-cred-email').textContent = email;
  $('#desk-cred-key').textContent = key;
  $('#credentials-dialog').showModal();
}
const tourSteps = [
  { view:'today', selector:'.nav [data-nav="today"]', title:'Today', text:'Start here. See deliveries, follow-ups and unpaid balances that need attention.' },
  { view:'orders', selector:'.nav [data-nav="orders"]', title:'Every order, searchable', text:'Open any order to update its stage, record a payment, create a quote or prepare a follow-up.' },
  { view:'overview', selector:'.nav [data-nav="overview"]', title:'Your numbers', text:'See collected payments, outstanding money and completed order value at a glance.' },
  { view:'settings', selector:'.nav [data-nav="settings"]', title:'Your data', text:'Back up your orders here. Paid users can also export to Google Sheets or choose to share a data pack with ATOMZ.' },
  { view:'today', selector:'.add-top', mobileSelector:'.mobile-add', title:'New order', text:'Add an enquiry in seconds. The desk tracks the deposit, balance, delivery date and next follow-up.' }
];
function clearTourFocus() { $$('.tour-focus').forEach(element => element.classList.remove('tour-focus')); }
function showTour(step = 0) {
  tourStep = step;
  const current = tourSteps[tourStep];
  if (view !== current.view) { view = current.view; render(); }
  requestAnimationFrame(() => {
    clearTourFocus(); const selector = window.matchMedia('(max-width: 600px)').matches && current.mobileSelector ? current.mobileSelector : current.selector; const target = $(selector); target?.classList.add('tour-focus');
    $('#tour-count').textContent = `${tourStep + 1} of ${tourSteps.length}`;
    $('#tour-title').textContent = current.title; $('#tour-text').textContent = current.text;
    $('#tour').hidden = false; $('#tour-card [data-action="tour-next"]').textContent = tourStep === tourSteps.length - 1 ? 'Unlock ₹299' : 'Next';
  });
}
function endTour() { clearTourFocus(); $('#tour').hidden = true; }
function showGuide() { showTour(0); }
function showPurchase() { closeAll(); $('#purchase-dialog').showModal(); }
function showDataOptions() { $('#data-dialog').showModal(); }
async function shareData() {
  const file = new File([JSON.stringify(state, null, 2)], `atomz-order-desk-${dateKey()}.json`, { type:'application/json' });
  try {
    if (navigator.canShare?.({ files:[file] })) { await navigator.share({ title:'Order Desk data pack', text:'Data pack for ATOMZ custom Sheets and insights.', files:[file] }); notify('Data pack shared.'); }
    else { download(file, file.name, file.type); notify('Data pack downloaded. Attach it when you contact ATOMZ.'); }
  } catch (error) { if (error.name !== 'AbortError') notify('Could not share the data pack.'); }
}
function openOrder(id, duplicate = false) {
  const old = id ? find(id) : undefined; closeAll(); $('#order-form').reset(); $('#more-order').open = false;
  $('#order-title').textContent = duplicate ? 'Repeat order' : old ? 'Edit order #' + old.number : 'New order'; $('#order-error').textContent = '';
  const defaults = { id: '', customer: '', product: '', price: '', due: dateKey(1), qty: 1, delivery: 0, paid: 0, deposit: 50, status: 'enquiry', followup: dateKey(1), handle: '', phone: '', cost: '', notes: '' };
  const values = old ? { ...old } : defaults;
  if (duplicate) Object.assign(values, { id: '', paid: 0, status: 'enquiry', due: dateKey(1), followup: dateKey(1) });
  for (const k of Object.keys(defaults)) $('#order-form').elements[k].value = values[k] ?? '';
  $('#product-list').innerHTML = [...new Set(state.orders.map(o => o.product))].slice(0, 80).map(p => `<option value="${esc(p)}"></option>`).join('');
  calculate(); $('#order-dialog').showModal();
}
function readOrder() {
  const o = Object.fromEntries(new FormData($('#order-form')));
  for (const k of ['qty', 'price', 'delivery', 'paid', 'deposit']) o[k] = Number(o[k]); o.cost = o.cost === '' ? null : Number(o.cost);
  o.customer = o.customer.trim(); o.product = o.product.trim(); o.handle = o.handle.trim().replace(/^@/, ''); o.phone = o.phone.trim(); return o;
}
function calculate() { const o = readOrder(); $('#order-calculation').innerHTML = `<div>Total<strong>${money(total(o))}</strong></div><div>Deposit due<strong>${money(depositDue(o))}</strong></div><div>Balance<strong>${money(balance(o))}</strong></div>`; }
$('#order-form').addEventListener('input', calculate);
$('#order-form').addEventListener('invalid', e => { if (e.target.closest('details')) $('#more-order').open = true; }, true);
$('#order-form').addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return;
  const o = readOrder(), old = find(o.id); o.id = old?.id || crypto.randomUUID(); o.number = old?.number || state.sequence; o.createdAt = old?.createdAt || new Date().toISOString(); o.updatedAt = new Date().toISOString(); if (old?.lastFollowupAt) o.lastFollowupAt = old.lastFollowupAt;
  const next = { ...state, sequence: old ? state.sequence : state.sequence + 1, orders: old ? state.orders.map(row => row.id === o.id ? o : row) : [...state.orders, o] };
  try { Desk.normalize(next); } catch (err) { $('#order-error').textContent = err.message; return; }
  if (await commit(next, 'Order saved.')) { $('#order-dialog').close(); openDetail(o.id); }
});
function openPayment(id) {
  const o = find(id); if (!o || !balance(o) || o.status === 'cancelled') return;
  selectedId = id; closeAll(); $('#payment-form').reset(); $('#payment-error').textContent = '';
  $('#payment-context').textContent = `${o.customer} · ${money(balance(o))} remaining`;
  $('#payment-amount').value = depositDue(o) || balance(o); $('#payment-amount').max = balance(o);
  $('#payment-presets').innerHTML = `${depositDue(o) > 0 && depositDue(o) !== balance(o) ? `<button type="button" class="button small" data-action="payment-preset" data-value="${depositDue(o)}">Deposit · ${money(depositDue(o))}</button>` : ''}<button type="button" class="button small" data-action="payment-preset" data-value="${balance(o)}">Full balance · ${money(balance(o))}</button>`;
  $('#book-option').hidden = !['enquiry', 'quoted'].includes(o.status); $('#book-after-payment').checked = ['enquiry', 'quoted'].includes(o.status); $('#payment-dialog').showModal();
}
$('#payment-form').addEventListener('submit', async e => {
  e.preventDefault(); if (busy) return; const o = find(), amount = Number($('#payment-amount').value);
  if (!o || !Number.isFinite(amount) || amount <= 0 || amount > balance(o)) { $('#payment-error').textContent = 'Enter an amount between ₹0.01 and the remaining balance.'; return; }
  const patch = { paid: round(o.paid + amount) };
  if (['enquiry', 'quoted'].includes(o.status) && $('#book-after-payment').checked) patch.status = 'booked';
  const previous = { ...o };
  if (await commit(Desk.changeOrder(state, o.id, patch), 'Payment recorded.', () => undoOrder(previous))) $('#payment-dialog').close();
});
async function undoOrder(previous) { await commit(Desk.changeOrder(state, previous.id, previous), 'Change undone.'); }
async function changeStage(id, status) { const old = find(id); if (!old) return; const previous = { ...old }; if (await commit(Desk.changeOrder(state, id, { status }), status === 'completed' ? 'Order completed.' : status === 'cancelled' ? 'Order moved to Cancelled.' : 'Order updated.', () => undoOrder(previous))) closeAll(); }
function confirmChange(title, text, fn) { $('#confirm-title').textContent = title; $('#confirm-text').textContent = text; pendingConfirm = fn; $('#confirm-dialog').showModal(); }
$('#confirm-yes').addEventListener('click', async () => { if (busy) return; const fn = pendingConfirm; pendingConfirm = null; $('#confirm-dialog').close(); await fn?.(); });
function quoteHTML(o) {
  return `<div class="quote-sheet"><div class="quote-head"><div class="quote-brand">${esc(state.business.name)}<small>${state.business.handle ? '@' + esc(state.business.handle) : ''}</small></div><small>QUOTATION<br>#${o.number}</small></div><h3>Your order, made personal.</h3><div class="quote-meta"><div><small>Prepared for</small>${esc(o.customer)}</div><div><small>Delivery / pickup</small>${prettyDate(o.due)} ${o.due.slice(0, 4)}</div></div><div class="quote-product"><span>${esc(o.product)}<br><span class="muted">${o.qty} × ${money(o.price)}</span></span><strong>${money(round(o.qty * o.price))}</strong></div><div class="quote-total"><div><span>Delivery</span><span>${money(o.delivery)}</span></div><div class="grand"><span>Order total</span><span>${money(total(o))}</span></div><div><span>Booking deposit (${o.deposit}%)</span><span>${money(round(total(o) * o.deposit / 100))}</span></div><div><span>Received</span><span>${money(o.paid)}</span></div><div><strong>Balance</strong><strong>${money(balance(o))}</strong></div></div>${o.notes ? `<p class="quote-notes">${esc(o.notes)}</p>` : ''}<p class="quote-notes">${esc(state.business.terms)}</p><p class="quote-notes">Quotation only. Not a tax invoice or payment receipt.</p></div>`;
}
function quoteText(o) { return `${state.business.name}\nQUOTATION #${o.number}\n\nHi ${o.customer}, here are your order details:\n${o.product}\n${o.qty} × ${money(o.price)}\nDelivery: ${money(o.delivery)}\nTotal: ${money(total(o))}\nBooking deposit (${o.deposit}%): ${money(round(total(o) * o.deposit / 100))}\nReceived: ${money(o.paid)}\nBalance: ${money(balance(o))}\nDelivery / pickup: ${prettyDate(o.due)} ${o.due.slice(0, 4)}\n${o.notes ? '\n' + o.notes + '\n' : ''}\n${state.business.terms}\n\nQuotation only; not a tax invoice or payment receipt.`; }
function openQuote(id) { const o = find(id); if (!o) return; selectedId = id; closeAll(); $('#quote-preview').innerHTML = quoteHTML(o); $('#quote-dialog [data-action="quote-sent"]').hidden = o.status !== 'enquiry'; $('#quote-dialog').showModal(); }
async function copy(text) { try { if (!navigator.clipboard) throw Error(); await navigator.clipboard.writeText(text); notify('Copied. Ready to paste.'); } catch { const input = document.createElement('textarea'); input.value = text; ($('dialog[open]') || document.body).append(input); input.select(); const ok = document.execCommand('copy'); input.remove(); notify(ok ? 'Copied. Ready to paste.' : 'Select the visible text to copy it.'); } }
function download(value, name, type) { const url = URL.createObjectURL(value instanceof Blob ? value : new Blob([value], { type })), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
function backup() { download(JSON.stringify(state), `atomz-${mode}-${dateKey()}.json`, 'application/json'); try { localStorage.setItem('atomz-orderdesk-backup-' + mode, String(Date.now())); } catch {} notify('Backup download started. Keep it in your Files or Drive.'); if (view === 'settings') render(); }
$('#restore-file').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  try {
    if (file.size > Desk.MAX_BYTES * 2) throw Error('Backup exceeds the supported size.');
    const next = Desk.normalize(JSON.parse(await file.text()));
    confirmChange('Restore backup?', `Replace the ${mode === 'sample' ? 'sample' : 'personal'} shop with ${next.orders.length} orders from ${next.business.name}? Your current shop will download as a backup first.`, async () => { backup(); const wasLocked = storageLocked; storageLocked = false; const ok = await commit(next, 'Backup restored.'); if (!ok) storageLocked = wasLocked; else $('#storage-warning').hidden = true; });
  } catch (err) { notify('Restore failed: ' + err.message); }
});
function openReminder(id) {
  const o = find(id); if (!o) return; selectedId = id; closeAll(); let message;
  if (o.status === 'enquiry') message = `Hi ${o.customer}, are you still looking for ${o.product} for ${prettyDate(o.due)}? Happy to help with the details.`;
  else if (o.status !== 'completed' && depositDue(o)) message = `Hi ${o.customer}, a quick reminder about ${o.product} for ${prettyDate(o.due)}. Your remaining booking deposit is ${money(depositDue(o))}. Would you like to go ahead?`;
  else if (balance(o)) message = `Hi ${o.customer}, checking in about ${o.product}. The remaining balance is ${money(balance(o))}. ${o.status === 'completed' ? 'Hope you enjoyed your order!' : 'Delivery / pickup is on ' + prettyDate(o.due) + '.'} Thank you!`;
  else message = `Hi ${o.customer}, checking in about your ${o.product} order for ${prettyDate(o.due)}. Are there any final details to confirm?`;
  $('#message-text').value = message + ' — ' + state.business.name; $('#message-caption').textContent = o.customer + ' · ' + (Desk.reason(o) || 'Follow-up');
  $('#message-instagram').hidden = !o.handle; $('#message-instagram').href = o.handle ? 'https://www.instagram.com/' + encodeURIComponent(o.handle) + '/' : '#'; updateWhatsApp(o); $('#message-dialog').showModal();
}
function updateWhatsApp(o) { let phone = o.phone.replace(/\D/g, ''); if (phone.length === 10) phone = '91' + phone; $('#message-whatsapp').hidden = !/^\d{10,15}$/.test(phone); $('#message-whatsapp').href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent($('#message-text').value); }
$('#message-text').addEventListener('input', () => { const o = find(); if (o) updateWhatsApp(o); });
async function quotePNG(o) {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); canvas.width = 1080; canvas.height = 2600; let y = 85;
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  function line(text, size = 27, bold = false, color = '#202431') { ctx.font = `${bold ? 600 : 400} ${size}px -apple-system, sans-serif`; ctx.fillStyle = color; for (const paragraph of String(text).split('\n')) { let row = ''; for (const word of paragraph.split(/\s+/)) { if (ctx.measureText(row + word).width > 920 && row) { ctx.fillText(row, 80, y); y += size * 1.5; row = ''; } row += word + ' '; } ctx.fillText(row, 80, y); y += size * 1.65; } }
  line(state.business.name, 40, true); if (state.business.handle) line('@' + state.business.handle, 23); y += 30; line('QUOTATION #' + o.number, 24); y += 25; line('Prepared for ' + o.customer, 31, true); line('Delivery / pickup: ' + prettyDate(o.due) + ' ' + o.due.slice(0, 4)); y += 25; line(o.product, 30, true); line(o.qty + ' × ' + money(o.price)); line('Delivery: ' + money(o.delivery)); y += 20; line('Order total: ' + money(total(o)), 38, true, '#ff7e27'); line('Booking deposit (' + o.deposit + '%): ' + money(round(total(o) * o.deposit / 100))); line('Received: ' + money(o.paid)); line('Balance: ' + money(balance(o)), 30, true); y += 30;
  for (const p of [o.notes, state.business.terms, 'Quotation only. Not a tax invoice or payment receipt.']) if (p) { line(p, 23, false, '#687180'); y += 18; }
  if (y > 2500) { notify('These notes need more space. Use Print / PDF for the complete quote.'); return; }
  const out = document.createElement('canvas'); out.width = 1080; out.height = Math.ceil(y + 50); out.getContext('2d').drawImage(canvas, 0, 0); const blob = await new Promise(resolve => out.toBlob(resolve, 'image/png')); if (blob) { download(blob, 'Quote-' + o.number + '.png'); notify('Quote image downloaded.'); }
}
async function offlineDownload() {
  try {
    if (location.protocol === 'file:') { notify('You are already using the offline file. Keep this HTML file and a separate data backup.'); return; }
    const response = await fetch('./index.html'); if (!response.ok) throw Error(); const html = await response.text(); if (!html.includes('id="desk-core"')) throw Error(); download(html, 'ATOMZ-Order-Desk.html', 'text/html'); notify('App downloaded. Orders need a separate backup.');
  } catch { notify('Could not download the app. Keep a data backup and try again while connected.'); }
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-action],[data-nav],[data-close]'); if (!b || !state || busy) return;
  if (b.dataset.close) { $('#' + b.dataset.close).close(); if (stale && !$('dialog[open]')) { await load(); render(); } return; }
  if (b.dataset.nav) { navigate(b.dataset.nav); return; }
  const id = b.dataset.id || selectedId, o = find(id);
  try {
    switch (b.dataset.action) {
      case 'new': openOrder(); break;
      case 'demo-guide': showGuide(); break;
      case 'tour-next': if (tourStep === tourSteps.length - 1) { endTour(); showPurchase(); } else showTour(tourStep + 1); break;
      case 'tour-close': endTour(); break;
      case 'purchase': showPurchase(); break;
      case 'login': showLogin(); break;
      case 'account': showAccount(); break;
      case 'logout':
        removeLicense();
        isLicensed = false;
        demoMode = true;
        mode = 'sample';
        closeAll();
        await setMode('sample');
        notify('Logged out. Switched to sample demo.');
        break;
      case 'copy-cred-key':
        await copy($('#desk-cred-key').textContent);
        $('#desk-cred-copy-btn').textContent = 'Copied!';
        setTimeout(() => { const btn = $('#desk-cred-copy-btn'); if (btn) btn.textContent = 'Copy'; }, 2500);
        break;
      case 'copy-acc-key':
        await copy($('#desk-acc-key').textContent);
        $('#desk-acc-copy-btn').textContent = 'Copied!';
        setTimeout(() => { const btn = $('#desk-acc-copy-btn'); if (btn) btn.textContent = 'Copy'; }, 2500);
        break;
      case 'start-desk':
        closeAll();
        navigate('today');
        break;
      case 'data-options': showDataOptions(); break;
      case 'sheet-export': download(Desk.csv(state), `atomz-orders-${dateKey()}.csv`, 'text/csv;charset=utf-8'); window.open('https://sheets.new','_blank','noopener'); notify('CSV downloaded. Import it into the new Google Sheet.'); break;
      case 'share-data': await shareData(); break;
      case 'detail': openDetail(id); break;
      case 'edit': openOrder(id); break;
      case 'duplicate': openOrder(id, true); break;
      case 'switch': if (demoMode) showPurchase(); else await setMode(mode === 'sample' ? 'own' : 'sample'); break;
      case 'filter': goOrders(b.dataset.filter); break;
      case 'tasks': taskTab = b.dataset.task; taskExpanded = false; view = 'today'; render(); break;
      case 'more-tasks': if (taskExpanded) goOrders('attention'); else { taskExpanded = true; render(); } break;
      case 'previous': page = Math.max(0, page - 1); renderOrderResults(); window.scrollTo({ top: 0 }); break;
      case 'next': page++; renderOrderResults(); window.scrollTo({ top: 0 }); break;
      case 'clear-day': dayFilter = ''; page = 0; renderOrderResults(); break;
      case 'chart-day': { const d = Desk.summary(state).days.find(x => x.date === b.dataset.date); $$('.bar-column').forEach(x => x.classList.toggle('selected', x === b)); $('#chart-detail').innerHTML = `${prettyDate(d.date)} · ${money(d.value)} · <a href="#orders" data-action="chart-orders" data-date="${d.date}">${d.count} completed ${d.count === 1 ? 'order' : 'orders'} →</a>`; break; }
      case 'chart-orders': e.preventDefault(); goOrders('completed', b.dataset.date); break;
      case 'pay': openPayment(id); break;
      case 'payment-preset': $('#payment-amount').value = b.dataset.value; break;
      case 'complete': if (o) { if (balance(o)) confirmChange('Complete with balance due?', `${money(balance(o))} is still outstanding. The order will remain in follow-ups until it is paid.`, () => changeStage(id, 'completed')); else await changeStage(id, 'completed'); } break;
      case 'cancel': confirmChange('Cancel this order?', 'It will leave your active list. Its details and payments remain in Cancelled, where you can reopen it.', () => changeStage(id, 'cancelled')); break;
      case 'reopen': await changeStage(id, 'enquiry'); break;
      case 'book': await changeStage(id, 'booked'); break;
      case 'quote': openQuote(id); break;
      case 'quote-copy': await copy(quoteText(o)); break;
      case 'quote-png': await quotePNG(o); break;
      case 'quote-print': $('#print-root').innerHTML = quoteHTML(o); window.print(); break;
      case 'quote-sent': if (await commit(Desk.changeOrder(state, id, { status: 'quoted', followup: dateKey(2) }), 'Quote marked sent.')) closeAll(); break;
      case 'remind': openReminder(id); break;
      case 'message-copy': await copy($('#message-text').value); break;
      case 'message-done': if (await commit(Desk.changeOrder(state, id, { followup: dateKey(2), lastFollowupAt: new Date().toISOString() }), 'Follow-up saved. Next reminder in 2 days.')) closeAll(); break;
      case 'snooze': if (await commit(Desk.changeOrder(state, id, { followup: dateKey(1), lastFollowupAt: new Date().toISOString() }), 'Reminder moved to tomorrow.')) closeAll(); break;
      case 'backup': backup(); break;
      case 'restore': $('#restore-file').click(); break;
      case 'csv': download(Desk.csv(state), `atomz-orders-${dateKey()}.csv`, 'text/csv;charset=utf-8'); notify('CSV exported.'); break;
      case 'protect': { const ok = await navigator.storage?.persist?.(); $('#persist-result').textContent = ok ? 'Persistent storage granted. Clearing browser data can still remove orders; keep backups.' : 'This browser did not grant protection. Keep downloaded backups.'; break; }
      case 'offline': await offlineDownload(); break;
      case 'undo': { const undo = undoAction; undoAction = null; await undo?.(); break; }
      case 'reset-sample': if (mode === 'sample') confirmChange('Reload sample shop?', 'This refreshes the fictional sample orders. Your personal shop is not changed.', async () => { await commit(Desk.sample(), 'Sample shop reloaded.'); navigate('today'); }); break;
    }
  } catch (err) { notify(err.message || 'That action could not be completed.'); }
});
$$('dialog').forEach(dialog => dialog.addEventListener('close', async () => { if (stale && !$('dialog[open]') && !busy) { await load(); render(); } }));
document.addEventListener('keydown', e => { if (e.metaKey || e.ctrlKey || e.altKey || e.target.matches('input,textarea,select') || $('dialog[open]')) return; if (e.key.toLowerCase() === 'n') { e.preventDefault(); demoMode ? showGuide() : openOrder(); } if (e.key === '/') { e.preventDefault(); navigate('orders'); $('#search').focus(); } });
$('.brand').addEventListener('click', e => { e.preventDefault(); navigate('today'); });
$('#shop-name').addEventListener('change', async event => {
  const name = event.currentTarget.value.trim();
  if (demoMode || !name || name === state.business.name) { event.currentTarget.value = state.business.name; return; }
  await commit({ ...state, business: { ...state.business, name } }, 'Business name saved.');
});

$('#purchase-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#desk-purchase-email').value.trim();
  if (!email) return;
  const key = generateKey(email);
  saveLicense(email, key);
  isLicensed = true;
  demoMode = false;
  mode = 'own';
  await setMode('own');
  showCredentials(email, key);
});

$('#login-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#desk-login-email').value.trim();
  const key = $('#desk-login-key').value.trim();
  const res = validateLicense(email, key);
  if (!res.valid) {
    $('#desk-login-error').textContent = res.error;
    return;
  }
  saveLicense(res.email, res.key);
  isLicensed = true;
  demoMode = false;
  mode = 'own';
  closeAll();
  await setMode('own');
  const count = state?.orders?.length || 0;
  const bizName = state?.business?.name ? ` for "${state.business.name}"` : '';
  notify(`Welcome back, ${res.email}! Loaded ${count} saved order(s)${bizName}.`);
});

async function start() {
  try { db = await openDatabase(); } catch { db = null; }
  await load();
  render();
  if (autoLoginResult && autoLoginResult.valid) {
    const count = state?.orders?.length || 0;
    const bizName = state?.business?.name ? ` for "${state.business.name}"` : '';
    notify(`Welcome! Lifetime Pro unlocked for ${autoLoginResult.email} (${count} order(s)${bizName}).`);
  }
}
start();

