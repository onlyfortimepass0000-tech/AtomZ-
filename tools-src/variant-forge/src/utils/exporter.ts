import * as XLSX from 'xlsx';
import { Variant, OptionGroup } from '../types/variant';

export function sanitizeFilename(name: string, suffix: string = '_variants', extension: string = '.csv'): string {
  const cleanName = (name || 'product')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cleanName || 'product'}${suffix}${extension}`;
}

export function buildGenericRows(variants: Variant[], productName: string): Record<string, any>[] {
  return variants.map(v => {
    const row: Record<string, any> = {
      'Product Name': productName,
      'Variant': v.title,
      'SKU': v.sku,
    };

    // Include option columns
    Object.entries(v.options).forEach(([optName, optVal]) => {
      row[optName] = optVal;
    });

    row['Price'] = v.price;
    row['Compare-at Price'] = v.compareAtPrice !== null ? v.compareAtPrice : '';
    row['Cost'] = v.costPrice !== null ? v.costPrice : '';
    row['Inventory'] = v.inventory;
    row['Barcode'] = v.barcode;
    row['Status'] = v.status;

    return row;
  });
}

export function exportToGenericCsv(variants: Variant[], productName: string): void {
  const rows = buildGenericRows(variants, productName);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const filename = sanitizeFilename(productName, '_variants', '.csv');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportToXlsx(variants: Variant[], productName: string): void {
  const rows = buildGenericRows(variants, productName);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Variants');

  const filename = sanitizeFilename(productName, '_variants', '.xlsx');
  XLSX.writeFile(workbook, filename);
}

export function buildShopifyRows(variants: Variant[], productName: string, optionGroups: OptionGroup[]): Record<string, any>[] {
  const handle = (productName || 'product')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return variants.map(v => {
    const row: Record<string, any> = {
      'Handle': handle,
      'Title': productName,
    };

    // Shopify supports up to 3 option names/values
    const activeGroups = optionGroups.filter(g => g.name.trim() !== '');
    
    [0, 1, 2].forEach(i => {
      const group = activeGroups[i];
      if (group) {
        row[`Option${i + 1} Name`] = group.name;
        row[`Option${i + 1} Value`] = v.options[group.name] || '';
      } else {
        row[`Option${i + 1} Name`] = '';
        row[`Option${i + 1} Value`] = '';
      }
    });

    row['Variant SKU'] = v.sku;
    row['Variant Price'] = v.price;
    row['Variant Compare At Price'] = v.compareAtPrice !== null ? v.compareAtPrice : '';
    row['Variant Inventory Qty'] = v.inventory;
    row['Variant Barcode'] = v.barcode;

    return row;
  });
}

export function exportToShopifyCsv(variants: Variant[], productName: string, optionGroups: OptionGroup[]): void {
  const rows = buildShopifyRows(variants, productName, optionGroups);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const filename = sanitizeFilename(productName, '_shopify_variants', '.csv');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
