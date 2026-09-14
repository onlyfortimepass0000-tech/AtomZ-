import { describe, it, expect } from 'vitest';
import { sanitizeFilename, formatBytes, generateNewFilename, generateManifestCsv } from './imagePack';
import { ProcessingOptions } from '../types/imagePack';

describe('ImagePack Engine', () => {
  it('sanitizes filenames cleanly', () => {
    expect(sanitizeFilename('my product photo (1).png')).toBe('MY_PRODUCT_PHOTO_1_');
    expect(sanitizeFilename('TEE BLK M.jpg')).toBe('TEE_BLK_M');
  });

  it('formats byte sizes accurately', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(5242880)).toBe('5 MB');
  });

  it('generates structured filenames based on pattern', () => {
    const opts: ProcessingOptions = {
      outputFormat: 'image/jpeg',
      maxDimension: '1600',
      quality: 0.8,
      namingPattern: 'SKU_NUMBER',
      customPrefix: '',
    };
    const name = generateNewFilename('shirt.png', 0, 'TEE-BLK-M', opts);
    expect(name).toBe('TEE-BLK-M_01.jpg');
  });

  it('generates a CSV manifest', () => {
    const mockData = [
      {
        id: '1',
        originalName: 'photo1.png',
        originalSize: 500000,
        originalWidth: 2000,
        originalHeight: 2000,
        newName: 'TEE_01.jpg',
        newSize: 100000,
        newWidth: 1600,
        newHeight: 1600,
        sku: 'TEE',
        blob: new Blob(),
        previewUrl: '',
      }
    ];

    const csv = generateManifestCsv(mockData);
    expect(csv).toContain('Original Filename,New Filename,SKU');
    expect(csv).toContain('"photo1.png","TEE_01.jpg","TEE",500000,100000,"1600x1600"');
  });
});
