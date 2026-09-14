import React from 'react';
import { ProductDetails } from '../types/variant';
import { Tooltip } from './Tooltip';
import { Tag, IndianRupee } from 'lucide-react';

interface StepProductProps {
  product: ProductDetails;
  onChange: (updated: ProductDetails) => void;
}

export const StepProduct: React.FC<StepProductProps> = ({ product, onChange }) => {
  return (
    <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/60">
        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
          1
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Product Details</h2>
          <p className="text-xs text-slate-400">Enter base info for your product line</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product Name */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Product Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={product.productName}
              onChange={e => onChange({ ...product, productName: e.target.value })}
              placeholder="e.g. Oversized Tee"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Base SKU */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center">
            Base SKU <span className="text-rose-400">*</span>
            <Tooltip content="Your main product code used to create variant SKUs (e.g. OT for Oversized Tee)." />
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Tag className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={product.baseSku}
              onChange={e => onChange({ ...product, baseSku: e.target.value.toUpperCase() })}
              placeholder="e.g. OT"
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all uppercase"
            />
          </div>
        </div>

        {/* Base Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Base Price <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <IndianRupee className="w-4 h-4" />
            </div>
            <input
              type="number"
              value={product.price}
              onChange={e => onChange({ ...product, price: e.target.value })}
              placeholder="e.g. 1299"
              min="0"
              step="any"
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>

        {/* Compare-at Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Compare-at Price <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            value={product.compareAtPrice || ''}
            onChange={e => onChange({ ...product, compareAtPrice: e.target.value })}
            placeholder="e.g. 1999"
            min="0"
            step="any"
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Cost Price <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="number"
            value={product.costPrice || ''}
            onChange={e => onChange({ ...product, costPrice: e.target.value })}
            placeholder="e.g. 450"
            min="0"
            step="any"
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
