import { ColumnMapping, TargetFieldSpec } from '../types';

/**
 * Normalizes header string for fuzzy matching (lowercase, no spaces, no special characters).
 */
export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Automatically maps source headers to target platform fields.
 */
export function autoMatchColumns(
  sourceHeaders: string[],
  targetFields: TargetFieldSpec[]
): ColumnMapping {
  const mapping: ColumnMapping = {};

  targetFields.forEach((field) => {
    let bestMatch = '';
    const targetNormalized = normalizeHeader(field.key);

    // 1. Exact match on target key
    const exactMatch = sourceHeaders.find(
      (h) => normalizeHeader(h) === targetNormalized
    );

    if (exactMatch) {
      bestMatch = exactMatch;
    } else {
      // 2. Exact match against field synonyms
      for (const synonym of field.synonyms) {
        const synNormalized = normalizeHeader(synonym);
        const match = sourceHeaders.find(
          (h) => normalizeHeader(h) === synNormalized
        );
        if (match) {
          bestMatch = match;
          break;
        }
      }

      // 3. Substring match against field key or synonyms (e.g. "Price (INR)" -> "price")
      if (!bestMatch) {
        for (const synonym of [field.key, ...field.synonyms]) {
          const synNormalized = normalizeHeader(synonym);
          if (synNormalized.length < 3) continue; // Skip short terms like 'id' for partial match
          const match = sourceHeaders.find((h) => {
            const hNorm = normalizeHeader(h);
            return hNorm.includes(synNormalized) || synNormalized.includes(hNorm);
          });
          if (match) {
            bestMatch = match;
            break;
          }
        }
      }
    }

    if (bestMatch) {
      mapping[field.key] = bestMatch;
    }
  });

  return mapping;
}
