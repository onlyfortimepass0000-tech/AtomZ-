import React from 'react';
import { Variant, OptionGroup } from '../types/variant';
import { exportToGenericCsv, exportToXlsx, exportToShopifyCsv, sanitizeFilename } from '../utils/exporter';
import { Tooltip } from './Tooltip';
import { Download, FileSpreadsheet, ShoppingBag } from 'lucide-react';

interface ExportBarProps {
  variants: Variant[];
  productName: string;
  optionGroups: OptionGroup[];
}

export const ExportBar: React.FC<ExportBarProps> = ({ variants, productName, optionGroups }) => {
  const readyCount = variants.filter(v => v.status === 'READY').length;
  const targetFilename = sanitizeFilename(productName || 'product', '_variants', '.csv');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      <div>
        <span className="block text-xs font-bold text-white">Export Product Variants</span>
        <span className="block text-[11px] text-slate-400">
          Target filename: <code className="text-sky-400 font-mono">{targetFilename}</code> ({readyCount} ready)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => exportToGenericCsv(variants, productName)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shadow transition-all"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Generic CSV</span>
        </button>

        <button
          type="button"
          onClick={() => exportToXlsx(variants, productName)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shadow transition-all"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Excel XLSX</span>
        </button>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => exportToShopifyCsv(variants, productName, optionGroups)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shopify CSV</span>
          </button>
          <Tooltip content="Creates a file formatted specifically for importing variants directly into Shopify." />
        </div>
      </div>
    </div>
  );
};
