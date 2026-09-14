import * as XLSX from 'xlsx';
import { ParseResult } from '../types';

/**
 * Parses CSV, XLSX, or XLS file into structured JSON rows using SheetJS.
 */
export async function parseSpreadsheetFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Spreadsheet file contains no readable sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    raw: false, // Formatted text values
  });

  if (!rawJson || rawJson.length === 0) {
    throw new Error('Spreadsheet is empty or contains no product rows.');
  }

  // Extract all unique headers across rows
  const headersSet = new Set<string>();
  rawJson.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key && key.trim()) {
        headersSet.add(key.trim());
      }
    });
  });

  const headers = Array.from(headersSet);

  // Filter completely blank rows
  const rows = rawJson.filter((row) => {
    return Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '');
  });

  return {
    fileName: file.name,
    headers,
    rows,
  };
}
