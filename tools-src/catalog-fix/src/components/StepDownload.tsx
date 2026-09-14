import React, { useState } from 'react';
import { PlatformSpec, ProcessedProduct } from '../types';
import { Download, FileSpreadsheet, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { exportCleanCatalog, exportErrorReport } from '../utils/exporter';

interface StepDownloadProps {
  products: ProcessedProduct[];
  platformSpec: PlatformSpec;
  originalFileName: string;
  onStartOver: () => void;
}

export const StepDownload: React.FC<StepDownloadProps> = ({
  products,
  platformSpec,
  originalFileName,
  onStartOver,
}) => {
  const [fileFormat, setFileFormat] = useState<'csv' | 'xlsx'>('csv');

  const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
  const [customName, setCustomName] = useState(`${baseName}_${platformSpec.id}_fixed`);

  const readyProducts = products.filter((p) => p.status === 'READY');
  const fixProducts = products.filter((p) => p.status === 'NEEDS_FIX');

  const handleDownload = () => {
    exportCleanCatalog(readyProducts, platformSpec, fileFormat, customName.trim());
  };

  const handleDownloadErrors = () => {
    exportErrorReport(products);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Ready Status Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-8 space-y-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-white font-display">
            Your catalog is ready to upload.
          </h2>
          <p className="text-sm text-gray-400 mt-2 max-w-lg mx-auto">
            Formatted specifically for <strong className="text-white">{platformSpec.name}</strong>.
          </p>
        </div>

        <div className="flex justify-center gap-6 text-xs text-gray-400 py-2 border-y border-gray-800">
          <div>
            <span className="text-lg font-bold text-white block">{readyProducts.length}</span>
            <span>Upload-Ready Products</span>
          </div>
          {fixProducts.length > 0 && (
            <div>
              <span className="text-lg font-bold text-amber-400 block">{fixProducts.length}</span>
              <span>Needs Attention</span>
            </div>
          )}
        </div>

        {/* File Format & Name Config */}
        <div className="space-y-4 text-left bg-gray-950/80 p-5 border border-gray-800 rounded-2xl">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Export File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFileFormat('csv')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                  fileFormat === 'csv'
                    ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                CSV File (.csv)
              </button>
              <button
                type="button"
                onClick={() => setFileFormat('xlsx')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center ${
                  fileFormat === 'xlsx'
                    ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/20'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Excel File (.xlsx)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Catalog Filename
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>
        </div>

        {/* Download Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-base shadow-xl shadow-orange-600/25 flex items-center justify-center gap-3 transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            <span>Download Ready Catalog ({readyProducts.length} Products)</span>
          </button>

          {fixProducts.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadErrors}
              className="w-full py-3 px-6 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Download Error Report ({fixProducts.length} Items)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartOver}
            className="w-full py-3 px-6 rounded-2xl bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Upload Another File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
