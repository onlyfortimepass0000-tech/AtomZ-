import * as XLSX from 'xlsx';
import { RepairLogRecord, PlatformDestination } from '../types/surgeon';

export function exportFixedSpreadsheet(
  headers: string[],
  rows: Record<string, any>[],
  baseFileName: string,
  platform: PlatformDestination,
  format: 'csv' | 'xlsx'
): void {
  const cleanName = baseFileName.replace(/\.[^/.]+$/, '');
  const platformTag = platform.toLowerCase();
  const filename = `${cleanName}_fixed_${platformTag}.${format}`;

  // Ensure rows are ordered by headers
  const orderedRows = rows.map(r => {
    const ordered: Record<string, any> = {};
    headers.forEach(h => {
      ordered[h] = r[h] !== undefined ? r[h] : '';
    });
    return ordered;
  });

  const worksheet = XLSX.utils.json_to_sheet(orderedRows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clean Catalog');

  if (format === 'xlsx') {
    XLSX.writeFile(workbook, filename);
  } else {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
  }
}

export function exportRepairReport(
  repairLogs: RepairLogRecord[],
  baseFileName: string
): void {
  const cleanName = baseFileName.replace(/\.[^/.]+$/, '');
  const filename = `${cleanName}_repair_report.csv`;

  const rows = repairLogs.map(log => ({
    'Row': log.row,
    'Field': log.field,
    'Problem': log.problem,
    'Original Value': log.originalValue,
    'Repaired Value': log.newValue,
    'Repair Type': log.repairType,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
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
