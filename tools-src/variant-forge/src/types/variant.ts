export interface ProductDetails {
  productName: string;
  baseSku: string;
  price: number | string;
  compareAtPrice?: number | string;
  costPrice?: number | string;
}

export interface OptionValue {
  id: string;
  value: string;
  abbreviation?: string;
}

export interface OptionGroup {
  id: string;
  name: string;
  values: OptionValue[];
}

export type SkuSeparator = '-' | '_' | '';
export type SkuCasing = 'UPPERCASE' | 'lowercase';

export interface SkuSettings {
  separator: SkuSeparator;
  casing: SkuCasing;
  useAbbreviations: boolean;
  customAbbreviations: Record<string, string>;
}

export interface Variant {
  id: string;
  title: string;
  options: Record<string, string>; // OptionName -> OptionValue
  sku: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  inventory: number;
  barcode: string;
  isInternalBarcode: boolean;
  status: 'READY' | 'NEEDS_FIX';
  validationErrors: string[];
  isCustomImported?: boolean;
}

export interface LabelSettings {
  sizePreset: '50x25' | '50x30' | '40x25' | 'custom';
  widthMm: number;
  heightMm: number;
  showProductName: boolean;
  showVariantName: boolean;
  showSku: boolean;
  showPrice: boolean;
  showBarcode: boolean;
}

export interface FilterState {
  search: string;
  status: 'ALL' | 'READY' | 'NEEDS_FIX';
  optionFilters: Record<string, string>;
}

export interface BulkEditOptions {
  action: 'SET_ALL_PRICES' | 'SET_ALL_INVENTORY' | 'ADD_PRICE_DELTA' | 'SET_OPTION_PRICE';
  targetValue: number;
  targetOptionName?: string;
  targetOptionValue?: string;
}

export interface SkuConflict {
  value1: string;
  value2: string;
  abbreviation: string;
}
