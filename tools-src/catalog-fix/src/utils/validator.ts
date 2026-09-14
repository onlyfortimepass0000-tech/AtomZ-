import {
  ColumnMapping,
  PlatformSpec,
  ProcessedProduct,
  ProductIssue,
} from '../types';
import {
  cleanPrice,
  cleanProductUrl,
  normalizeAvailability,
  normalizeCondition,
  stripHtmlTags,
  trimValue,
} from './normalizers';

/**
 * Validates and normalizes raw dataset into ProcessedProduct items.
 */
export function validateAndProcessCatalog(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping,
  platformSpec: PlatformSpec
): ProcessedProduct[] {
  // Step 1: Map and normalize each row
  const processed: ProcessedProduct[] = rawRows.map((rawRow, rowIndex) => {
    const data: Record<string, string> = {};

    // Map each platform field from column mapping
    platformSpec.fields.forEach((fieldSpec) => {
      const sourceCol = mapping[fieldSpec.key];
      const rawVal = sourceCol ? rawRow[sourceCol] : '';

      // Normalize according to field type
      if (fieldSpec.key === 'price' || fieldSpec.key === 'sale_price') {
        data[fieldSpec.key] = cleanPrice(rawVal);
      } else if (fieldSpec.key === 'availability') {
        data[fieldSpec.key] = normalizeAvailability(rawVal);
      } else if (fieldSpec.key === 'condition') {
        data[fieldSpec.key] = normalizeCondition(rawVal);
      } else if (fieldSpec.key === 'description') {
        data[fieldSpec.key] = stripHtmlTags(rawVal);
      } else if (fieldSpec.key === 'link' || fieldSpec.key === 'image_link') {
        data[fieldSpec.key] = cleanProductUrl(rawVal);
      } else {
        data[fieldSpec.key] = trimValue(rawVal);
      }
    });

    return {
      rowIndex,
      originalData: rawRow,
      data,
      status: 'READY',
      issues: [],
    };
  });

  // Step 2: Detect duplicate product IDs across dataset
  const idCounts = new Map<string, number>();
  processed.forEach((item) => {
    const idVal = item.data['id'];
    if (idVal) {
      idCounts.set(idVal, (idCounts.get(idVal) || 0) + 1);
    }
  });

  // Step 3: Validate required fields and flag issues
  return processed.map((item) => {
    const issues: ProductIssue[] = [];
    const productId = item.data['id'] || `Row ${item.rowIndex + 1}`;

    // Required fields check
    platformSpec.fields.forEach((fieldSpec) => {
      const val = item.data[fieldSpec.key];
      if (fieldSpec.required && (!val || val.trim() === '')) {
        issues.push({
          rowIndex: item.rowIndex,
          productId,
          field: fieldSpec.label,
          type: 'error',
          message: `Missing required field: "${fieldSpec.label}"`,
        });
      }
    });

    // Check duplicate ID
    const currentId = item.data['id'];
    if (currentId && (idCounts.get(currentId) || 0) > 1) {
      issues.push({
        rowIndex: item.rowIndex,
        productId,
        field: 'id',
        type: 'error',
        message: `Duplicate product ID: "${currentId}"`,
      });
    }

    // Check invalid price format
    const priceVal = item.data['price'];
    if (priceVal && isNaN(parseFloat(priceVal))) {
      issues.push({
        rowIndex: item.rowIndex,
        productId,
        field: 'price',
        type: 'error',
        message: `Invalid price value: "${priceVal}"`,
      });
    }

    // Check invalid image link format
    const imgLink = item.data['image_link'];
    if (imgLink && !/^https?:\/\/.+/i.test(imgLink)) {
      issues.push({
        rowIndex: item.rowIndex,
        productId,
        field: 'image_link',
        type: 'error',
        message: `Malformed image URL: "${imgLink}"`,
      });
    }

    const hasErrors = issues.some((i) => i.type === 'error');
    return {
      ...item,
      status: hasErrors ? 'NEEDS_FIX' : 'READY',
      issues,
    };
  });
}
