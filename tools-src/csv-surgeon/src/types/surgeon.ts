export type PlatformDestination = 'SHOPIFY' | 'META' | 'GOOGLE' | 'GENERIC' | 'NOT_SURE';

export type IssueSeverity = 'ERROR' | 'WARNING' | 'RECOMMENDATION';

export type RepairCategory = 'SAFE_AUTO_FIX' | 'NEEDS_CONFIRMATION' | 'CANNOT_DETERMINE';

export interface IssueItem {
  id: string;
  rowIndex: number; // 1-indexed row number in dataset
  field: string;
  originalValue: any;
  suggestedValue?: any;
  issueType: string;
  severity: IssueSeverity;
  category: RepairCategory;
  message: string;
  patternKey?: string;
  isResolved: boolean;
  resolvedValue?: any;
  resolvedType?: 'AUTO' | 'PATTERN' | 'MANUAL';
  productContext?: string; // e.g. "Black Tee / Medium" or Title
}

export interface PatternGroup {
  patternKey: string;
  title: string;
  description: string;
  affectedRowsCount: number;
  issueIds: string[];
  fromValueSample: string;
  toValueSample: string;
}

export interface CellDiff {
  rowIndex: number;
  field: string;
  before: string;
  after: string;
  issueType: string;
  category: RepairCategory;
}

export interface RepairLogRecord {
  row: number;
  field: string;
  problem: string;
  originalValue: string;
  newValue: string;
  repairType: string;
}

export type AppStage = 'UPLOAD' | 'DESTINATION' | 'SCANNING' | 'SUMMARY' | 'HUMAN_REVIEW' | 'COMPLETE';
