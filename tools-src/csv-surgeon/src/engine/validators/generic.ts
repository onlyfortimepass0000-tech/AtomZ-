import { IssueItem } from '../../types/surgeon';

export function validateGenericRow(
  row: Record<string, any>,
  rowIndex: number,
  existingIds: Map<string, number>
): IssueItem[] {
  const issues: IssueItem[] = [];

  const id = String(row['SKU'] || row['id'] || row['ID'] || row['Title'] || '').trim();

  if (id) {
    const count = (existingIds.get(id.toUpperCase()) || 0) + 1;
    existingIds.set(id.toUpperCase(), count);
    if (count > 1) {
      issues.push({
        id: `iss_gen_dup_${rowIndex}`,
        rowIndex,
        field: 'SKU/ID',
        originalValue: id,
        issueType: 'DUPLICATE_ID',
        severity: 'WARNING',
        category: 'NEEDS_CONFIRMATION',
        message: `Duplicate identifier '${id}' on row ${rowIndex}`,
        isResolved: false,
      });
    }
  }

  return issues;
}
