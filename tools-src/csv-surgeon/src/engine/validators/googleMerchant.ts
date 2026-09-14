import { IssueItem } from '../../types/surgeon';

export function validateGoogleMerchantRow(
  row: Record<string, any>,
  rowIndex: number,
  existingIds: Map<string, number>
): IssueItem[] {
  const issues: IssueItem[] = [];

  const id = String(row['id'] || row['ID'] || row['sku'] || '').trim();
  const title = String(row['title'] || row['Title'] || '').trim();
  const link = String(row['link'] || row['Link'] || '').trim();
  const imageLink = String(row['image_link'] || row['Image Link'] || '').trim();
  const brand = String(row['brand'] || row['Brand'] || '').trim();
  const gtin = String(row['gtin'] || row['GTIN'] || '').trim();
  const googleCategory = String(row['google_product_category'] || row['Google Product Category'] || '').trim();

  // ERRORS
  if (!id) {
    issues.push({
      id: `iss_goog_id_${rowIndex}`,
      rowIndex,
      field: 'id',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing required 'id' on row ${rowIndex}`,
      isResolved: false,
    });
  } else {
    const count = (existingIds.get(id) || 0) + 1;
    existingIds.set(id, count);
    if (count > 1) {
      issues.push({
        id: `iss_goog_id_dup_${rowIndex}`,
        rowIndex,
        field: 'id',
        originalValue: id,
        issueType: 'DUPLICATE_PRODUCT_ID',
        severity: 'ERROR',
        category: 'NEEDS_CONFIRMATION',
        message: `Duplicate product ID '${id}' found on row ${rowIndex}`,
        isResolved: false,
      });
    }
  }

  if (!title) {
    issues.push({
      id: `iss_goog_title_${rowIndex}`,
      rowIndex,
      field: 'title',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing required 'title' on row ${rowIndex}`,
      isResolved: false,
    });
  }

  if (!link) {
    issues.push({
      id: `iss_goog_link_${rowIndex}`,
      rowIndex,
      field: 'link',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing required product link URL on row ${rowIndex}`,
      isResolved: false,
    });
  } else if (!/^https:\/\//i.test(link)) {
    issues.push({
      id: `iss_goog_link_https_${rowIndex}`,
      rowIndex,
      field: 'link',
      originalValue: link,
      suggestedValue: link.replace(/^http:\/\//i, 'https://'),
      issueType: 'NON_HTTPS_URL',
      severity: 'WARNING',
      category: 'SAFE_AUTO_FIX',
      message: `Google Merchant prefers HTTPS URL for '${link}' on row ${rowIndex}`,
      isResolved: false,
      patternKey: 'URL:HTTP_TO_HTTPS',
    });
  }

  if (!imageLink) {
    issues.push({
      id: `iss_goog_img_${rowIndex}`,
      rowIndex,
      field: 'image_link',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing required 'image_link' on row ${rowIndex}`,
      isResolved: false,
    });
  }

  // WARNINGS
  if (!brand && !gtin) {
    issues.push({
      id: `iss_goog_gtin_${rowIndex}`,
      rowIndex,
      field: 'gtin',
      originalValue: '',
      issueType: 'MISSING_GTIN_BRAND',
      severity: 'WARNING',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing brand or GTIN barcode on row ${rowIndex}`,
      isResolved: false,
    });
  }

  // RECOMMENDATIONS
  if (!googleCategory) {
    issues.push({
      id: `iss_goog_cat_${rowIndex}`,
      rowIndex,
      field: 'google_product_category',
      originalValue: '',
      issueType: 'MISSING_RECOMMENDED_FIELD',
      severity: 'RECOMMENDATION',
      category: 'NEEDS_CONFIRMATION',
      message: `Adding google_product_category improves ad relevance for row ${rowIndex}`,
      isResolved: false,
    });
  }

  return issues;
}
