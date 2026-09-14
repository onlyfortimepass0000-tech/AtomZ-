import { IssueItem } from '../../types/surgeon';

export function validateShopifyRow(
  row: Record<string, any>,
  rowIndex: number, // 1-indexed
  existingHandles: Map<string, number>,
  existingSkus: Map<string, number>
): IssueItem[] {
  const issues: IssueItem[] = [];

  const handle = String(row['Handle'] || row['handle'] || '').trim();
  const title = String(row['Title'] || row['title'] || '').trim();
  const sku = String(row['Variant SKU'] || row['SKU'] || row['sku'] || '').trim();
  const priceRaw = row['Variant Price'] || row['Price'] || row['price'];
  const imageSrc = String(row['Image Src'] || row['Image Link'] || row['image_link'] || '').trim();

  // Handle checks
  if (!handle && title) {
    const suggestedHandle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    issues.push({
      id: `iss_shp_handle_${rowIndex}`,
      rowIndex,
      field: 'Handle',
      originalValue: '',
      suggestedValue: suggestedHandle,
      issueType: 'MISSING_HANDLE',
      severity: 'ERROR',
      category: 'SAFE_AUTO_FIX',
      message: `Missing product handle for "${title}"`,
      isResolved: false,
    });
  }

  // Duplicate Handle check across non-variant parent rows
  if (handle) {
    existingHandles.set(handle, (existingHandles.get(handle) || 0) + 1);
  }

  // SKU duplicate checks
  if (sku) {
    const normSku = sku.toUpperCase();
    const count = (existingSkus.get(normSku) || 0) + 1;
    existingSkus.set(normSku, count);

    if (count > 1) {
      issues.push({
        id: `iss_shp_sku_dup_${rowIndex}`,
        rowIndex,
        field: 'Variant SKU',
        originalValue: sku,
        issueType: 'DUPLICATE_SKU',
        severity: 'ERROR',
        category: 'NEEDS_CONFIRMATION',
        message: `Duplicate SKU "${sku}" found on row ${rowIndex}`,
        isResolved: false,
        productContext: title || handle || `Row ${rowIndex}`,
      });
    }
  }

  // Price check
  if (priceRaw !== undefined && priceRaw !== '') {
    const numPrice = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
    if (isNaN(numPrice) || numPrice < 0) {
      issues.push({
        id: `iss_shp_price_${rowIndex}`,
        rowIndex,
        field: 'Variant Price',
        originalValue: priceRaw,
        suggestedValue: '0',
        issueType: 'INVALID_PRICE',
        severity: 'ERROR',
        category: 'NEEDS_CONFIRMATION',
        message: `Invalid price "${priceRaw}" on row ${rowIndex}`,
        isResolved: false,
      });
    }
  }

  return issues;
}
