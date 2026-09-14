import { Variant, BulkEditOptions } from '../types/variant';

export function applyBulkEdit(
  variants: Variant[],
  options: BulkEditOptions
): Variant[] {
  const { action, targetValue, targetOptionName, targetOptionValue } = options;

  return variants.map(variant => {
    const copy = { ...variant };

    // Check if variant matches target option filter if specified
    const matchesOptionFilter =
      !targetOptionName ||
      !targetOptionValue ||
      (variant.options[targetOptionName] &&
        variant.options[targetOptionName].toLowerCase().trim() === targetOptionValue.toLowerCase().trim());

    if (!matchesOptionFilter) {
      return copy;
    }

    switch (action) {
      case 'SET_ALL_PRICES':
        copy.price = Math.max(0, targetValue);
        break;

      case 'SET_ALL_INVENTORY':
        copy.inventory = Math.max(0, Math.round(targetValue));
        break;

      case 'ADD_PRICE_DELTA':
        copy.price = Math.max(0, copy.price + targetValue);
        break;

      case 'SET_OPTION_PRICE':
        copy.price = Math.max(0, targetValue);
        break;
    }

    return copy;
  });
}
