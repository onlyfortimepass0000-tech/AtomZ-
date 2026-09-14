import { SkuConflict } from '../types/variant';

export const DEFAULT_ABBREVIATIONS: Record<string, string> = {
  // Colors
  'black': 'BLK',
  'white': 'WHT',
  'navy': 'NVY',
  'blue': 'BLU',
  'red': 'RED',
  'green': 'GRN',
  'yellow': 'YEL',
  'grey': 'GRY',
  'gray': 'GRY',
  'brown': 'BRN',
  'pink': 'PNK',
  'purple': 'PRP',
  'orange': 'ORG',
  'beige': 'BGE',
  'charcoal': 'CHR',
  'maroon': 'MRN',
  'olive': 'OLV',
  'teal': 'TEL',
  'gold': 'GLD',
  'silver': 'SLV',

  // Sizes
  'extra extra small': 'XXS',
  'xxs': 'XXS',
  'extra small': 'XS',
  'xs': 'XS',
  'small': 'S',
  's': 'S',
  'medium': 'M',
  'm': 'M',
  'large': 'L',
  'l': 'L',
  'extra large': 'XL',
  'xl': 'XL',
  'double xl': '2XL',
  '2xl': '2XL',
  'xxl': '2XL',
  '3xl': '3XL',
  'triple xl': '3XL',
  '4xl': '4XL',
  'free size': 'FS',
  'one size': 'OS',

  // Fits
  'regular': 'REG',
  'oversized': 'OVR',
  'slim': 'SLM',
  'relaxed': 'RLX',
  'loose': 'LSE',
  'skinny': 'SKN',
  'tailored': 'TLR',

  // Materials & Styles
  'cotton': 'CTN',
  'polyester': 'PLY',
  'leather': 'LTR',
  'denim': 'DNM',
  'wool': 'WOL',
  'silk': 'SLK',
  'linen': 'LNN',
  'nylon': 'NYL',
  'suede': 'SDE'
};

export function getAbbreviation(value: string, customMap?: Record<string, string>): string {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();
  const lowerKey = trimmed.toLowerCase();

  // 1. Check custom overrides first
  if (customMap && customMap[lowerKey]) {
    return customMap[lowerKey].toUpperCase();
  }

  // 2. Check built-in dictionary
  if (DEFAULT_ABBREVIATIONS[lowerKey]) {
    return DEFAULT_ABBREVIATIONS[lowerKey];
  }

  // 3. Fallback smart abbreviation logic
  const words = trimmed.split(/[\s\-_]+/);
  if (words.length > 1) {
    // Multi-word: take first letter of each word (e.g. "Light Blue" -> "LB")
    return words.map(w => w.charAt(0)).join('').toUpperCase();
  } else {
    // Single word
    if (trimmed.length <= 3) {
      return trimmed.toUpperCase();
    }
    // Take consonants or first 3 letters
    const consonants = trimmed.replace(/[aeiouAEIOU\s\-_]/g, '');
    if (consonants.length >= 3) {
      return (trimmed.charAt(0) + consonants.substring(1, 3)).toUpperCase();
    }
    return trimmed.substring(0, 3).toUpperCase();
  }
}

export function detectAbbreviationConflicts(
  values: string[],
  customMap?: Record<string, string>
): SkuConflict[] {
  const map = new Map<string, string>(); // abbreviation -> original value
  const conflicts: SkuConflict[] = [];

  for (const val of values) {
    const trimmed = val.trim();
    if (!trimmed) continue;

    const abbr = getAbbreviation(trimmed, customMap);
    if (!abbr) continue;

    if (map.has(abbr)) {
      const existingVal = map.get(abbr)!;
      if (existingVal.toLowerCase() !== trimmed.toLowerCase()) {
        conflicts.push({
          value1: existingVal,
          value2: trimmed,
          abbreviation: abbr
        });
      }
    } else {
      map.set(abbr, trimmed);
    }
  }

  return conflicts;
}
