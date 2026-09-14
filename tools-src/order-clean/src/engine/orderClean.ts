import { FieldMapping, OrderRow, FixLog, AttentionItem, CleaningSummary, StandardField } from '../types/orderClean';

export const STANDARD_FIELDS: { key: StandardField; label: string; aliases: string[]; required: boolean }[] = [
  { key: 'order_id', label: 'Order ID', aliases: ['order id', 'order_id', 'order #', 'order no', 'id', 'order number'], required: true },
  { key: 'customer_name', label: 'Customer Name', aliases: ['customer name', 'name', 'buyer name', 'recipient name', 'client name'], required: true },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'mobile', 'contact', 'telephone', 'phone number', 'customer phone'], required: true },
  { key: 'email', label: 'Email', aliases: ['email', 'email address', 'mail'], required: false },
  { key: 'address_line1', label: 'Address Line 1', aliases: ['address 1', 'address line 1', 'address', 'street address', 'shipping address'], required: true },
  { key: 'address_line2', label: 'Address Line 2', aliases: ['address 2', 'address line 2', 'landmark', 'locality'], required: false },
  { key: 'city', label: 'City', aliases: ['city', 'town', 'district'], required: true },
  { key: 'state', label: 'State', aliases: ['state', 'province', 'region'], required: true },
  { key: 'pincode', label: 'PIN Code', aliases: ['pincode', 'pin code', 'zip', 'zipcode', 'postal code'], required: true },
  { key: 'payment_method', label: 'Payment Method', aliases: ['payment', 'payment method', 'payment mode', 'payment type', 'cod/prepaid', 'gateway'], required: false },
  { key: 'sku', label: 'SKU', aliases: ['sku', 'item sku', 'variant sku', 'code', 'product code'], required: true },
  { key: 'product_name', label: 'Product Name', aliases: ['product', 'item name', 'product name', 'title'], required: true },
  { key: 'quantity', label: 'Quantity', aliases: ['quantity', 'qty', 'units', 'count'], required: true },
  { key: 'price', label: 'Price', aliases: ['price', 'total', 'amount', 'item price', 'subtotal'], required: false },
];

const INDIAN_STATES_MAP: Record<string, string> = {
  'mh': 'Maharashtra', 'maharashtra': 'Maharashtra', 'maharastra': 'Maharashtra', 'mumbai': 'Maharashtra',
  'dl': 'Delhi', 'delhi': 'Delhi', 'delhi ncr': 'Delhi', 'new delhi': 'Delhi',
  'ka': 'Karnataka', 'karnataka': 'Karnataka', 'bangalore': 'Karnataka', 'bengaluru': 'Karnataka',
  'tn': 'Tamil Nadu', 'tamil nadu': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu', 'chennai': 'Tamil Nadu',
  'gj': 'Gujarat', 'gujarat': 'Gujarat', 'gujarath': 'Gujarat', 'ahmedabad': 'Gujarat',
  'wb': 'West Bengal', 'west bengal': 'West Bengal', 'kolkata': 'West Bengal',
  'up': 'Uttar Pradesh', 'uttar pradesh': 'Uttar Pradesh', 'up east': 'Uttar Pradesh', 'up west': 'Uttar Pradesh',
  'hr': 'Haryana', 'haryana': 'Haryana', 'gurgaon': 'Haryana', 'gurugram': 'Haryana',
  'ts': 'Telangana', 'telangana': 'Telangana', 'hyderabad': 'Telangana',
  'ap': 'Andhra Pradesh', 'andhra pradesh': 'Andhra Pradesh',
  'rj': 'Rajasthan', 'rajasthan': 'Rajasthan', 'jaipur': 'Rajasthan',
  'kl': 'Kerala', 'kerala': 'Kerala', 'cochin': 'Kerala', 'kochi': 'Kerala',
  'pb': 'Punjab', 'punjab': 'Punjab',
  'mp': 'Madhya Pradesh', 'madhya pradesh': 'Madhya Pradesh',
  'br': 'Bihar', 'bihar': 'Bihar',
  'od': 'Odisha', 'orissa': 'Odisha', 'odisha': 'Odisha',
  'ga': 'Goa', 'goa': 'Goa',
  'uk': 'Uttarakhand', 'uttaranchal': 'Uttarakhand', 'uttarakhand': 'Uttarakhand',
};

export function autoMapColumns(headers: string[]): FieldMapping[] {
  return STANDARD_FIELDS.map(field => {
    const matched = headers.find(h => {
      const lower = h.trim().toLowerCase();
      return field.aliases.some(alias => lower === alias || lower.includes(alias));
    });
    return {
      standardField: field.key,
      label: field.label,
      mappedHeader: matched || null,
      required: field.required,
    };
  });
}

export function stripInvisibleChars(str: string): string {
  if (typeof str !== 'string') return String(str ?? '');
  // strip zero-width characters and control characters except whitespace
  return str.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

export function normalizePhone(phone: any): { value: string; isFixed: boolean; isValid: boolean; reason?: string } {
  if (phone === null || phone === undefined) return { value: '', isFixed: false, isValid: false, reason: 'Missing phone' };
  let raw = String(phone).replace(/[^\d+]/g, '').trim();
  
  if (!raw) return { value: '', isFixed: false, isValid: false, reason: 'Empty phone' };
  
  // Handle Indian phone numbers (+91 or 91 prefix)
  if (raw.startsWith('+91')) {
    const digits = raw.substring(3);
    if (digits.length === 10) {
      return { value: `+91${digits}`, isFixed: false, isValid: true };
    }
  } else if (raw.startsWith('91') && raw.length === 12) {
    const digits = raw.substring(2);
    return { value: `+91${digits}`, isFixed: true, isValid: true, reason: 'Added +91 prefix' };
  } else if (raw.startsWith('0') && raw.length === 11) {
    const digits = raw.substring(1);
    return { value: `+91${digits}`, isFixed: true, isValid: true, reason: 'Stripped leading 0 and added +91' };
  } else if (raw.length === 10) {
    return { value: `+91${raw}`, isFixed: true, isValid: true, reason: 'Formatted to +91 Indian mobile number' };
  }

  // Check valid length
  if (raw.length >= 10 && raw.length <= 13) {
    return { value: raw, isFixed: false, isValid: true };
  }

  return { value: raw, isFixed: false, isValid: false, reason: `Invalid phone length (${raw.length} digits)` };
}

export function normalizeState(stateStr: any): { value: string; isFixed: boolean } {
  if (!stateStr) return { value: '', isFixed: false };
  const raw = String(stateStr).trim();
  const lower = raw.toLowerCase();
  if (INDIAN_STATES_MAP[lower]) {
    const matched = INDIAN_STATES_MAP[lower];
    return { value: matched, isFixed: matched !== raw };
  }
  // Title case fallback
  const titleCase = raw.replace(/\b\w/g, c => c.toUpperCase());
  return { value: titleCase, isFixed: titleCase !== raw };
}

export function normalizePaymentMethod(method: any): { value: string; isFixed: boolean } {
  if (!method) return { value: 'PREPAID', isFixed: true };
  const raw = String(method).trim().toUpperCase();
  if (raw.includes('COD') || raw.includes('CASH') || raw.includes('DELIVERY')) {
    return { value: 'COD', isFixed: raw !== 'COD' };
  }
  return { value: 'PREPAID', isFixed: raw !== 'PREPAID' };
}

export function normalizePinCode(pin: any): { value: string; isFixed: boolean; isValid: boolean; reason?: string } {
  if (!pin) return { value: '', isFixed: false, isValid: false, reason: 'Missing PIN Code' };
  let str = String(pin).replace(/\D/g, '').trim();
  
  if (str.length === 5) {
    str = '0' + str; // Pad Excel leading zero truncation
    return { value: str, isFixed: true, isValid: true, reason: 'Padded truncated leading zero' };
  }
  if (str.length === 6) {
    return { value: str, isFixed: false, isValid: true };
  }
  return { value: str, isFixed: false, isValid: false, reason: `Invalid Indian PIN Code length (${str.length} digits)` };
}

export function normalizeNumeric(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function cleanOrderDataset(
  rawRows: any[],
  mappings: FieldMapping[]
): {
  cleanedRows: OrderRow[];
  logs: FixLog[];
  attentionItems: AttentionItem[];
  summary: CleaningSummary;
} {
  const logs: FixLog[] = [];
  const attentionItems: AttentionItem[] = [];
  const cleanedRows: OrderRow[] = [];
  
  let duplicateRowsRemoved = 0;
  let blankRowsRemoved = 0;
  let totalAutoFixed = 0;

  const getMappedKey = (fieldKey: StandardField): string | null => {
    const m = mappings.find(item => item.standardField === fieldKey);
    return m?.mappedHeader || null;
  };

  const seenOrderIds = new Map<string, number>();
  const seenRowSignatures = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowId = `row_${idx + 1}`;
    
    // Check if completely blank row
    const values = Object.values(row).map(v => String(v ?? '').trim()).filter(Boolean);
    if (values.length === 0) {
      blankRowsRemoved++;
      return;
    }

    // Check exact duplicate row
    const signature = JSON.stringify(row);
    if (seenRowSignatures.has(signature)) {
      duplicateRowsRemoved++;
      return;
    }
    seenRowSignatures.add(signature);

    const cleanedRow: OrderRow = { _rowId: rowId };

    // Copy unmapped fields
    Object.keys(row).forEach(k => {
      cleanedRow[k] = stripInvisibleChars(row[k]);
    });

    // 1. Order ID
    const orderIdHeader = getMappedKey('order_id');
    let orderId = orderIdHeader ? stripInvisibleChars(row[orderIdHeader]) : '';
    if (!orderId) orderId = `ORD-${1000 + idx}`;
    cleanedRow['Order ID'] = orderId;

    // Check duplicate Order ID
    const count = (seenOrderIds.get(orderId) || 0) + 1;
    seenOrderIds.set(orderId, count);
    if (count > 1) {
      attentionItems.push({
        id: `att_dup_${rowId}`,
        rowId,
        orderId,
        customerName: String(row[getMappedKey('customer_name') || ''] || 'Customer'),
        issueType: 'DUPLICATE_ORDER_ID',
        field: 'Order ID',
        description: `Duplicate Order ID detected (${count} occurrences)`,
        currentValue: orderId,
      });
    }

    // 2. Customer Name
    const nameHeader = getMappedKey('customer_name');
    const customerName = nameHeader ? stripInvisibleChars(row[nameHeader]) : '';
    cleanedRow['Customer Name'] = customerName;
    if (!customerName) {
      attentionItems.push({
        id: `att_name_${rowId}`,
        rowId,
        orderId,
        customerName: 'Unspecified',
        issueType: 'MISSING_ADDRESS',
        field: 'Customer Name',
        description: 'Customer Name is missing',
        currentValue: '',
      });
    }

    // 3. Phone
    const phoneHeader = getMappedKey('phone');
    const rawPhone = phoneHeader ? row[phoneHeader] : '';
    const phoneNorm = normalizePhone(rawPhone);
    cleanedRow['Phone'] = phoneNorm.value;
    if (phoneNorm.isFixed) {
      totalAutoFixed++;
      logs.push({
        id: `log_phone_${rowId}`,
        rowId,
        orderId,
        field: 'Phone',
        originalValue: rawPhone,
        fixedValue: phoneNorm.value,
        reason: phoneNorm.reason || 'Normalized phone number',
        autoFixed: true,
      });
    }
    if (!phoneNorm.isValid) {
      attentionItems.push({
        id: `att_phone_${rowId}`,
        rowId,
        orderId,
        customerName: customerName || 'Customer',
        issueType: 'INVALID_PHONE',
        field: 'Phone',
        description: phoneNorm.reason || 'Invalid phone format',
        currentValue: String(rawPhone || ''),
      });
    }

    // 4. State
    const stateHeader = getMappedKey('state');
    const rawState = stateHeader ? row[stateHeader] : '';
    const stateNorm = normalizeState(rawState);
    cleanedRow['State'] = stateNorm.value;
    if (stateNorm.isFixed && rawState) {
      totalAutoFixed++;
      logs.push({
        id: `log_state_${rowId}`,
        rowId,
        orderId,
        field: 'State',
        originalValue: rawState,
        fixedValue: stateNorm.value,
        reason: 'Standardized state name',
        autoFixed: true,
      });
    }

    // 5. Payment Method
    const payHeader = getMappedKey('payment_method');
    const rawPay = payHeader ? row[payHeader] : '';
    const payNorm = normalizePaymentMethod(rawPay);
    cleanedRow['Payment Method'] = payNorm.value;
    if (payNorm.isFixed && rawPay) {
      totalAutoFixed++;
      logs.push({
        id: `log_pay_${rowId}`,
        rowId,
        orderId,
        field: 'Payment Method',
        originalValue: rawPay,
        fixedValue: payNorm.value,
        reason: 'Normalized payment mode terminology',
        autoFixed: true,
      });
    }

    // 6. PIN Code
    const pinHeader = getMappedKey('pincode');
    const rawPin = pinHeader ? row[pinHeader] : '';
    const pinNorm = normalizePinCode(rawPin);
    cleanedRow['PIN Code'] = pinNorm.value;
    if (pinNorm.isFixed) {
      totalAutoFixed++;
      logs.push({
        id: `log_pin_${rowId}`,
        rowId,
        orderId,
        field: 'PIN Code',
        originalValue: rawPin,
        fixedValue: pinNorm.value,
        reason: pinNorm.reason || 'Normalized PIN code',
        autoFixed: true,
      });
    }
    if (!pinNorm.isValid) {
      attentionItems.push({
        id: `att_pin_${rowId}`,
        rowId,
        orderId,
        customerName: customerName || 'Customer',
        issueType: 'INVALID_PIN',
        field: 'PIN Code',
        description: pinNorm.reason || 'Invalid PIN code length',
        currentValue: String(rawPin || ''),
      });
    }

    // 7. Quantity & Price
    const qtyHeader = getMappedKey('quantity');
    const qtyVal = normalizeNumeric(qtyHeader ? row[qtyHeader] : 1);
    cleanedRow['Quantity'] = qtyVal || 1;

    const priceHeader = getMappedKey('price');
    const priceVal = normalizeNumeric(priceHeader ? row[priceHeader] : 0);
    cleanedRow['Price'] = priceVal;

    cleanedRows.push(cleanedRow);
  });

  return {
    cleanedRows,
    logs,
    attentionItems,
    summary: {
      totalRowsChecked: rawRows.length,
      totalAutoFixed,
      totalAttentionNeeded: attentionItems.length,
      duplicateRowsRemoved,
      blankRowsRemoved,
    },
  };
}
