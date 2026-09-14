import React, { useState } from 'react';
import { parseProductFile, ImportResult } from '../utils/importer';
import { OptionGroup, Variant } from '../types/variant';
import { Upload, FileSpreadsheet, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  currentOptionGroups: OptionGroup[];
  currentVariants: Variant[];
  onImportDone: (res: ImportResult, generateMissingOnly: boolean) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  currentOptionGroups,
  currentVariants,
  onImportDone,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importRes, setImportRes] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await parseProductFile(selected);
      setImportRes(res);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to parse file. Please upload a valid CSV or XLSX product file.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = (generateMissingOnly: boolean) => {
    if (!importRes) return;
    onImportDone(importRes, generateMissingOnly);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <span>Import Existing Product File</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        {!importRes ? (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl bg-slate-900/60 cursor-pointer transition-all">
              <Upload className="w-10 h-10 text-sky-400 mb-3" />
              <span className="text-xs font-semibold text-white">Click or drag CSV / XLSX file here</span>
              <span className="text-[11px] text-slate-400 mt-1">Supports Shopify CSVs, catalog exports, or product tables</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {loading && (
              <div className="p-3 text-center text-xs text-sky-400 font-medium animate-pulse">
                Parsing product data...
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}
          </div>
        ) : (
          /* Parsed Summary & Choice */
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>File Processed Successfully</span>
              </div>
              <div className="text-slate-300 space-y-1 pt-1 border-t border-slate-800">
                <p><strong>Products Found:</strong> {importRes.existingVariants.length} rows</p>
                {importRes.productName && <p><strong>Product Title:</strong> {importRes.productName}</p>}
                {importRes.detectedOptionNames.length > 0 && (
                  <p><strong>Detected Options:</strong> {importRes.detectedOptionNames.join(', ')}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmImport(false)}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2"
              >
                <span>Load Imported Product Data</span>
              </button>

              {currentOptionGroups.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleConfirmImport(true)}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold shadow transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Generate Missing Variants Only</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
