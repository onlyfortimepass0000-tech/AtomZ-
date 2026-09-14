/**
 * Safely removes currency symbols (₹, $, €, £, etc.) and formats numeric price string.
 */
export function cleanPrice(value: any): string {
  if (value === null || value === undefined) return '';

  const str = String(value).trim();
  if (!str) return '';

  // Remove currency symbols & common currency codes
  let cleaned = str
    .replace(/[₹$€£¥₹]/g, '')
    .replace(/\b(inr|usd|eur|gbp|aud|cad|rs|rs\.)\b/gi, '')
    .replace(/,/g, '') // Remove thousand separators
    .trim();

  // If result is valid decimal number (e.g. 1299.99)
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num >= 0 && /^\d+(\.\d+)?$/.test(cleaned)) {
    return num.toFixed(2);
  }

  return str; // Return original if non-numeric/invalid so validator can flag it
}

/**
 * Normalizes stock availability values to platform standard: 'in stock' or 'out of stock'.
 */
export function normalizeAvailability(value: any): string {
  if (value === null || value === undefined) return 'out of stock';

  const str = String(value).trim().toLowerCase();
  if (!str) return 'out of stock';

  const inStockTerms = ['in stock', 'instock', 'yes', 'y', 'available', '1', 'true', 'in_stock'];
  const outOfStockTerms = ['out of stock', 'outofstock', 'no', 'n', 'sold out', 'soldout', 'unavailable', '0', 'false', 'out_of_stock'];

  if (inStockTerms.includes(str)) return 'in stock';
  if (outOfStockTerms.includes(str)) return 'out of stock';

  // Check partial matches
  if (str.includes('in stock') || str.includes('available')) return 'in stock';
  if (str.includes('out') || str.includes('sold')) return 'out of stock';

  return 'in stock'; // Default fallback
}

/**
 * Normalizes product condition values: 'new', 'refurbished', 'used'.
 */
export function normalizeCondition(value: any): string {
  if (!value) return 'new';

  const str = String(value).trim().toLowerCase();
  if (str.includes('refurbish') || str.includes('renew')) return 'refurbished';
  if (str.includes('used') || str.includes('second')) return 'used';

  return 'new';
}

/**
 * Removes accidental HTML tags from product descriptions.
 */
export function stripHtmlTags(value: any): string {
  if (!value) return '';
  const str = String(value);
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Cleans malformed URLs (removes internal whitespace and prepends https:// if missing).
 */
export function cleanProductUrl(value: any): string {
  if (!value) return '';
  let str = String(value).trim().replace(/\s+/g, '');
  if (!str) return '';

  if (!/^https?:\/\//i.test(str)) {
    str = 'https://' + str;
  }
  return str;
}

/**
 * Trims extra spaces while preserving Unicode product titles & values.
 */
export function trimValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/[ \t]+/g, ' ');
}
