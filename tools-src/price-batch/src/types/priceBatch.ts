export type RuleType = 
  | 'INCREASE_PCT'
  | 'DECREASE_PCT'
  | 'ADD_FIXED'
  | 'MARKUP_COST'
  | 'MIN_MARGIN_PCT'
  | 'ROUND_ENDING';

export type RoundingType = 'ENDING_99' | 'ENDING_49' | 'NEAREST_10' | 'NEAREST_100';

export interface PricingRule {
  type: RuleType;
  value: number; // e.g. 10 for 10%, 100 for fixed ₹100
  roundingType?: RoundingType;
  filterField?: 'ALL' | 'Category' | 'Collection' | 'SKU' | 'Variant';
  filterValue?: string;
}

export interface CatalogPriceItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  collection: string;
  variant: string;
  cost: number;
  oldPrice: number;
  newPrice: number;
  changeAmount: number;
  flags: string[];
}
