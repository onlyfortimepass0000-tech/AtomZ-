import { InventoryItem, ReconcileSummary } from '../types/stockSync';

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
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function reconcileModeA(
  openingRows: any[],
  salesRows: any[],
  returnsRows: any[] = []
): { items: InventoryItem[]; summary: ReconcileSummary } {
  const itemMap = new Map<string, InventoryItem>();

  // 1. Process Opening Stock
  if (openingRows.length > 0) {
    const skuH = findHeader(openingRows[0], ['sku', 'item sku', 'variant sku', 'code']);
    const nameH = findHeader(openingRows[0], ['product', 'item name', 'title', 'name']);
    const stockH = findHeader(openingRows[0], ['stock', 'opening', 'quantity', 'qty', 'opening stock']);

    openingRows.forEach(row => {
      const sku = String(row[skuH || 'SKU'] || '').trim().toUpperCase();
      if (!sku) return;

      const productName = String(row[nameH || 'Product'] || sku);
      const openingStock = parseNum(row[stockH || 'Stock']);

      itemMap.set(sku, {
        sku,
        productName,
        openingStock,
        soldQuantity: 0,
        returnedQuantity: 0,
        expectedStock: openingStock,
        systemStock: openingStock,
        physicalStock: 0,
        difference: 0,
        status: 'MATCH',
        notes: [],
      });
    });
  }

  // 2. Accumulate Sales
  if (salesRows.length > 0) {
    const skuH = findHeader(salesRows[0], ['sku', 'item sku', 'code']);
    const qtyH = findHeader(salesRows[0], ['quantity', 'qty', 'units', 'sold']);

    salesRows.forEach(row => {
      const sku = String(row[skuH || 'SKU'] || '').trim().toUpperCase();
      if (!sku) return;
      const qty = parseNum(row[qtyH || 'Quantity']);

      if (!itemMap.has(sku)) {
        itemMap.set(sku, {
          sku,
          productName: `Unknown SKU (${sku})`,
          openingStock: 0,
          soldQuantity: qty,
          returnedQuantity: 0,
          expectedStock: -qty,
          systemStock: 0,
          physicalStock: 0,
          difference: -qty,
          status: 'UNKNOWN_SKU',
          notes: ['SKU found in sales sheet but missing in Opening inventory'],
        });
      } else {
        const item = itemMap.get(sku)!;
        item.soldQuantity += qty;
      }
    });
  }

  // 3. Accumulate Returns
  if (returnsRows.length > 0) {
    const skuH = findHeader(returnsRows[0], ['sku', 'item sku', 'code']);
    const qtyH = findHeader(returnsRows[0], ['quantity', 'qty', 'returned', 'restocked']);

    returnsRows.forEach(row => {
      const sku = String(row[skuH || 'SKU'] || '').trim().toUpperCase();
      if (!sku) return;
      const qty = parseNum(row[qtyH || 'Quantity']);

      if (itemMap.has(sku)) {
        const item = itemMap.get(sku)!;
        item.returnedQuantity += qty;
      }
    });
  }

  // 4. Calculate Final Expected Stock & Status
  const items: InventoryItem[] = Array.from(itemMap.values()).map(item => {
    const expected = item.openingStock - item.soldQuantity + item.returnedQuantity;
    item.expectedStock = expected;
    item.difference = expected - item.openingStock;

    if (item.status !== 'UNKNOWN_SKU') {
      if (expected < 0) {
        item.status = 'NEGATIVE_STOCK';
        item.notes.push('Calculated stock is negative');
      } else if (item.soldQuantity > 0 || item.returnedQuantity > 0) {
        item.status = 'DISCREPANCY'; // Stock changed due to activity
      } else {
        item.status = 'MATCH';
      }
    }
    return item;
  });

  const discrepancyCount = items.filter(i => i.status !== 'MATCH').length;
  const totalVariance = items.reduce((acc, i) => acc + (i.soldQuantity - i.returnedQuantity), 0);

  return {
    items,
    summary: {
      totalSkusEvaluated: items.length,
      matchingSkusCount: items.length - discrepancyCount,
      discrepancyCount,
      missingSkusCount: items.filter(i => i.status === 'UNKNOWN_SKU').length,
      totalVariance,
    },
  };
}

export function reconcileModeB(
  systemRows: any[],
  physicalRows: any[]
): { items: InventoryItem[]; summary: ReconcileSummary } {
  const itemMap = new Map<string, InventoryItem>();

  // 1. Process System Inventory
  if (systemRows.length > 0) {
    const skuH = findHeader(systemRows[0], ['sku', 'item sku', 'code']);
    const nameH = findHeader(systemRows[0], ['product', 'title', 'name']);
    const stockH = findHeader(systemRows[0], ['system', 'stock', 'quantity', 'qty']);

    systemRows.forEach(row => {
      const sku = String(row[skuH || 'SKU'] || '').trim().toUpperCase();
      if (!sku) return;

      const productName = String(row[nameH || 'Product'] || sku);
      const systemStock = parseNum(row[stockH || 'Stock']);

      itemMap.set(sku, {
        sku,
        productName,
        openingStock: systemStock,
        soldQuantity: 0,
        returnedQuantity: 0,
        expectedStock: systemStock,
        systemStock,
        physicalStock: 0, // Will be updated by physical audit
        difference: -systemStock,
        status: 'DISCREPANCY',
        notes: [],
      });
    });
  }

  // 2. Match Physical Stock Audit
  if (physicalRows.length > 0) {
    const skuH = findHeader(physicalRows[0], ['sku', 'item sku', 'code']);
    const qtyH = findHeader(physicalRows[0], ['physical', 'count', 'quantity', 'qty', 'actual']);

    physicalRows.forEach(row => {
      const sku = String(row[skuH || 'SKU'] || '').trim().toUpperCase();
      if (!sku) return;
      const physicalStock = parseNum(row[qtyH || 'Quantity']);

      if (!itemMap.has(sku)) {
        itemMap.set(sku, {
          sku,
          productName: `Unknown Physical SKU (${sku})`,
          openingStock: 0,
          soldQuantity: 0,
          returnedQuantity: 0,
          expectedStock: 0,
          systemStock: 0,
          physicalStock,
          difference: physicalStock,
          status: 'MISSING_IN_SYSTEM',
          notes: ['SKU found in physical count but missing from system inventory'],
        });
      } else {
        const item = itemMap.get(sku)!;
        item.physicalStock = physicalStock;
      }
    });
  }

  // 3. Compute Differences
  const items: InventoryItem[] = Array.from(itemMap.values()).map(item => {
    item.difference = item.physicalStock - item.systemStock;

    if (item.status !== 'MISSING_IN_SYSTEM') {
      if (item.difference === 0) {
        item.status = 'MATCH';
      } else {
        item.status = 'DISCREPANCY';
        if (item.difference < 0) {
          item.notes.push(`Shortage of ${Math.abs(item.difference)} units`);
        } else {
          item.notes.push(`Overage of +${item.difference} units`);
        }
      }
    }
    return item;
  });

  const discrepancyCount = items.filter(i => i.status !== 'MATCH').length;
  const totalVariance = items.reduce((acc, i) => acc + i.difference, 0);

  return {
    items,
    summary: {
      totalSkusEvaluated: items.length,
      matchingSkusCount: items.length - discrepancyCount,
      discrepancyCount,
      missingSkusCount: items.filter(i => i.status === 'MISSING_IN_SYSTEM').length,
      totalVariance,
    },
  };
}
