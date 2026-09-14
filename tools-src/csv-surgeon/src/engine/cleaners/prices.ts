export function cleanPrice(val: any, targetCurrencySuffix: string = ''): { cleaned: string; changed: boolean; isValid: boolean } {
  if (val === null || val === undefined || String(val).trim() === '') {
    return { cleaned: '', changed: false, isValid: false };
  }

  const orig = String(val).trim();

  // Strip leading/trailing currency symbols, words like Rs., INR, $, ₹, etc.
  let str = orig
    .replace(/^(₹|\$|€|£|¥|Rs\.?|INR|USD|EUR|GBP|CAD|AUD|\s)+/gi, '')
    .replace(/(₹|\$|€|£|¥|Rs\.?|INR|USD|EUR|GBP|CAD|AUD|\s)+$/gi, '')
    .trim();

  // Handle thousand separators e.g. "1,299.00" -> "1299.00" or "1,299" -> "1299"
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(str)) {
    str = str.replace(/,/g, '');
  } else if (/^\d+(,\d{2})$/.test(str)) {
    str = str.replace(',', '.');
  } else {
    // Strip remaining internal commas if any numbers
    str = str.replace(/,/g, '');
  }

  const num = parseFloat(str);
  const isValid = !isNaN(num) && num >= 0;

  if (!isValid) {
    return { cleaned: orig, changed: false, isValid: false };
  }

  let cleaned = Number.isInteger(num) ? num.toString() : num.toFixed(2);
  if (targetCurrencySuffix) {
    cleaned = `${cleaned} ${targetCurrencySuffix}`.trim();
  }

  return {
    cleaned,
    changed: cleaned !== orig,
    isValid: true,
  };
}
