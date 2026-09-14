import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Header } from './components/Header';
import { CatalogPriceItem, PricingRule, RuleType, RoundingType } from './types/priceBatch';
import { parseCatalogRows, applyPricingRule } from './engine/priceBatch';
import { Upload, Download, ArrowRight, RefreshCw, DollarSign, TrendingUp, TrendingDown, Percent, RotateCcw, AlertTriangle } from 'lucide-react';

export const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [fileName, setFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);

  // Catalog items memory history for Undo / Reset
  const [originalItems, setOriginalItems] = useState<CatalogPriceItem[]>([]);
  const [currentItems, setCurrentItems] = useState<CatalogPriceItem[]>([]);
  const [history, setHistory] = useState<CatalogPriceItem[][]>([]);

  // Rule State
  const [ruleType, setRuleType] = useState<RuleType>('INCREASE_PCT');
  const [ruleValue, setRuleValue] = useState<number>(10);
  const [roundingType, setRoundingType] = useState<RoundingType>('ENDING_99');

  // Filter
  const [filterField, setFilterField] = useState<'ALL' | 'Category' | 'Collection' | 'SKU' | 'Variant'>('ALL');
  const [filterValue, setFilterValue] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

        if (data.length > 0) {
          setRawRows(data);
          const parsed = parseCatalogRows(data);
          setOriginalItems(parsed);
          setCurrentItems(parsed);
          setHistory([parsed]);
          setStep(2);
        }
      } catch (err) {
        alert('Failed to parse catalog spreadsheet. Please upload a valid CSV or XLSX file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyRule = () => {
    const rule: PricingRule = {
      type: ruleType,
      value: ruleValue,
      roundingType,
      filterField,
      filterValue,
    };

    const updated = applyPricingRule(currentItems, rule);
    setHistory(prev => [...prev, updated]);
    setCurrentItems(updated);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHist = history.slice(0, -1);
      setHistory(newHist);
      setCurrentItems(newHist[newHist.length - 1]);
    }
  };

  const handleReset = () => {
    setCurrentItems(originalItems);
    setHistory([originalItems]);
  };

  const handleExport = (changesOnly: boolean, format: 'csv' | 'xlsx') => {
    if (currentItems.length === 0) return;

    let exportData: any[] = [];

    if (changesOnly) {
      exportData = currentItems.filter(i => i.changeAmount !== 0).map(i => ({
        'SKU': i.sku,
        'Product Name': i.productName,
        'Old Price': i.oldPrice,
        'New Price': i.newPrice,
        'Difference': i.changeAmount > 0 ? `+${i.changeAmount}` : i.changeAmount,
      }));
    } else {
      exportData = rawRows.map((row, idx) => {
        const item = currentItems[idx];
        return {
          ...row,
          'Price': item ? item.newPrice : row['Price'],
        };
      });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, changesOnly ? 'Price Changes' : 'Updated Catalog');

    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}_${changesOnly ? 'Changes' : 'UpdatedPrices'}.${format}`;
    if (format === 'csv') {
      XLSX.writeFile(wb, outName, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, outName, { bookType: 'xlsx' });
    }
  };

  const totalChanged = currentItems.filter(i => i.changeAmount !== 0).length;
  const flagCount = currentItems.filter(i => i.flags.length > 0).length;

  return (
    <div className="min-h-screen bg-[#0E0E10] text-gray-100 flex flex-col font-sans">
      <Header toolName="PriceBatch" tagline="Bulk Catalog Pricing Rule Engine" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-8 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/30 text-[#FF5722] flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Upload your catalog spreadsheet</h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Accepts CSV, XLSX, or XLS files. Apply percentage increases, markup on cost, minimum margin rules, and price ending roundings across hundreds of rows.
              </p>
            </div>

            <label className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#FF5722] hover:bg-[#10b981]/90 text-white font-bold text-sm shadow-xl shadow-[#FF5722]/20 cursor-pointer transition-all gap-2">
              <Upload className="w-4 h-4" />
              <span>Select Catalog File</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>

            <div className="pt-4 border-t border-[#24242A] text-xs text-gray-500 font-mono">
              🔒 100% Client-Side. Your original file is preserved in memory.
            </div>
          </div>
        )}

        {/* STEP 2: PRICING RULES & BEFORE/AFTER PREVIEW */}
        {step === 2 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Rule Selector Cards */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#24242A] pb-3">
                <h3 className="text-sm font-bold text-white">Select Pricing Rule</h3>
                <span className="text-xs font-mono text-[#FF5722]">{currentItems.length} Products Loaded</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { type: 'INCREASE_PCT', title: 'Increase %', desc: 'Add % to current price', icon: TrendingUp },
                  { type: 'DECREASE_PCT', title: 'Decrease %', desc: 'Discount % off price', icon: TrendingDown },
                  { type: 'ADD_FIXED', title: 'Add Fixed ₹', desc: 'Add fixed amount', icon: DollarSign },
                  { type: 'MARKUP_COST', title: 'Cost Markup', desc: 'Set Price = Cost + %', icon: Percent },
                  { type: 'MIN_MARGIN_PCT', title: 'Min Margin %', desc: 'Ensure min gross margin', icon: Percent },
                  { type: 'ROUND_ENDING', title: 'Price Ending', desc: 'Round ending to .99 / .49', icon: RefreshCw },
                ].map(r => {
                  const IconComp = r.icon;
                  return (
                    <button
                      key={r.type}
                      onClick={() => setRuleType(r.type as RuleType)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        ruleType === r.type
                          ? 'bg-[#FF5722]/10 border-[#FF5722] text-white shadow-lg shadow-[#FF5722]/10'
                          : 'bg-[#0E0E10] border-[#24242A] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <IconComp className="w-4 h-4 text-[#FF5722]" />
                        <span className="font-bold text-xs">{r.title}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{r.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Rule Options & Filter Inputs */}
              <div className="bg-[#0E0E10] border border-[#24242A] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Rule Value */}
                {ruleType !== 'ROUND_ENDING' && (
                  <div className="space-y-1">
                    <label className="text-gray-300 font-bold block">
                      Rule Value ({ruleType.includes('PCT') || ruleType === 'MARKUP_COST' ? '%' : '₹'})
                    </label>
                    <input
                      type="number"
                      value={ruleValue}
                      onChange={(e) => setRuleValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#151518] border border-[#24242A] text-white px-3 py-2 rounded-lg focus:border-[#FF5722] focus:outline-none font-mono"
                    />
                  </div>
                )}

                {/* Rounding Option */}
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold block">Price Ending Rounding</label>
                  <select
                    value={roundingType}
                    onChange={(e) => setRoundingType(e.target.value as RoundingType)}
                    className="w-full bg-[#151518] border border-[#24242A] text-white px-3 py-2 rounded-lg focus:border-[#FF5722] focus:outline-none"
                  >
                    <option value="ENDING_99">Round to ₹X99</option>
                    <option value="ENDING_49">Round to ₹X49</option>
                    <option value="NEAREST_10">Nearest ₹10</option>
                    <option value="NEAREST_100">Nearest ₹100</option>
                  </select>
                </div>

                {/* Filter Field */}
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold block">Apply Filter (Optional)</label>
                  <select
                    value={filterField}
                    onChange={(e) => setFilterField(e.target.value as any)}
                    className="w-full bg-[#151518] border border-[#24242A] text-white px-3 py-2 rounded-lg focus:border-[#FF5722] focus:outline-none"
                  >
                    <option value="ALL">All Products</option>
                    <option value="Category">Category</option>
                    <option value="Collection">Collection</option>
                    <option value="SKU">SKU</option>
                    <option value="Variant">Variant</option>
                  </select>
                </div>

                {filterField !== 'ALL' && (
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-gray-300 font-bold block">Filter Keyword (e.g. Footwear, XL)</label>
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="Type filter keyword..."
                      className="w-full bg-[#151518] border border-[#24242A] text-white px-3 py-2 rounded-lg focus:border-[#FF5722] focus:outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleUndo}
                    disabled={history.length <= 1}
                    className="px-3 py-1.5 rounded-lg bg-[#24242A] hover:bg-gray-700 disabled:opacity-40 text-xs font-bold text-gray-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg bg-[#24242A] hover:bg-gray-700 text-xs font-bold text-gray-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All</span>
                  </button>
                </div>

                <button
                  onClick={handleApplyRule}
                  className="px-6 py-3 rounded-xl bg-[#FF5722] hover:bg-[#10b981]/90 text-white font-bold text-xs shadow-lg shadow-[#FF5722]/20 flex items-center gap-2"
                >
                  <span>Apply Pricing Rule</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Before / After Table Preview */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#24242A] pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Price Change Preview</h3>
                  <span className="text-xs font-mono text-[#00F5A0] font-bold">({totalChanged} prices changed)</span>
                </div>
                {flagCount > 0 && (
                  <span className="text-xs font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{flagCount} warnings</span>
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {currentItems.map(item => (
                  <div key={item.id} className="bg-[#0E0E10] border border-[#24242A] p-3 rounded-xl flex items-center justify-between text-xs gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{item.productName}</span>
                        <span className="text-[10px] font-mono text-gray-500">({item.sku})</span>
                      </div>
                      {item.flags.length > 0 && (
                        <p className="text-[10px] text-amber-400 mt-0.5 font-mono">
                          Warning: {item.flags.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 font-mono shrink-0">
                      <div>
                        <span className="text-gray-500 text-[10px] block">BEFORE</span>
                        <span className="text-gray-300 font-bold">₹{item.oldPrice.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">AFTER</span>
                        <span className="text-white font-extrabold text-sm">₹{item.newPrice.toLocaleString()}</span>
                      </div>
                      <div className="text-right w-20">
                        <span className="text-gray-500 text-[10px] block">CHANGE</span>
                        <span className={`font-extrabold ${item.changeAmount > 0 ? 'text-[#00F5A0]' : (item.changeAmount < 0 ? 'text-red-400' : 'text-gray-500')}`}>
                          {item.changeAmount > 0 ? `+₹${item.changeAmount}` : (item.changeAmount < 0 ? `-₹${Math.abs(item.changeAmount)}` : '₹0')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Bar */}
            <div className="bg-[#151518] border border-[#24242A] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-[#24242A] text-gray-300 hover:text-white text-xs font-bold"
              >
                Upload Different File
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleExport(true, 'csv')}
                  className="px-5 py-3 rounded-xl bg-[#24242A] hover:bg-gray-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Changes Only CSV</span>
                </button>
                <button
                  onClick={() => handleExport(false, 'xlsx')}
                  className="px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#10b981]/90 text-white font-bold text-xs shadow-lg shadow-[#10B981]/20 flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Updated Catalog XLSX</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
