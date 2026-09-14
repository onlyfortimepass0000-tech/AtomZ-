import JsBarcode from 'jsbarcode';

export function renderBarcodeDataUrl(text: string, height: number = 40): string {
  if (!text || !text.trim()) return '';
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text.trim(), {
      format: 'CODE128',
      width: 2,
      height,
      displayValue: true,
      fontSize: 12,
      margin: 6,
      background: '#ffffff',
      lineColor: '#000000',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Barcode render error:', err);
    return '';
  }
}
