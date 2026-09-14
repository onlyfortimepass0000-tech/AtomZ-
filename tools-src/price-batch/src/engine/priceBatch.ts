import { CatalogPriceItem, PricingRule } from '../types/priceBatch';

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

export function parseCatalogRows(rows: any[]): CatalogPriceItem[] {
  if (rows.length === 0) return [];
  const sample = rows[0];

  const skuH = findHeader(sample, ['sku', 'item sku', 'code']);
  const nameH = findHeader(sample, ['product', 'title', 'item name', 'name']);
  const priceH = findHeader(sample, ['price', 'selling price', 'amount', 'unit price']);
  const costH = findHeader(sample, ['cost', 'unit cost', 'item cost', 'cogs']);
  const catH = findHeader(sample, ['category', 'product category', 'type']);
  const collH = findHeader(sample, ['collection', 'brand', 'group']);
  const varH = findHeader(sample, ['variant', 'option', 'size']);

  return rows.map((row, idx) => {
    const sku = String(row[skuH || 'SKU'] || `ITEM-${idx + 1}`).trim();
    const productName = String(row[nameH || 'Product'] || sku).trim();
    const price = parseNum(row[priceH || 'Price']);
    const cost = parseNum(row[costH || 'Cost']);
    const category = String(row[catH || 'Category'] || '').trim();
    const collection = String(row[collH || 'Collection'] || '').trim();
    const variant = String(row[varH || 'Variant'] || '').trim();

    const flags: string[] = [];
    if (price <= 0) flags.push('MISSING_PRICE');
    if (cost > 0 && cost >= price) flags.push('COST_GREATER_THAN_PRICE');

    return {
      id: `item_${idx + 1}`,
      sku,
      productName,
      category,
      collection,
      variant,
      cost,
      oldPrice: price,
      newPrice: price,
      changeAmount: 0,
      flags,
    };
  });
}

export function roundPrice(price: number, roundingType?: string): number {
  if (price <= 0) return 0;
  switch (roundingType) {
    case 'ENDING_99':
      return Math.floor(price / 100) * 100 + 99;
    case 'ENDING_49':
      return Math.floor(price / 100) * 100 + 49;
    case 'NEAREST_10':
      return Math.round(price / 10) * 10;
    case 'NEAREST_100':
      return Math.round(price / 100) * 100;
    default:
      return Math.round(price);
  }
}

export function applyPricingRule(
  items: CatalogPriceItem[],
  rule: PricingRule
): CatalogPriceItem[] {
  return items.map(item => {
    // Check filter match
    if (rule.filterField && rule.filterField !== 'ALL' && rule.filterValue) {
      const targetVal = String((item as any)[rule.filterField.toLowerCase()] || '').toLowerCase();
      if (!targetVal.includes(rule.filterValue.toLowerCase())) {
        return item; // Skip non-matching filter items
      }
    }

    let calculatedPrice = item.oldPrice;

    switch (rule.type) {
      case 'INCREASE_PCT':
        calculatedPrice = item.oldPrice * (1 + rule.value / 100);
        break;
      case 'DECREASE_PCT':
        calculatedPrice = item.oldPrice * (1 - rule.value / 100);
        break;
      case 'ADD_FIXED':
        calculatedPrice = item.oldPrice + rule.value;
        break;
      case 'MARKUP_COST':
        calculatedPrice = item.cost > 0 ? item.cost * (1 + rule.value / 100) : item.oldPrice;
        break;
      case 'MIN_MARGIN_PCT':
        if (item.cost > 0 && rule.value < 100) {
          const minPrice = item.cost / (1 - rule.value / 100);
          if (item.oldPrice < minPrice) {
            calculatedPrice = minPrice;
          }
        }
        break;
      case 'ROUND_ENDING':
        calculatedPrice = roundPrice(item.oldPrice, rule.roundingType);
        break;
    }

    if (rule.roundingType && rule.type !== 'ROUND_ENDING') {
      calculatedPrice = roundPrice(calculatedPrice, rule.roundingType);
    } else {
      calculatedPrice = Math.round(calculatedPrice);
    }

    const finalPrice = Math.max(0, calculatedPrice);
    const changeAmount = finalPrice - item.oldPrice;

    const flags: string[] = [];
    if (finalPrice <= 0) flags.push('NEGATIVE_PRICE');
    if (item.cost > 0 && item.cost >= finalPrice) flags.push('COST_GREATER_THAN_PRICE');

    return {
      ...item,
      newPrice: finalPrice,
      changeAmount,
      flags,
    };
  });
}
