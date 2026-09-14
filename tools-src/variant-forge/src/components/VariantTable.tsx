import React, { useState, useMemo } from 'react';
import { Variant, OptionGroup, FilterState, ProductDetails, BulkEditOptions } from '../types/variant';
import { Tooltip } from './Tooltip';
import { BulkEditModal } from './BulkEditModal';
import { LabelModal } from './LabelModal';
import { ImportModal } from './ImportModal';
import { ImportResult } from '../utils/importer';
import { applyBulkEdit } from '../utils/bulkEditor';
import { Search, Filter, Sliders, QrCode, Upload, Trash2, AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface VariantTableProps {
  variants: Variant[];
  optionGroups: OptionGroup[];
  productDetails: ProductDetails;
  onUpdateVariants: (updated: Variant[]) => void;
  onImportDone: (res: ImportResult, generateMissingOnly: boolean) => void;
}

export const VariantTable: React.FC<VariantTableProps> = ({
  variants,
  optionGroups,
  productDetails,
  onUpdateVariants,
  onImportDone,
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    status: 'ALL',
    optionFilters: {},
  });

  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filter Logic
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      // Search
      if (filterState.search.trim()) {
        const query = filterState.search.toLowerCase().trim();
        const matchesSku = v.sku.toLowerCase().includes(query);
        const matchesTitle = v.title.toLowerCase().includes(query);
        const matchesBarcode = v.barcode.toLowerCase().includes(query);
        if (!matchesSku && !matchesTitle && !matchesBarcode) return false;
      }

      // Status
      if (filterState.status !== 'ALL' && v.status !== filterState.status) {
        return false;
      }

      // Option Filters
      for (const [optName, optVal] of Object.entries(filterState.optionFilters)) {
        if (optVal && v.options[optName]?.toLowerCase() !== optVal.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [variants, filterState]);

  // Pagination
  const totalPages = Math.ceil(filteredVariants.length / pageSize) || 1;
  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVariants.slice(start, start + pageSize);
  }, [filteredVariants, currentPage]);

  const handleCellChange = (id: string, field: keyof Variant, val: any) => {
    const updated = variants.map(v => {
      if (v.id === id) {
        return { ...v, [field]: val };
      }
      return v;
    });
    onUpdateVariants(updated);
  };

  const handleDeleteVariant = (id: string) => {
    onUpdateVariants(variants.filter(v => v.id !== id));
  };

  const handleApplyBulkEdit = (bulkOpts: BulkEditOptions) => {
    const updated = applyBulkEdit(variants, bulkOpts);
    onUpdateVariants(updated);
  };

  const readyCount = variants.filter(v => v.status === 'READY').length;
  const fixCount = variants.filter(v => v.status === 'NEEDS_FIX').length;

  return (
    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Table Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-700/60">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Variant Matrix</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full font-mono">
              {variants.length} Total
            </span>
          </h2>
          <p className="text-xs text-slate-400">Review, edit, filter, or export generated variants</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulkEdit(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Bulk Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLabelModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Barcode Labels</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Import CSV/XLSX</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-700/80">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterState.search}
            onChange={e => {
              setFilterState({ ...filterState, search: e.target.value });
              setCurrentPage(1);
            }}
            placeholder="Search SKU, Variant name, or barcode..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setFilterState({ ...filterState, status: 'ALL' });
              setCurrentPage(1);
            }}
            className={`flex-1 py-1 text-[11px] font-semibold rounded transition-all ${
              filterState.status === 'ALL'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({variants.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterState({ ...filterState, status: 'READY' });
              setCurrentPage(1);
            }}
            className={`flex-1 py-1 text-[11px] font-semibold rounded transition-all ${
              filterState.status === 'READY'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-emerald-400 hover:text-emerald-200'
            }`}
          >
            Ready ({readyCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterState({ ...filterState, status: 'NEEDS_FIX' });
              setCurrentPage(1);
            }}
            className={`flex-1 py-1 text-[11px] font-semibold rounded transition-all ${
              filterState.status === 'NEEDS_FIX'
                ? 'bg-rose-600 text-white shadow'
                : 'text-rose-400 hover:text-rose-200'
            }`}
          >
            Fix ({fixCount})
          </button>
        </div>

        {/* Dynamic Option Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          {optionGroups.slice(0, 2).map(g => (
            <select
              key={g.id}
              value={filterState.optionFilters[g.name] || ''}
              onChange={e => {
                setFilterState({
                  ...filterState,
                  optionFilters: { ...filterState.optionFilters, [g.name]: e.target.value }
                });
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
            >
              <option value="">All {g.name}s</option>
              {g.values.map(v => (
                <option key={v.id} value={v.value}>{v.value}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5">
                <span className="flex items-center">
                  Variant
                  <Tooltip content="One specific combination, such as Black / Large." />
                </span>
              </th>
              <th className="py-3 px-3">SKU</th>
              <th className="py-3 px-3">Price (₹)</th>
              <th className="py-3 px-3">Compare-at</th>
              <th className="py-3 px-3">Cost</th>
              <th className="py-3 px-3">Stock</th>
              <th className="py-3 px-3">
                <span className="flex items-center">
                  Barcode
                  <Tooltip content="A barcode for your own stock tracking, not an official retail GTIN." />
                </span>
              </th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-medium">
            {paginatedVariants.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                  No variants match your search or filter criteria.
                </td>
              </tr>
            ) : (
              paginatedVariants.map(v => (
                <tr
                  key={v.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    v.status === 'NEEDS_FIX' ? 'bg-rose-950/20' : ''
                  }`}
                >
                  {/* Variant Title */}
                  <td className="py-2.5 px-3.5 font-semibold text-white">
                    {v.title}
                  </td>

                  {/* SKU */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={v.sku}
                      onChange={e => handleCellChange(v.id, 'sku', e.target.value.toUpperCase())}
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono uppercase focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Price */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={v.price}
                      onChange={e => handleCellChange(v.id, 'price', parseFloat(e.target.value) || 0)}
                      step="any"
                      min="0"
                      className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Compare-at */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={v.compareAtPrice !== null ? v.compareAtPrice : ''}
                      onChange={e => handleCellChange(v.id, 'compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="—"
                      step="any"
                      min="0"
                      className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Cost */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={v.costPrice !== null ? v.costPrice : ''}
                      onChange={e => handleCellChange(v.id, 'costPrice', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="—"
                      step="any"
                      min="0"
                      className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Inventory */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={v.inventory}
                      onChange={e => handleCellChange(v.id, 'inventory', parseInt(e.target.value, 10) || 0)}
                      min="0"
                      className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Barcode */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={v.barcode}
                      onChange={e => handleCellChange(v.id, 'barcode', e.target.value)}
                      className="w-28 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3">
                    {v.status === 'READY' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        READY
                      </span>
                    ) : (
                      <div className="relative group/err">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold cursor-help">
                          <AlertCircle className="w-3 h-3" />
                          NEEDS FIX
                        </span>
                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover/err:block w-48 p-2 bg-slate-900 text-rose-300 text-[11px] rounded-lg shadow-xl border border-rose-500/30 z-30">
                          {v.validationErrors.map((err, i) => (
                            <div key={i}>• {err}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Delete */}
                  <td className="py-2.5 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteVariant(v.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Delete variant"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredVariants.length)} of {filteredVariants.length} variants
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showBulkEdit && (
        <BulkEditModal
          optionGroups={optionGroups}
          onApply={handleApplyBulkEdit}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {showLabelModal && (
        <LabelModal
          variants={variants}
          productDetails={productDetails}
          onClose={() => setShowLabelModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          currentOptionGroups={optionGroups}
          currentVariants={variants}
          onImportDone={onImportDone}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
};
