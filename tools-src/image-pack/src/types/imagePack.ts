export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';
export type MaxDimension = 'ORIGINAL' | '2000' | '1600' | '1200' | '800';
export type NamingPattern = 'SKU_NUMBER' | 'PRODUCT_NUMBER' | 'SKU_PRODUCT_NUMBER' | 'ORIGINAL_SANITIZED';

export interface ProcessedImage {
  id: string;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  newName: string;
  newSize: number;
  newWidth: number;
  newHeight: number;
  sku: string;
  blob: Blob;
  previewUrl: string;
}

export interface ProcessingOptions {
  outputFormat: OutputFormat;
  maxDimension: MaxDimension;
  quality: number; // 0.1 to 1.0
  namingPattern: NamingPattern;
  customPrefix: string;
}
