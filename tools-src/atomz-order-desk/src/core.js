'use strict';
const Desk = (() => {
  const LIMIT = 10000, MAX_BYTES = 12 * 1024 * 1024;
  const stages = { enquiry: 'Enquiry', quoted: 'Quoted', booked: 'In progress', completed: 'Completed', cancelled: 'Cancelled' };
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
  const dateKey = (delta = 0, base = new Date()) => { const d = new Date(base); d.setDate(d.getDate() + delta); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const total = o => round(o.qty * o.price + o.delivery);
  const balance = o => round(Math.max(0, total(o) - o.paid));
  const depositDue = o => round(Math.max(0, round(total(o) * o.deposit / 100) - o.paid));
  const active = o => !['completed', 'cancelled'].includes(o.status);
  const confirmed = o => ['booked', 'completed'].includes(o.status);
  const blank = () => ({ version: 2, business: { name: 'Your shop', handle: '', terms: 'A 50% advance confirms your booking. Balance is due before delivery.' }, orders: [], sequence: 1001 });
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T12:00:00Z')) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s;
  const size = s => new TextEncoder().encode(JSON.stringify(s)).length;
  function normalize(input) {
    if (!input || ![1, 2].includes(input.version) || !input.business || !Array.isArray(input.orders) || input.orders.length > LIMIT || !Number.isSafeInteger(input.sequence)) throw Error('Choose a valid Order Desk backup (up to 10,000 orders).');
    const text = (v, max, required = false) => { if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw Error('A text field is missing or too long.'); return v; };
    const handle = value => { const v = text(value, 31).replace(/^@/, ''); if (v && !/^[A-Za-z0-9_.]{1,30}$/.test(v)) throw Error('Check the Instagram handle.'); return v; };
    const business = { name: text(input.business.name, 100, true), handle: handle(input.business.handle), terms: text(input.business.terms, 2000) };
    const ids = new Set(), numbers = new Set();
    const orders = input.orders.map(o => {
      if (!o || typeof o.id !== 'string' || !o.id || o.id.length > 100 || ids.has(o.id) || !Number.isSafeInteger(o.number) || o.number < 1 || numbers.has(o.number) || !Object.hasOwn(stages, o.status)) throw Error('An order ID or stage is invalid.');
      ids.add(o.id); numbers.add(o.number);
      const n = { id: o.id, number: o.number, status: o.status };
      for (const [k, max] of Object.entries({ customer: 100, product: 180, phone: 22, notes: 2000 })) n[k] = text(o[k], max, ['customer', 'product'].includes(k));
      n.handle = handle(o.handle);
      for (const [k, max] of Object.entries({ qty: 10000, price: 1e7, delivery: 1e7, deposit: 100, paid: 1e11 })) { if (typeof o[k] !== 'number' || !Number.isFinite(o[k]) || o[k] < 0 || o[k] > max) throw Error('An order amount is invalid.'); n[k] = o[k]; }
      if (!Number.isInteger(n.qty) || n.qty < 1 || n.price <= 0 || n.paid > total(n)) throw Error('Received payments cannot exceed the order total.');
      n.cost = o.cost ?? null;
      if (n.cost !== null && (typeof n.cost !== 'number' || !Number.isFinite(n.cost) || n.cost < 0 || n.cost > 1e11)) throw Error('Check the order cost.');
      if (!validDate(o.due) || (o.followup !== '' && !validDate(o.followup))) throw Error('Check the delivery and follow-up dates.');
      n.due = o.due; n.followup = o.followup;
      for (const k of ['createdAt', 'updatedAt', 'lastFollowupAt']) if (o[k]) { if (typeof o[k] !== 'string' || o[k].length > 40 || isNaN(Date.parse(o[k]))) throw Error('An order timestamp is invalid.'); n[k] = o[k]; }
      return n;
    });
    if (input.sequence < 1 || orders.some(o => o.number >= input.sequence)) throw Error('Order numbering is invalid.');
    const result = { version: 2, business, orders, sequence: input.sequence };
    if (size(result) > MAX_BYTES) throw Error('This workspace is over 12 MB. Export a backup and shorten long notes.');
    return result;
  }
  function reason(o, today = dateKey()) {
    if (o.status === 'cancelled') return '';
    if (o.status === 'booked' && o.due <= today) return o.due === today ? 'Delivery today' : 'Delivery overdue';
    if (o.lastFollowupAt && o.followup > today) return '';
    if (o.status === 'completed' && balance(o)) return 'Balance to collect';
    if (!active(o)) return '';
    if (o.followup && o.followup <= today) return o.status === 'enquiry' ? 'Reply to enquiry' : depositDue(o) ? 'Deposit to collect' : balance(o) ? 'Balance to collect' : 'Follow up';
    if (o.due < today) return 'Confirm new date';
    return '';
  }
  function summary(s, today = dateKey()) {
    const confirmedOrders = s.orders.filter(confirmed);
    return {
      open: s.orders.filter(active).length,
      deliveries: s.orders.filter(o => o.status === 'booked' && o.due <= today),
      followups: s.orders.filter(o => reason(o, today) && !(o.status === 'booked' && o.due <= today)),
      paid: round(confirmedOrders.reduce((n, o) => n + o.paid, 0)),
      outstanding: round(confirmedOrders.reduce((n, o) => n + balance(o), 0)),
      confirmedValue: round(confirmedOrders.reduce((n, o) => n + total(o), 0)),
      days: Array.from({ length: 7 }, (_, i) => { const date = dateKey(i - 6, new Date(today + 'T12:00:00')); const rows = s.orders.filter(o => o.status === 'completed' && o.due === date); return { date, value: round(rows.reduce((n, o) => n + total(o), 0)), count: rows.length }; })
    };
  }
  function filtered(s, filter = 'active', query = '', day = '') {
    return s.orders.filter(o => {
      if (query && !`${o.customer} ${o.product} ${o.handle} ${o.number}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (day && o.due !== day) return false;
      if (filter === 'active') return active(o);
      if (filter === 'all') return o.status !== 'cancelled';
      if (filter === 'attention') return !!reason(o);
      if (filter === 'outstanding') return confirmed(o) && balance(o) > 0;
      if (filter === 'paid') return confirmed(o) && o.paid > 0;
      return o.status === filter;
    }).sort((a, b) => (a.due.localeCompare(b.due)) || (b.number - a.number));
  }
  function changeOrder(s, id, patch) { return normalize({ ...s, orders: s.orders.map(o => o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o) }); }
  function sample() {
    const s = blank(); s.business = { name: 'Petal & Sugar', handle: '', terms: '50% advance confirms your booking. Balance due before pickup. Please confirm your design and pickup time before paying.' };
    const names = ['Priya Nair', 'Ananya Shah', 'Rohan Mehta', 'Meera Kapoor', 'Kavya Rao', 'Dev & Isha', 'Studio Olive', 'Aditi Sen', 'Neha Das', 'Arjun Roy', 'Tara Bose', 'Ria Saha', 'Mira Ali', 'Nisha Jain', 'Sana Khan', 'Ishaan Dey', 'Reva Pal', 'Anika Deb'];
    const products = ['Lemon bento cake', 'Floral birthday cake · 1 kg', 'Brownie gift box', 'Custom birthday hamper', 'Cookie box · 12 pieces', 'Anniversary dessert box'];
    for (let i = 0; i < 24; i++) {
      const status = i < 3 ? 'booked' : i < 5 ? 'quoted' : i < 7 ? 'enquiry' : i < 10 ? 'booked' : i === 23 ? 'cancelled' : 'completed';
      const delta = i < 3 ? (i === 2 ? -1 : 0) : i < 10 ? i - 3 : -(1 + (i % 7));
      const price = [1600, 1850, 750, 2400, 650, 950][i % 6], qty = i % 6 === 2 ? 3 : 1, delivery = i % 3 === 0 ? 100 : 0;
      const value = qty * price + delivery;
      s.orders.push({ id: 'sample-' + i, number: 1001 + i, customer: names[i % names.length], handle: '', phone: '', product: products[i % 6], qty, price, delivery, deposit: 50, paid: status === 'completed' ? (i === 12 ? value / 2 : value) : status === 'booked' ? (i === 1 ? value : value / 2) : 0, cost: Math.round(value * .43), status, due: dateKey(delta), followup: status === 'completed' ? '' : dateKey(i < 7 ? 0 : 2), notes: i === 0 ? 'Pickup at 5 pm. Eggless. Blue and white design.' : 'Confirm pickup time in chat.', createdAt: new Date(dateKey(delta - 5) + 'T09:00:00').toISOString() });
    }
    s.sequence = 1025; return normalize(s);
  }
  const csv = s => {
    const cell = v => { let x = String(v ?? ''); if (/^[=+@\-\t\r]/.test(x)) x = "'" + x; return '"' + x.replaceAll('"', '""') + '"'; };
    const rows = [['Order', 'Customer', 'Instagram', 'WhatsApp', 'Product', 'Quantity', 'Unit price INR', 'Delivery INR', 'Total INR', 'Deposit percent', 'Received INR', 'Balance INR', 'Stage', 'Delivery date', 'Follow-up date', 'Private cost INR', 'Customer notes']];
    s.orders.slice().sort((a, b) => b.number - a.number).forEach(o => rows.push([o.number, o.customer, o.handle, o.phone, o.product, o.qty, o.price, o.delivery, total(o), o.deposit, o.paid, balance(o), stages[o.status], o.due, o.followup, o.cost, o.notes]));
    return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
  };
  return { LIMIT, MAX_BYTES, stages, round, dateKey, total, balance, depositDue, active, confirmed, blank, normalize, size, reason, summary, filtered, changeOrder, sample, csv };
})();
