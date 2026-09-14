import React, { useState, useMemo } from 'react';
import { PlatformSpec, ProcessedProduct, ColumnMapping } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { validateAndProcessCatalog } from '../utils/validator';

interface StepFixReviewProps {
  products: ProcessedProduct[];
  setProducts: React.Dispatch<React.SetStateAction<ProcessedProduct[]>>;
  platformSpec: PlatformSpec;
  rawRows: Record<string, any>[];
  mapping: ColumnMapping;
  onNext: () => void;
}

export const StepFixReview: React.FC<StepFixReviewProps> = ({
  products,
  setProducts,
  platformSpec,
  rawRows,
  mapping,
  onNext,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'READY' | 'NEEDS_FIX'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const readyCount = useMemo(() => products.filter((p) => p.status === 'READY').length, [products]);
  const fixCount = useMemo(() => products.filter((p) => p.status === 'NEEDS_FIX').length, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (p.data['title'] || '').toLowerCase();
        const id = (p.data['id'] || '').toLowerCase();
        return title.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [products, filterStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Inline cell edit with immediate revalidation
  const handleCellEdit = (rowIndex: number, fieldKey: string, newValue: string) => {
    setProducts((prevProducts) => {
      const updated = prevProducts.map((p) => {
        if (p.rowIndex !== rowIndex) return p;
        return {
          ...p,
          data: {
            ...p.data,
            [fieldKey]: newValue,
          },
        };
      });

      // Revalidate duplicate IDs across full dataset
      const idCounts = new Map<string, number>();
      updated.forEach((item) => {
        const idVal = item.data['id'];
        if (idVal) {
          idCounts.set(idVal, (idCounts.get(idVal) || 0) + 1);
        }
      });

      return updated.map((item) => {
        const issues = [...item.issues].filter((i) => i.field !== fieldKey && i.field !== 'id');
        const productId = item.data['id'] || `Row ${item.rowIndex + 1}`;

        // Re-check edited field requiredness
        const fieldSpec = platformSpec.fields.find((f) => f.key === fieldKey);
        if (fieldSpec?.required && (!item.data[fieldKey] || item.data[fieldKey].trim() === '')) {
          issues.push({
            rowIndex: item.rowIndex,
            productId,
            field: fieldSpec.label,
            type: 'error',
            message: `Missing required field: "${fieldSpec.label}"`,
          });
        }

        // Re-check duplicate ID
        const currentId = item.data['id'];
        if (currentId && (idCounts.get(currentId) || 0) > 1) {
          issues.push({
            rowIndex: item.rowIndex,
            productId,
            field: 'id',
            type: 'error',
            message: `Duplicate product ID: "${currentId}"`,
          });
        }

        const hasErrors = issues.some((i) => i.type === 'error');
        return {
          ...item,
          status: hasErrors ? 'NEEDS_FIX' : 'READY',
          issues,
        };
      });
    });
  };

  // Reset to original dataset
  const handleResetToOriginal = () => {
    if (confirm('Reset all edited values to original spreadsheet data?')) {
      const fresh = validateAndProcessCatalog(rawRows, mapping, platformSpec);
      setProducts(fresh);
    }
  };

  // Quick Fixes
  const handleQuickFixAvailability = () => {
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        data: {
          ...p.data,
          availability: p.data['availability'] === 'out of stock' ? 'out of stock' : 'in stock',
        },
      }))
    );
  };

  const handleQuickFixTrimSpaces = () => {
    setProducts((prev) =>
      prev.map((p) => {
        const trimmedData: Record<string, string> = {};
        Object.keys(p.data).forEach((k) => {
          trimmedData[k] = (p.data[k] || '').trim().replace(/\s+/g, ' ');
        });
        return { ...p, data: trimmedData };
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-emerald-950/40 border border-emerald-800/80 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-3xl font-extrabold text-white font-display">{readyCount}</span>
            <span className="text-xs text-emerald-400 font-semibold block mt-1">
              Products Upload-Ready
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-6 bg-amber-950/40 border border-amber-800/80 rounded-3xl flex items-center justify-between">
          <div>
            <span className="text-3xl font-extrabold text-white font-display">{fixCount}</span>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1 mt-1">
              <span>Products Need Attention</span>
              <Tooltip text="This item is missing or contains invalid information." />
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Fixes Bar */}
      <div className="p-5 bg-gray-900/90 border border-gray-800 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>One-Click Quick Fixes</span>
          </h3>

          <button
            type="button"
            onClick={handleResetToOriginal}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Original</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleQuickFixAvailability}
            className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-xl transition-colors"
          >
            Normalize all availability values
          </button>

          <button
            type="button"
            onClick={handleQuickFixTrimSpaces}
            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl transition-colors"
          >
            Trim extra spaces everywhere
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900/90 border border-gray-800 rounded-3xl">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setFilterStatus('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors border ${
              filterStatus === 'all'
                ? 'bg-orange-600 border-orange-500 text-white'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All ({products.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterStatus('READY');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors border ${
              filterStatus === 'READY'
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Ready ({readyCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterStatus('NEEDS_FIX');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-colors border ${
              filterStatus === 'NEEDS_FIX'
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Needs Fix ({fixCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Title or SKU..."
            className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Editable Catalog Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 font-mono">
                <th className="p-3 w-16 text-center">Status</th>
                {platformSpec.fields.map((field) => (
                  <th key={field.key} className="p-3 min-w-[140px] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>{field.label}</span>
                      {field.key === 'availability' && (
                        <Tooltip text="Whether the product is currently available to purchase." />
                      )}
                      {field.key === 'item_group_id' && (
                        <Tooltip text="Groups different variants of the same product together." />
                      )}
                      {field.key === 'gtin' && (
                        <Tooltip text="A global product identifier such as a barcode number." />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={platformSpec.fields.length + 1}
                    className="p-8 text-center text-gray-500 font-normal"
                  >
                    No products match the selected filter or search query.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item) => {
                  const isReady = item.status === 'READY';
                  return (
                    <tr
                      key={item.rowIndex}
                      className={`hover:bg-gray-950/60 transition-colors ${
                        !isReady ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Status Badge */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isReady
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Field Inputs */}
                      {platformSpec.fields.map((field) => {
                        const val = item.data[field.key] || '';
                        const hasIssue = item.issues.some((i) => i.field === field.label || i.field === field.key);

                        return (
                          <td key={field.key} className="p-2">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) =>
                                handleCellEdit(item.rowIndex, field.key, e.target.value)
                              }
                              className={`w-full bg-gray-950 border rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                                hasIssue
                                  ? 'border-amber-500/80 text-amber-200 bg-amber-950/20 focus:border-amber-400'
                                  : 'border-gray-800 text-gray-200 focus:border-orange-500'
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>
            Page {currentPage} of {totalPages} ({filteredProducts.length} items)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="p-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Continue to Download Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2 transition-all duration-200"
        >
          <span>Continue to Download ({readyCount} Ready)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
