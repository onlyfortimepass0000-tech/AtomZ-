import React, { useState, useEffect } from 'react';
import { Variant, ProductDetails, LabelSettings } from '../types/variant';
import { generateLabelPdf } from '../utils/pdfLabelGenerator';
import { renderBarcodeDataUrl } from '../utils/barcode';
import { Printer, Download, X, QrCode, Info } from 'lucide-react';

interface LabelModalProps {
  variants: Variant[];
  productDetails: ProductDetails;
  onClose: () => void;
}

export const LabelModal: React.FC<LabelModalProps> = ({
  variants,
  productDetails,
  onClose,
}) => {
  const [settings, setSettings] = useState<LabelSettings>({
    sizePreset: '50x25',
    widthMm: 50,
    heightMm: 25,
    showProductName: true,
    showVariantName: true,
    showSku: true,
    showPrice: true,
    showBarcode: true,
  });

  const [previewBarcode, setPreviewBarcode] = useState<string>('');
  const sampleVariant = variants[0] || {
    title: 'Black / S',
    sku: 'OT-BLK-S',
    price: 1299,
    barcode: 'OTBLKS',
  };

  useEffect(() => {
    if (sampleVariant.barcode) {
      const dataUrl = renderBarcodeDataUrl(sampleVariant.barcode, 40);
      setPreviewBarcode(dataUrl);
    }
  }, [sampleVariant.barcode]);

  const handleDownloadPdf = () => {
    const doc = generateLabelPdf(variants, productDetails, settings);
    doc.save(`${productDetails.baseSku || 'product'}_labels.pdf`);
  };

  const handlePrint = () => {
    const doc = generateLabelPdf(variants, productDetails, settings);
    const pdfDataUri = doc.output('datauristring');
    const win = window.open(pdfDataUri, '_blank');
    if (win) {
      win.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <QrCode className="w-5 h-5 text-sky-400" />
            <span>Product Label Generator</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-200 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
          <span>Internal barcodes are for your own inventory & barcode scanning use and are not official GS1 retail barcodes.</span>
        </div>

        {/* Size Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Label Size</label>
          <div className="grid grid-cols-4 gap-2 text-xs">
            {[
              { id: '50x25', label: '50mm x 25mm' },
              { id: '50x30', label: '50mm x 30mm' },
              { id: '40x25', label: '40mm x 25mm' },
              { id: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSettings({ ...settings, sizePreset: p.id as any })}
                className={`py-2 px-2.5 rounded-xl border font-medium text-center transition-all ${
                  settings.sizePreset === p.id
                    ? 'bg-sky-600/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions if custom */}
        {settings.sizePreset === 'custom' && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Width (mm)</label>
              <input
                type="number"
                value={settings.widthMm}
                onChange={e => setSettings({ ...settings, widthMm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Height (mm)</label>
              <input
                type="number"
                value={settings.heightMm}
                onChange={e => setSettings({ ...settings, heightMm: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* Elements Toggles */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Label Content</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { key: 'showProductName', label: 'Product Name' },
              { key: 'showVariantName', label: 'Variant Title' },
              { key: 'showSku', label: 'SKU Code' },
              { key: 'showPrice', label: 'Price' },
              { key: 'showBarcode', label: 'Barcode Image' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings as any)[item.key]}
                  onChange={e => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-sky-500"
                />
                <span className="text-slate-300 font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-slate-400">Live Print Preview:</span>
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center">
            <div className="bg-white text-slate-900 rounded-lg shadow-xl p-3 flex flex-col items-center justify-center text-center font-sans space-y-1 w-48 border border-slate-300">
              {settings.showProductName && (
                <div className="font-bold text-xs truncate max-w-full text-slate-900">
                  {productDetails.productName || 'Product Name'}
                </div>
              )}
              {settings.showVariantName && (
                <div className="text-[11px] text-slate-700 font-medium">
                  {sampleVariant.title}
                </div>
              )}
              {(settings.showSku || settings.showPrice) && (
                <div className="text-[10px] font-bold text-slate-800 font-mono">
                  {settings.showSku && `SKU: ${sampleVariant.sku}`}
                  {settings.showSku && settings.showPrice && ' | '}
                  {settings.showPrice && `₹${sampleVariant.price}`}
                </div>
              )}
              {settings.showBarcode && previewBarcode && (
                <img src={previewBarcode} alt="Barcode" className="h-8 object-contain max-w-full pt-0.5" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold shadow transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Labels</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Label PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
