import { jsPDF } from 'jspdf';
import { Variant, ProductDetails, LabelSettings } from '../types/variant';
import { renderBarcodeDataUrl } from './barcode';

export function generateLabelPdf(
  variants: Variant[],
  productDetails: ProductDetails,
  settings: LabelSettings
): jsPDF {
  const widthMm = settings.sizePreset === '50x25' ? 50 :
                  settings.sizePreset === '50x30' ? 50 :
                  settings.sizePreset === '40x25' ? 40 : settings.widthMm;

  const heightMm = settings.sizePreset === '50x25' ? 25 :
                   settings.sizePreset === '50x30' ? 30 :
                   settings.sizePreset === '40x25' ? 25 : settings.heightMm;

  // Initialize jsPDF with custom page size (orientation, unit, format)
  const doc = new jsPDF({
    orientation: widthMm >= heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm]
  });

  const selectedVariants = variants.filter(v => v.status === 'READY' || true); // print all variants
  const total = selectedVariants.length;

  selectedVariants.forEach((v, index) => {
    if (index > 0) {
      doc.addPage([widthMm, heightMm], widthMm >= heightMm ? 'landscape' : 'portrait');
    }

    let y = 3.5;
    const paddingX = 3;
    const availableWidth = widthMm - (paddingX * 2);

    // Product Title
    if (settings.showProductName && productDetails.productName) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      const titleText = doc.splitTextToSize(productDetails.productName, availableWidth);
      doc.text(titleText[0], widthMm / 2, y, { align: 'center' });
      y += 3.5;
    }

    // Variant Title
    if (settings.showVariantName && v.title) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      const varText = doc.splitTextToSize(v.title, availableWidth);
      doc.text(varText[0], widthMm / 2, y, { align: 'center' });
      y += 3.5;
    }

    // SKU & Price Row
    if (settings.showSku || settings.showPrice) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7);
      const lineParts: string[] = [];
      if (settings.showSku && v.sku) lineParts.push(`SKU: ${v.sku}`);
      if (settings.showPrice && v.price) lineParts.push(`₹${v.price}`);

      doc.text(lineParts.join('  |  '), widthMm / 2, y, { align: 'center' });
      y += 3.5;
    }

    // Barcode Image
    if (settings.showBarcode && v.barcode) {
      const barcodeDataUrl = renderBarcodeDataUrl(v.barcode, 30);
      if (barcodeDataUrl) {
        const barcodeWidth = Math.min(availableWidth, 34);
        const barcodeHeight = Math.max(6, heightMm - y - 2);
        const barcodeX = (widthMm - barcodeWidth) / 2;
        try {
          doc.addImage(barcodeDataUrl, 'PNG', barcodeX, y, barcodeWidth, barcodeHeight);
        } catch (err) {
          console.warn('PDF AddImage error:', err);
        }
      }
    }
  });

  return doc;
}
