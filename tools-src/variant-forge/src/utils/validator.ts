import { Variant, ProductDetails } from '../types/variant';

export function validateVariants(
  variants: Variant[],
  productDetails?: ProductDetails
): Variant[] {
  const skuCounts = new Map<string, number>();
  const comboCounts = new Map<string, number>();
  const barcodeCounts = new Map<string, number>();

  // Pass 1: Count occurrences of SKUs, combos, barcodes
  for (const v of variants) {
    if (v.sku && v.sku.trim()) {
      const normalizedSku = v.sku.trim().toUpperCase();
      skuCounts.set(normalizedSku, (skuCounts.get(normalizedSku) || 0) + 1);
    }

    if (v.barcode && v.barcode.trim()) {
      const normalizedBarcode = v.barcode.trim();
      barcodeCounts.set(normalizedBarcode, (barcodeCounts.get(normalizedBarcode) || 0) + 1);
    }

    const comboKey = Object.entries(v.options)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, val]) => `${k.toLowerCase().trim()}:${val.toLowerCase().trim()}`)
      .join('|');
    if (comboKey) {
      comboCounts.set(comboKey, (comboCounts.get(comboKey) || 0) + 1);
    }
  }

  // Pass 2: Evaluate individual variants
  return variants.map(v => {
    const errors: string[] = [];

    // SKU Checks
    if (!v.sku || !v.sku.trim()) {
      errors.push('SKU is missing');
    } else {
      const normalizedSku = v.sku.trim().toUpperCase();
      if ((skuCounts.get(normalizedSku) || 0) > 1) {
        errors.push(`Duplicate SKU "${v.sku}"`);
      }
      if (/[^\w\-_]/g.test(v.sku)) {
        errors.push('SKU contains special characters or spaces');
      }
    }

    // Combination Checks
    const comboKey = Object.entries(v.options)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, val]) => `${k.toLowerCase().trim()}:${val.toLowerCase().trim()}`)
      .join('|');
    if (comboKey && (comboCounts.get(comboKey) || 0) > 1) {
      errors.push('Duplicate option combination');
    }

    // Blank Option Values Check
    for (const [optName, optVal] of Object.entries(v.options)) {
      if (!optVal || !optVal.trim()) {
        errors.push(`Blank value for option "${optName}"`);
      }
    }

    // Price Checks
    if (typeof v.price !== 'number' || isNaN(v.price) || v.price < 0) {
      errors.push('Invalid price value');
    }

    // Inventory Checks
    if (typeof v.inventory !== 'number' || isNaN(v.inventory) || v.inventory < 0) {
      errors.push('Invalid inventory quantity');
    }

    // Barcode Duplicate Check
    if (v.barcode && v.barcode.trim()) {
      const normalizedBarcode = v.barcode.trim();
      if ((barcodeCounts.get(normalizedBarcode) || 0) > 1) {
        errors.push(`Duplicate barcode "${v.barcode}"`);
      }
    }

    // Base Product Check
    if (productDetails && (!productDetails.baseSku || !productDetails.baseSku.trim())) {
      errors.push('Base Product SKU is missing');
    }

    const status = errors.length === 0 ? 'READY' : 'NEEDS_FIX';

    return {
      ...v,
      status,
      validationErrors: errors
    };
  });
}
