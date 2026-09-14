export interface OrderRow {
  _rowId: string;
  [key: string]: any;
}

export type StandardField = 
  | 'order_id'
  | 'customer_name'
  | 'phone'
  | 'email'
  | 'address_line1'
  | 'address_line2'
  | 'city'
  | 'state'
  | 'pincode'
  | 'payment_method'
  | 'sku'
  | 'product_name'
  | 'quantity'
  | 'price';

export interface FieldMapping {
  standardField: StandardField;
  label: string;
  mappedHeader: string | null; // header from user file
  required: boolean;
}

export interface FixLog {
  id: string;
  rowId: string;
  orderId?: string;
  field: string;
  originalValue: any;
  fixedValue: any;
  reason: string;
  autoFixed: boolean;
}

export interface AttentionItem {
  id: string;
  rowId: string;
  orderId: string;
  customerName: string;
  issueType: 'INVALID_PHONE' | 'INVALID_PIN' | 'MISSING_ADDRESS' | 'DUPLICATE_ORDER_ID';
  field: string;
  description: string;
  currentValue: string;
}

export interface CleaningSummary {
  totalRowsChecked: number;
  totalAutoFixed: number;
  totalAttentionNeeded: number;
  duplicateRowsRemoved: number;
  blankRowsRemoved: number;
}
