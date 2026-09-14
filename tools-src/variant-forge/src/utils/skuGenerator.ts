import { SkuSettings } from '../types/variant';
import { getAbbreviation } from './abbreviations';

export function sanitizeSkuPart(str: string): string {
  return str
    .trim()
    .replace(/[^a-zA-Z0-9]/g, '');
}

export function generateSku(
  baseSku: string,
  optionValues: string[],
  settings: SkuSettings
): string {
  const parts: string[] = [];

  const cleanBase = sanitizeSkuPart(baseSku);
  if (cleanBase) {
    parts.push(cleanBase);
  }

  for (const val of optionValues) {
    if (!val || !val.trim()) continue;
    
    let formattedVal = '';
    if (settings.useAbbreviations) {
      formattedVal = getAbbreviation(val, settings.customAbbreviations);
    } else {
      formattedVal = sanitizeSkuPart(val);
    }

    if (formattedVal) {
      parts.push(formattedVal);
    }
  }

  let skuResult = parts.join(settings.separator);

  if (settings.casing === 'lowercase') {
    skuResult = skuResult.toLowerCase();
  } else {
    skuResult = skuResult.toUpperCase();
  }

  return skuResult;
}
