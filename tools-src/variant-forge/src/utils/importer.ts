import * as XLSX from 'xlsx';
import { Variant } from '../types/variant';

export interface ImportResult {
  productName?: string;
  baseSku?: string;
  basePrice?: number;
  existingVariants: Variant[];
  detectedOptionNames: string[];
}

export function parseProductFile(file: File): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (jsonRows.length === 0) {
          resolve({ existingVariants: [], detectedOptionNames: [] });
          return;
        }

        // Determine column mappings
        const sampleRow = jsonRows[0];
        const headers = Object.keys(sampleRow);

        let productName = '';
        let baseSku = '';
        let basePrice = 0;

        const knownMetaHeaders = new Set(['product name', 'title', 'product', 'sku', 'price', 'inventory', 'stock', 'barcode', 'compare price', 'cost']);
        const optionHeaders: string[] = [];

        headers.forEach(h => {
          const lower = h.trim().toLowerCase();
          if (lower.includes('color') || lower.includes('size') || lower.includes('fit') || lower.includes('material') || lower.includes('style') || lower.startsWith('option')) {
            optionHeaders.push(h);
          } else if (!knownMetaHeaders.has(lower)) {
            // Potential option column if string
            optionHeaders.push(h);
          }
        });

        const existingVariants: Variant[] = [];

        jsonRows.forEach((row, idx) => {
          const rowTitle = row['Product Name'] || row['Title'] || row['product'] || row['title'] || '';
          if (rowTitle && !productName) productName = String(rowTitle).trim();

          const sku = String(row['SKU'] || row['sku'] || row['Variant SKU'] || '').trim();
          if (sku && !baseSku) {
            baseSku = sku.split('-')[0] || sku;
          }

          const rawPrice = row['Price'] || row['price'] || row['Variant Price'] || 0;
          const price = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
          if (price > 0 && basePrice === 0) basePrice = price;

          const rawCompare = row['Compare Price'] || row['Compare-at Price'] || row['Variant Compare At Price'] || '';
          const compareAtPrice = rawCompare ? parseFloat(String(rawCompare).replace(/[^0-9.]/g, '')) || null : null;

          const rawCost = row['Cost'] || row['cost'] || '';
          const costPrice = rawCost ? parseFloat(String(rawCost).replace(/[^0-9.]/g, '')) || null : null;

          const rawInventory = row['Inventory'] || row['stock'] || row['Variant Inventory Qty'] || 10;
          const inventory = parseInt(String(rawInventory), 10) || 0;

          const barcode = String(row['Barcode'] || row['barcode'] || row['Variant Barcode'] || '').trim();

          const options: Record<string, string> = {};
          optionHeaders.forEach(optCol => {
            const val = String(row[optCol] || '').trim();
            if (val) {
              const cleanOptName = optCol.replace(/^option\s*\d+\s*(name|value)?/i, '').trim() || optCol;
              options[cleanOptName] = val;
            }
          });

          const titleParts = Object.values(options);
          const title = titleParts.length > 0 ? titleParts.join(' / ') : rowTitle || `Variant ${idx + 1}`;

          existingVariants.push({
            id: `imp_${Date.now()}_${idx}`,
            title,
            options,
            sku,
            price,
            compareAtPrice,
            costPrice,
            inventory,
            barcode,
            isInternalBarcode: !barcode,
            status: 'READY',
            validationErrors: [],
            isCustomImported: true,
          });
        });

        resolve({
          productName,
          baseSku,
          basePrice,
          existingVariants,
          detectedOptionNames: optionHeaders,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
