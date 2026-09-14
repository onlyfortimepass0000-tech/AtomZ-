import React, { useState, useEffect } from 'react';
import { ProductDetails, OptionGroup, SkuSettings, Variant } from './types/variant';
import { Header } from './components/Header';
import { StepProduct } from './components/StepProduct';
import { StepOptions } from './components/StepOptions';
import { VariantTable } from './components/VariantTable';
import { ExportBar } from './components/ExportBar';
import { generateVariants, findMissingCombinations, createVariantTitle, generateInternalBarcode } from './utils/combinator';
import { validateVariants } from './utils/validator';
import { generateSku } from './utils/skuGenerator';
import { ImportResult } from './utils/importer';

export function App() {
  // State
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    productName: 'Oversized Tee',
    baseSku: 'OT',
    price: 1299,
    compareAtPrice: 1999,
    costPrice: 450,
  });

  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([
    {
      id: 'g_color',
      name: 'Color',
      values: [
        { id: 'v_blk', value: 'Black' },
        { id: 'v_wht', value: 'White' },
        { id: 'v_nvy', value: 'Navy' },
      ],
    },
    {
      id: 'g_size',
      name: 'Size',
      values: [
        { id: 'v_s', value: 'Small' },
        { id: 'v_m', value: 'Medium' },
        { id: 'v_l', value: 'Large' },
        { id: 'v_xl', value: 'Extra Large' },
      ],
    },
    {
      id: 'g_fit',
      name: 'Fit',
      values: [
        { id: 'v_reg', value: 'Regular' },
        { id: 'v_ovr', value: 'Oversized' },
      ],
    },
  ]);

  const [skuSettings, setSkuSettings] = useState<SkuSettings>({
    separator: '-',
    casing: 'UPPERCASE',
    useAbbreviations: true,
    customAbbreviations: {},
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [historyStack, setHistoryStack] = useState<Variant[][]>([]);

  // Automatically validate variants whenever variants or product details change
  useEffect(() => {
    if (variants.length > 0) {
      const validated = validateVariants(variants, productDetails);
      const needsUpdate = validated.some((v, idx) => {
        const orig = variants[idx];
        return !orig || orig.status !== v.status || orig.validationErrors.length !== v.validationErrors.length;
      });
      if (needsUpdate) {
        setVariants(validated);
      }
    }
  }, [productDetails]);

  // Actions
  const pushHistory = (newVariants: Variant[]) => {
    setHistoryStack(prev => [...prev.slice(-10), variants]);
    setVariants(validateVariants(newVariants, productDetails));
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setVariants(previousState);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all generated variants? Your setup options will remain.')) {
      pushHistory([]);
    }
  };

  const handleGenerateVariants = () => {
    const rawVariants = generateVariants(productDetails, optionGroups, skuSettings);
    pushHistory(rawVariants);
  };

  const handleImportDone = (res: ImportResult, generateMissingOnly: boolean) => {
    if (res.productName) setProductDetails(prev => ({ ...prev, productName: res.productName! }));
    if (res.baseSku) setProductDetails(prev => ({ ...prev, baseSku: res.baseSku! }));
    if (res.basePrice && res.basePrice > 0) setProductDetails(prev => ({ ...prev, price: res.basePrice! }));

    if (generateMissingOnly && variants.length > 0) {
      // Missing variants generator
      const missingCombos = findMissingCombinations(variants, optionGroups);
      const basePrice = typeof productDetails.price === 'number' ? productDetails.price : parseFloat(productDetails.price) || 0;

      const newMissingVariants: Variant[] = missingCombos.map((combo, idx) => {
        const title = createVariantTitle(combo, optionGroups);
        const optionVals = optionGroups.map(g => combo[g.name] || '');
        const sku = generateSku(productDetails.baseSku, optionVals, skuSettings);
        const barcode = generateInternalBarcode(sku, variants.length + idx);

        return {
          id: `missing_${Date.now()}_${idx}`,
          title,
          options: combo,
          sku,
          price: basePrice,
          compareAtPrice: productDetails.compareAtPrice ? parseFloat(String(productDetails.compareAtPrice)) || null : null,
          costPrice: productDetails.costPrice ? parseFloat(String(productDetails.costPrice)) || null : null,
          inventory: 10,
          barcode,
          isInternalBarcode: true,
          status: 'READY',
          validationErrors: [],
        };
      });

      pushHistory([...variants, ...newMissingVariants]);
    } else {
      pushHistory(res.existingVariants);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      {/* Header */}
      <Header
        canUndo={historyStack.length > 0}
        onUndo={handleUndo}
        onReset={handleReset}
        hasVariants={variants.length > 0}
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800/80 py-8 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Resize one product into every variant in seconds.
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto font-medium">
            Product + options in <span className="text-sky-400 font-bold">&rarr;</span> All variants generated <span className="text-sky-400 font-bold">&rarr;</span> SKUs created <span className="text-sky-400 font-bold">&rarr;</span> Ready export file out.
          </p>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Setup Phase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Step 1: Product Details */}
          <div className="lg:col-span-5 space-y-6">
            <StepProduct
              product={productDetails}
              onChange={setProductDetails}
            />
          </div>

          {/* Step 2: Options Builder */}
          <div className="lg:col-span-7 space-y-6">
            <StepOptions
              optionGroups={optionGroups}
              skuSettings={skuSettings}
              onChangeOptions={setOptionGroups}
              onChangeSkuSettings={setSkuSettings}
              onGenerate={handleGenerateVariants}
            />
          </div>
        </div>

        {/* Variants Matrix Table & Exports (When Variants Exist) */}
        {variants.length > 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <VariantTable
              variants={variants}
              optionGroups={optionGroups}
              productDetails={productDetails}
              onUpdateVariants={pushHistory}
              onImportDone={handleImportDone}
            />

            <ExportBar
              variants={variants}
              productName={productDetails.productName}
              optionGroups={optionGroups}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>VariantForge by Atomz &bull; 100% Client-Side Local Browser Tool</p>
        </div>
      </footer>
    </div>
  );
}
