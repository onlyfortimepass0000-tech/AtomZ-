export type SyncMode = 'MODE_A_SALES' | 'MODE_B_PHYSICAL';

export interface InventoryItem {
  sku: string;
  productName: string;
  openingStock: number;
  soldQuantity: number;
  returnedQuantity: number;
  expectedStock: number; // Opening - Sold + Returned (Mode A)
  systemStock: number; // Mode B
  physicalStock: number; // Mode B
  difference: number; // Mode B: Physical - System; Mode A: Actual - Expected
  status: 'MATCH' | 'DISCREPANCY' | 'MISSING_IN_SYSTEM' | 'UNKNOWN_SKU' | 'NEGATIVE_STOCK';
  notes: string[];
}

export interface ReconcileSummary {
  totalSkusEvaluated: number;
  matchingSkusCount: number;
  discrepancyCount: number;
  missingSkusCount: number;
  totalVariance: number;
}
