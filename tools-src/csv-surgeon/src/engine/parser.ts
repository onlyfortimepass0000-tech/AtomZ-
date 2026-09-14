import * as XLSX from 'xlsx';

export interface ParseResult {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export function parseSpreadsheetFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          resolve({ headers: [], rows: [], totalRows: 0 });
          return;
        }

        const headers = Object.keys(rawJson[0]);

        // Filter out completely blank rows
        const validRows = rawJson.filter(row => {
          return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
        });

        resolve({
          headers,
          rows: validRows,
          totalRows: validRows.length,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
