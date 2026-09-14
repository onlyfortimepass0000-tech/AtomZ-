import * as XLSX from 'xlsx';
import { PlatformSpec, ProcessedProduct } from '../types';

/**
 * Downloads the clean, normalized product catalog file (.csv or .xlsx).
 */
export function exportCleanCatalog(
  products: ProcessedProduct[],
  platformSpec: PlatformSpec,
  fileFormat: 'csv' | 'xlsx',
  customFileName?: string
): void {
  // Construct export rows adhering strictly to target platform fields order
  const exportRows = products.map((item) => {
    const row: Record<string, string> = {};
    platformSpec.fields.forEach((fieldSpec) => {
      row[fieldSpec.label] = item.data[fieldSpec.key] || '';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catalog');

  const nameBase = customFileName || `catalog_${platformSpec.id}_fixed`;
  const fileName = `${nameBase}.${fileFormat}`;

  if (fileFormat === 'csv') {
    XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
  }
}

/**
 * Downloads Error Report CSV detailing rows requiring attention.
 */
export function exportErrorReport(products: ProcessedProduct[]): void {
  const errorRows: Array<{
    'Row Number': number;
    'Product ID / SKU': string;
    'Field Name': string;
    'Issue Description': string;
  }> = [];

  products.forEach((item) => {
    item.issues.forEach((issue) => {
      errorRows.push({
        'Row Number': item.rowIndex + 1,
        'Product ID / SKU': issue.productId,
        'Field Name': issue.field,
        'Issue Description': issue.message,
      });
    });
  });

  if (errorRows.length === 0) {
    alert('No issues found in catalog! All products are READY.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(errorRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Error Report');

  XLSX.writeFile(workbook, `catalog_error_report_${Date.now()}.csv`, { bookType: 'csv' });
}
