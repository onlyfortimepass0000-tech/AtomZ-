import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
const core = await fs.readFile(new URL('./src/core.js', import.meta.url), 'utf8');
const context = vm.createContext({ TextEncoder });
vm.runInContext(core + '\nglobalThis.testDesk = Desk;', context);
const D = context.testDesk;
const html = await fs.readFile(new URL('./dist/index.html', import.meta.url), 'utf8');
for (const [, script] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script);
assert.ok(!/<script[^>]+src=|<link[^>]+stylesheet/.test(html), 'Build must remain standalone');
const base = D.sample();
assert.equal(base.orders.length, 24);
const first = D.summary(base);
assert.equal(first.deliveries.length, 3);
assert.equal(first.paid + first.outstanding, first.confirmedValue);
let s = D.changeOrder(base, 'sample-0', { paid: 1700 });
assert.equal(D.summary(s).outstanding, first.outstanding - 850);
s = D.changeOrder(s, 'sample-0', { status: 'completed' });
assert.equal(D.summary(s).deliveries.length, 2);
assert.equal(D.summary(s).days.at(-1).value, 1700);
s = D.changeOrder(s, 'sample-2', { status: 'completed' });
assert.equal(D.reason(s.orders.find(o => o.id === 'sample-2')), 'Balance to collect');
s = D.changeOrder(s, 'sample-3', { lastFollowupAt: new Date().toISOString(), followup: D.dateKey(2) });
assert.equal(D.reason(s.orders.find(o => o.id === 'sample-3')), '');
// A delivery must remain visible even if a reminder was snoozed.
s = D.changeOrder(s, 'sample-1', { lastFollowupAt: new Date().toISOString(), followup: D.dateKey(2) });
assert.equal(D.reason(s.orders.find(o => o.id === 'sample-1')), 'Delivery today');
assert.throws(() => D.changeOrder(s, 'sample-1', { paid: 1000000 }));
assert.throws(() => D.changeOrder(s, 'sample-1', { due: '2026-02-30' }));
assert.throws(() => D.changeOrder(s, 'sample-1', { notes: 'x'.repeat(2001) }));
const duplicate = structuredClone(base); duplicate.orders[1].number = duplicate.orders[0].number;
assert.throws(() => D.normalize(duplicate));
const imported = D.normalize({ ...base, version: 1 });
assert.equal(imported.version, 2); assert.equal(imported.orders.length, 24);
assert.deepEqual(JSON.parse(JSON.stringify(D.normalize(JSON.parse(JSON.stringify(s))))), JSON.parse(JSON.stringify(s)));
const csvState = D.changeOrder(s, 'sample-1', { customer: 'Name, "quoted"', notes: '=SUM(1,2)\nSecond line' });
const csv = D.csv(csvState);
assert.ok(csv.includes('"Name, ""quoted"""'));
assert.ok(csv.includes('"\'=SUM(1,2)\nSecond line"'));
assert.equal(D.filtered(base, 'cancelled').length, 1);
assert.equal(D.filtered(base, 'active', 'Priya').length, 1);
// Build a reproducible busy-shop week; this models workload, not observed customer behavior.
let seed = 7401;
const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; };
const workload = [], interactions = [];
const counts = { newOrder: 6, quote: 3, deposit: 3, balance: 2, delivery: 1, followup: 3, edit: 4, cancel: 4 };
let shop = D.sample();
for (let day = 0; day < 7; day++) {
  const incoming = 2 + Math.floor(random() * 3), followups = 1 + Math.floor(random() * 3), edits = day % 2 === 0 ? 1 : 0, cancellations = day === 3 ? 1 : 0;
  for (let i = 0; i < incoming; i++) {
    const source = shop.orders[Math.floor(random() * 10)], id = `week-${day}-${i}`, number = shop.sequence;
    shop = D.normalize({ ...shop, sequence: number + 1, orders: [...shop.orders, { ...source, id, number, customer: `Simulated buyer ${day + 1}.${i + 1}`, status: 'enquiry', paid: 0, due: D.dateKey(day), followup: D.dateKey(day) }] });
    shop = D.changeOrder(shop, id, { status: 'quoted' });
    const amount = D.total(shop.orders.find(o => o.id === id));
    shop = D.changeOrder(shop, id, { status: 'booked', paid: amount / 2 });
    shop = D.changeOrder(shop, id, { paid: amount });
    shop = D.changeOrder(shop, id, { status: 'completed' });
  }
  for (let i = 0; i < followups; i++) shop = D.changeOrder(shop, 'sample-' + (3 + i), { followup: D.dateKey(day + 2), lastFollowupAt: new Date().toISOString() });
  if (edits) shop = D.changeOrder(shop, 'sample-7', { notes: `Pickup revised during simulated day ${day + 1}.` });
  if (cancellations) shop = D.changeOrder(shop, 'sample-8', { status: 'cancelled' });
  const jobs = { newOrder: incoming, quote: incoming, deposit: incoming, balance: incoming, delivery: incoming, followup: followups, edit: edits, cancel: cancellations };
  const navigation = 4; // Morning Today, follow-up tab, Orders, return to Today.
  const taps = Object.entries(jobs).reduce((n, [job, count]) => n + count * counts[job], navigation);
  workload.push({ day: day + 1, ...jobs, navigation, taps }); interactions.push(taps);
}
const big = D.blank(); big.orders = Array.from({ length: 10000 }, (_, i) => ({ ...base.orders[i % base.orders.length], id: 'load-' + i, number: i + 1 })); big.sequence = 10001;
const time = performance.now(); D.normalize(big); const validateMs = performance.now() - time;
const start = performance.now(); D.summary(big); D.filtered(big, 'active', 'Priya'); const queryMs = performance.now() - start;
assert.throws(() => D.normalize({ ...big, orders: [...big.orders, { ...big.orders[0], id: 'overflow', number: 10001 }], sequence: 10002 }));
const report = { sampleOrders: base.orders.length, sampleBytes: D.size(base), simulatedOrders: shop.orders.length, simulatedBytes: D.size(shop), largeStore: { orders: 10000, recordBytes: D.size(big), validateMs: Math.round(validateMs), summaryAndSearchMs: Math.round(queryMs) }, interactionCounts: counts, week: workload, averageInteractionsPerDay: Math.round(interactions.reduce((a, b) => a + b, 0) / 7 * 10) / 10, totalInteractions: interactions.reduce((a, b) => a + b, 0), assumptions: 'Seeded scenario, not a survey or observed average. Counts are control activations plus one field-entry interaction per field; individual keystrokes, scrolling, date-picker steps, and sending messages in Instagram/WhatsApp are excluded. Per-order actions start with the relevant row visible. Four navigation actions per day are included. Deposits are 50%, payments verified externally. Same-day fulfilment is a simplification; future-dated simulation steps test storage, not historical financial reporting.' };
await fs.mkdir(new URL('./checks/', import.meta.url), { recursive: true });
await fs.writeFile(new URL('./checks/simulation.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log('PASS: build syntax, real sample totals, payment/graph changes, unpaid completed follow-ups, snooze, delivery priority, legacy normalization, restore round trip, CSV escaping, invalid data, capacity limit, and simulated shop week.');
