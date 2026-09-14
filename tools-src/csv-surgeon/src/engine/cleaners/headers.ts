import { PlatformDestination } from '../../types/surgeon';

export const HEADER_ALIASES: Record<string, Record<string, string>> = {
  SHOPIFY: {
    'product name': 'Title',
    'product title': 'Title',
    'item name': 'Title',
    'product': 'Title',
    'name': 'Title',
    'sku number': 'Variant SKU',
    'item sku': 'Variant SKU',
    'sku': 'Variant SKU',
    'price': 'Variant Price',
    'unit price': 'Variant Price',
    'cost': 'Cost per item',
    'stock': 'Variant Inventory Qty',
    'quantity': 'Variant Inventory Qty',
    'qty': 'Variant Inventory Qty',
    'inventory': 'Variant Inventory Qty',
    'barcode number': 'Variant Barcode',
    'upc': 'Variant Barcode',
    'image url': 'Image Src',
    'photo': 'Image Src',
    'picture': 'Image Src',
    'colour': 'Option1 Value', // when mapped to options
  },
  META: {
    'product name': 'title',
    'product title': 'title',
    'item name': 'title',
    'name': 'title',
    'sku': 'id',
    'product id': 'id',
    'item id': 'id',
    'unit price': 'price',
    'image url': 'image_link',
    'photo': 'image_link',
    'picture': 'image_link',
    'product url': 'link',
    'url': 'link',
    'colour': 'color',
    'stock': 'availability',
    'quantity': 'availability',
    'in stock': 'availability',
  },
  GOOGLE: {
    'product name': 'title',
    'product title': 'title',
    'name': 'title',
    'sku': 'id',
    'product id': 'id',
    'item id': 'id',
    'unit price': 'price',
    'image url': 'image_link',
    'photo': 'image_link',
    'picture': 'image_link',
    'product url': 'link',
    'url': 'link',
    'colour': 'color',
    'stock': 'availability',
    'quantity': 'availability',
  },
  GENERIC: {
    'product name': 'Title',
    'colour': 'Color',
    'sku number': 'SKU',
    'image url': 'Image Link',
    'stock': 'Availability',
  }
};

export function autoMapHeader(header: string, platform: PlatformDestination): { mapped: string; changed: boolean } {
  const lower = header.trim().toLowerCase();
  const mapForPlatform = HEADER_ALIASES[platform] || HEADER_ALIASES.GENERIC;

  if (mapForPlatform[lower]) {
    return { mapped: mapForPlatform[lower], changed: true };
  }

  // Common cross-platform fixes
  if (lower === 'colour') {
    return { mapped: 'Color', changed: true };
  }

  return { mapped: header.trim(), changed: false };
}
