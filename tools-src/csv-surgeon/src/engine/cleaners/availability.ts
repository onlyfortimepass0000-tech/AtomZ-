import { PlatformDestination } from '../../types/surgeon';

export function normalizeAvailability(
  val: any,
  platform: PlatformDestination = 'GENERIC'
): { cleaned: string; changed: boolean; isRecognized: boolean } {
  if (val === null || val === undefined) {
    return { cleaned: '', changed: false, isRecognized: false };
  }

  const str = String(val).trim().toLowerCase();
  if (!str) return { cleaned: '', changed: false, isRecognized: false };

  // Target values based on destination
  let inStockTarget = 'in_stock';
  let outOfStockTarget = 'out_of_stock';

  if (platform === 'META') {
    inStockTarget = 'in stock';
    outOfStockTarget = 'out of stock';
  } else if (platform === 'SHOPIFY') {
    inStockTarget = 'in_stock';
    outOfStockTarget = 'out_of_stock';
  }

  const inStockSynonyms = new Set(['yes', 'available', 'in stock', 'instock', '1', 'true', 'y', 'in_stock', 'active']);
  const outOfStockSynonyms = new Set(['no', 'sold out', 'out of stock', 'outofstock', '0', 'false', 'n', 'out_of_stock', 'inactive', 'draft']);

  if (inStockSynonyms.has(str)) {
    return {
      cleaned: inStockTarget,
      changed: str !== inStockTarget,
      isRecognized: true,
    };
  }

  if (outOfStockSynonyms.has(str)) {
    return {
      cleaned: outOfStockTarget,
      changed: str !== outOfStockTarget,
      isRecognized: true,
    };
  }

  return {
    cleaned: String(val).trim(),
    changed: false,
    isRecognized: false,
  };
}
