import { jsPDF } from 'jspdf';
import { PickItem, PackingOrder, SortField, SlipLayout } from '../types/pickPack';

function findHeader(row: any, candidates: string[]): string | null {
  if (!row) return null;
  const keys = Object.keys(row);
  for (const cand of candidates) {
    const matched = keys.find(k => k.trim().toLowerCase() === cand.toLowerCase() || k.trim().toLowerCase().includes(cand.toLowerCase()));
    if (matched) return matched;
  }
  return null;
}

function parseNum(val: any): number {
  if (val === null || val === undefined) return 1;
  if (typeof val === 'number') return isNaN(val) ? 1 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed <= 0 ? 1 : parsed;
}

export function parseAndGroupOrders(rows: any[]): {
  pickingList: PickItem[];
  packingOrders: PackingOrder[];
} {
  if (rows.length === 0) return { pickingList: [], packingOrders: [] };
  const sample = rows[0];

  const orderIdH = findHeader(sample, ['order id', 'order #', 'order number', 'id']);
  const skuH = findHeader(sample, ['sku', 'item sku', 'code']);
  const nameH = findHeader(sample, ['product', 'item name', 'title']);
  const varH = findHeader(sample, ['variant', 'option', 'size']);
  const qtyH = findHeader(sample, ['quantity', 'qty', 'units']);
  const custH = findHeader(sample, ['customer', 'name', 'buyer']);
  const phoneH = findHeader(sample, ['phone', 'mobile']);
  const addrH = findHeader(sample, ['address', 'street']);
  const pinH = findHeader(sample, ['pincode', 'pin', 'zip']);
  const binH = findHeader(sample, ['bin', 'shelf', 'location']);

  const pickMap = new Map<string, PickItem>();
  const orderMap = new Map<string, PackingOrder>();

  rows.forEach((row, idx) => {
    const orderId = String(row[orderIdH || 'Order ID'] || `ORD-${1000 + idx}`).trim();
    const sku = String(row[skuH || 'SKU'] || `SKU-${idx + 1}`).trim().toUpperCase();
    const productName = String(row[nameH || 'Product Name'] || sku).trim();
    const variant = String(row[varH || 'Variant'] || '').trim();
    const qty = parseNum(row[qtyH || 'Quantity']);
    const binLocation = String(row[binH || 'Bin Location'] || 'DEFAULT').trim();

    const customerName = String(row[custH || 'Customer Name'] || 'Customer').trim();
    const phone = String(row[phoneH || 'Phone'] || '').trim();
    const address = String(row[addrH || 'Address'] || '').trim();
    const pinCode = String(row[pinH || 'PIN Code'] || '').trim();

    // 1. Accumulate Picking List
    const pickKey = `${sku}_${variant}`;
    if (!pickMap.has(pickKey)) {
      pickMap.set(pickKey, {
        sku,
        productName,
        variant,
        binLocation,
        totalQuantity: qty,
        checked: false,
      });
    } else {
      const item = pickMap.get(pickKey)!;
      item.totalQuantity += qty;
    }

    // 2. Accumulate Packing Slips
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        orderId,
        customerName,
        phone,
        address,
        pinCode,
        items: [{ sku, productName, variant, quantity: qty }],
      });
    } else {
      const ord = orderMap.get(orderId)!;
      ord.items.push({ sku, productName, variant, quantity: qty });
    }
  });

  return {
    pickingList: Array.from(pickMap.values()),
    packingOrders: Array.from(orderMap.values()),
  };
}

export function sortPickingList(items: PickItem[], sortField: SortField): PickItem[] {
  return [...items].sort((a, b) => {
    if (sortField === 'SKU') return a.sku.localeCompare(b.sku);
    if (sortField === 'PRODUCT') return a.productName.localeCompare(b.productName);
    if (sortField === 'BIN') return a.binLocation.localeCompare(b.binLocation);
    return 0;
  });
}

export function generatePackingSlipsPdf(
  orders: PackingOrder[],
  layout: SlipLayout,
  includeAddress: boolean,
  includePhone: boolean
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const slipsPerPage = layout === '1_PER_PAGE' ? 1 : (layout === '2_PER_PAGE' ? 2 : 4);
  const rows = layout === '4_PER_PAGE' ? 2 : (layout === '2_PER_PAGE' ? 2 : 1);
  const cols = layout === '4_PER_PAGE' ? 2 : 1;

  const cellWidth = pageWidth / cols;
  const cellHeight = pageHeight / rows;

  orders.forEach((order, index) => {
    if (index > 0 && index % slipsPerPage === 0) {
      doc.addPage();
    }

    const posOnPage = index % slipsPerPage;
    const colIdx = posOnPage % cols;
    const rowIdx = Math.floor(posOnPage / cols);

    const x = colIdx * cellWidth + 10;
    const y = rowIdx * cellHeight + 10;

    // Draw Slip Box Border
    doc.setDrawColor(200, 200, 200);
    doc.rect(x - 5, y - 5, cellWidth - 10, cellHeight - 10);

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`PACKING SLIP — ${order.orderId}`, x, y + 5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer: ${order.customerName}`, x, y + 12);
    if (includePhone && order.phone) {
      doc.text(`Phone: ${order.phone}`, x, y + 17);
    }
    if (includeAddress && order.address) {
      doc.text(`Address: ${order.address} ${order.pinCode}`, x, y + (includePhone ? 22 : 17));
    }

    // Items table
    let itemY = y + (includeAddress ? 30 : 22);
    doc.setFont('helvetica', 'bold');
    doc.text('SKU / Product', x, itemY);
    doc.text('Qty', x + cellWidth - 25, itemY);
    doc.line(x, itemY + 2, x + cellWidth - 20, itemY + 2);

    itemY += 7;
    doc.setFont('helvetica', 'normal');
    order.items.forEach(item => {
      if (itemY < y + cellHeight - 15) {
        doc.text(`${item.sku} - ${item.productName.substring(0, 20)}`, x, itemY);
        doc.text(`x${item.quantity}`, x + cellWidth - 25, itemY);
        itemY += 5;
      }
    });
  });

  return doc;
}
