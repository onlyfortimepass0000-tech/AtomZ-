import { IssueItem } from '../../types/surgeon';

export function validateMetaRow(
  row: Record<string, any>,
  rowIndex: number,
  existingIds: Map<string, number>
): IssueItem[] {
  const issues: IssueItem[] = [];

  const id = String(row['id'] || row['ID'] || row['sku'] || '').trim();
  const title = String(row['title'] || row['Title'] || '').trim();
  const imageLink = String(row['image_link'] || row['Image Link'] || '').trim();
  const link = String(row['link'] || row['Link'] || '').trim();
  const condition = String(row['condition'] || row['Condition'] || '').trim().toLowerCase();

  // Required Field Checks
  if (!id) {
    issues.push({
      id: `iss_meta_id_req_${rowIndex}`,
      rowIndex,
      field: 'id',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing required 'id' on row ${rowIndex}`,
      isResolved: false,
      productContext: title || `Row ${rowIndex}`,
    });
  } else {
    const count = (existingIds.get(id) || 0) + 1;
    existingIds.set(id, count);
    if (count > 1) {
      issues.push({
        id: `iss_meta_id_dup_${rowIndex}`,
        rowIndex,
        field: 'id',
        originalValue: id,
        issueType: 'DUPLICATE_PRODUCT_ID',
        severity: 'ERROR',
        category: 'NEEDS_CONFIRMATION',
        message: `Duplicate product ID '${id}' found on row ${rowIndex}`,
        isResolved: false,
        productContext: title || `Row ${rowIndex}`,
      });
    }
  }

  if (!title) {
    issues.push({
      id: `iss_meta_title_req_${rowIndex}`,
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

  if (!imageLink) {
    issues.push({
      id: `iss_meta_img_req_${rowIndex}`,
      rowIndex,
      field: 'image_link',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing product image link on row ${rowIndex}`,
      isResolved: false,
      productContext: title || `Row ${rowIndex}`,
    });
  }

  if (!link) {
    issues.push({
      id: `iss_meta_link_req_${rowIndex}`,
      rowIndex,
      field: 'link',
      originalValue: '',
      issueType: 'MISSING_REQUIRED_FIELD',
      severity: 'ERROR',
      category: 'NEEDS_CONFIRMATION',
      message: `Missing product link URL on row ${rowIndex}`,
      isResolved: false,
      productContext: title || `Row ${rowIndex}`,
    });
  }

  // Condition normalization
  const validConditions = new Set(['new', 'refurbished', 'used', 'used_like_new', 'used_good', 'used_fair']);
  if (condition && !validConditions.has(condition)) {
    let suggested = 'new';
    if (condition.includes('refurb')) suggested = 'refurbished';
    else if (condition.includes('used')) suggested = 'used';

    issues.push({
      id: `iss_meta_cond_${rowIndex}`,
      rowIndex,
      field: 'condition',
      originalValue: row['condition'] || row['Condition'],
      suggestedValue: suggested,
      issueType: 'INVALID_CONDITION',
      severity: 'WARNING',
      category: 'SAFE_AUTO_FIX',
      message: `Invalid condition '${condition}' mapped to '${suggested}' on row ${rowIndex}`,
      isResolved: false,
      patternKey: `CONDITION:${condition.toUpperCase()}`,
    });
  }

  return issues;
}
