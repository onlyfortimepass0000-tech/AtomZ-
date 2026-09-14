export interface PickItem {
  sku: string;
  productName: string;
  variant: string;
  binLocation: string;
  totalQuantity: number;
  checked: boolean;
}

export interface PackingOrderItem {
  sku: string;
  productName: string;
  variant: string;
  quantity: number;
}

export interface PackingOrder {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  pinCode: string;
  items: PackingOrderItem[];
}

export type SortField = 'SKU' | 'PRODUCT' | 'BIN';
export type SlipLayout = '1_PER_PAGE' | '2_PER_PAGE' | '4_PER_PAGE';
