export type PlatformType = 'meta' | 'google' | 'generic';

export interface TargetFieldSpec {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
  description?: string;
}

export interface PlatformSpec {
  id: PlatformType;
  name: string;
  description: string;
  fields: TargetFieldSpec[];
}

export interface ColumnMapping {
  [targetKey: string]: string; // targetKey -> sourceColumnName
}

export type IssueType = 'error' | 'warning';

export interface ProductIssue {
  rowIndex: number;
  productId: string;
  field: string;
  type: IssueType;
  message: string;
}

export interface ProcessedProduct {
  rowIndex: number; // 0-indexed original row
  originalData: Record<string, any>;
  data: Record<string, string>; // Normalized target fields
  status: 'READY' | 'NEEDS_FIX';
  issues: ProductIssue[];
}

export interface ParseResult {
  fileName: string;
  headers: string[];
  rows: Record<string, any>[];
}

export interface QuickFixStats {
  availabilityFixed: number;
  pricesFixed: number;
  spacesTrimmed: number;
  htmlRemoved: number;
  duplicatesRemoved: number;
  urlsFixed: number;
}
