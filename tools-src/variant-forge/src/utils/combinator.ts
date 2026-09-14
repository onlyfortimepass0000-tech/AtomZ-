import { ProductDetails, OptionGroup, SkuSettings, Variant } from '../types/variant';
import { generateSku } from './skuGenerator';

export function calculateTotalCombinations(optionGroups: OptionGroup[]): number {
  if (optionGroups.length === 0) return 0;
  return optionGroups.reduce((acc, group) => {
    const count = group.values.filter(v => v.value.trim() !== '').length;
    return count > 0 ? acc * count : acc;
  }, 1);
}

export function generateCartesianProduct(optionGroups: OptionGroup[]): Record<string, string>[] {
  const validGroups = optionGroups.filter(g => g.name.trim() !== '' && g.values.some(v => v.value.trim() !== ''));
  if (validGroups.length === 0) return [];

  const results: Record<string, string>[] = [];

  function helper(groupIndex: number, currentCombo: Record<string, string>) {
    if (groupIndex === validGroups.length) {
      results.push({ ...currentCombo });
      return;
    }

    const currentGroup = validGroups[groupIndex];
    const validValues = currentGroup.values.filter(v => v.value.trim() !== '');

    for (const valObj of validValues) {
      currentCombo[currentGroup.name] = valObj.value.trim();
      helper(groupIndex + 1, currentCombo);
    }
  }

  helper(0, {});
  return results;
}

export function createVariantTitle(combo: Record<string, string>, optionGroups: OptionGroup[]): string {
  const parts: string[] = [];
  for (const group of optionGroups) {
    if (combo[group.name]) {
      parts.push(combo[group.name]);
    }
  }
  return parts.join(' / ') || 'Default Variant';
}

export function generateInternalBarcode(sku: string, index: number): string {
  const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, '');
  if (cleanSku) {
    return `${cleanSku}`;
  }
  return `INT${String(index + 1).padStart(6, '0')}`;
}

export function generateVariants(
  productDetails: ProductDetails,
  optionGroups: OptionGroup[],
  skuSettings: SkuSettings
): Variant[] {
  const combinations = generateCartesianProduct(optionGroups);
  const basePrice = typeof productDetails.price === 'number' ? productDetails.price : parseFloat(productDetails.price) || 0;
  const comparePrice = productDetails.compareAtPrice ? parseFloat(String(productDetails.compareAtPrice)) || null : null;
  const costPrice = productDetails.costPrice ? parseFloat(String(productDetails.costPrice)) || null : null;

  return combinations.map((combo, idx) => {
    const title = createVariantTitle(combo, optionGroups);
    const optionValues = optionGroups.map(g => combo[g.name] || '');
    const sku = generateSku(productDetails.baseSku, optionValues, skuSettings);
    const barcode = generateInternalBarcode(sku, idx);

    return {
      id: `var_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      options: combo,
      sku,
      price: basePrice,
      compareAtPrice: comparePrice,
      costPrice: costPrice,
      inventory: 10,
      barcode,
      isInternalBarcode: true,
      status: 'READY',
      validationErrors: [],
    };
  });
}

export function findMissingCombinations(
  existingVariants: Variant[],
  optionGroups: OptionGroup[]
): Record<string, string>[] {
  const allCombos = generateCartesianProduct(optionGroups);
  if (allCombos.length === 0) return [];

  const existingComboKeys = new Set<string>();

  for (const variant of existingVariants) {
    // Create normalized key for comparison
    const key = Object.entries(variant.options)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, v]) => `${k.toLowerCase().trim()}:${v.toLowerCase().trim()}`)
      .join('|');
    if (key) {
      existingComboKeys.add(key);
    }
  }

  return allCombos.filter(combo => {
    const key = Object.entries(combo)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, v]) => `${k.toLowerCase().trim()}:${v.toLowerCase().trim()}`)
      .join('|');
    return !existingComboKeys.has(key);
  });
}
