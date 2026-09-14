import React from 'react';
import { PlatformType } from '../types';
import { PLATFORM_SPECS } from '../constants/platforms';
import { ShoppingBag, Search, FileSpreadsheet, ArrowRight } from 'lucide-react';

interface StepPlatformProps {
  selectedPlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
  onNext: () => void;
  productCount: number;
  columnCount: number;
}

export const StepPlatform: React.FC<StepPlatformProps> = ({
  selectedPlatform,
  onSelectPlatform,
  onNext,
  productCount,
  columnCount,
}) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'meta':
        return <ShoppingBag className="w-6 h-6 text-blue-400" />;
      case 'google':
        return <Search className="w-6 h-6 text-emerald-400" />;
      case 'generic':
      default:
        return <FileSpreadsheet className="w-6 h-6 text-orange-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* File Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900/80 border border-gray-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Spreadsheet Uploaded</h2>
            <p className="text-xs font-mono text-gray-400">
              {productCount} Products Detected · {columnCount} Columns
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-display mb-2">
            Where are you uploading this catalog?
          </h2>
          <p className="text-xs text-gray-400">
            Select your destination platform. We will automatically format and validate required fields.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.values(PLATFORM_SPECS).map((spec) => {
            const isSelected = selectedPlatform === spec.id;
            return (
              <div
                key={spec.id}
                onClick={() => onSelectPlatform(spec.id as PlatformType)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-xl shadow-orange-500/10'
                    : 'bg-gray-950/60 border-gray-800/80 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                    {getIcon(spec.id)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display mb-1">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {spec.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between text-xs font-semibold text-orange-400">
                  <span>{isSelected ? 'Selected' : 'Select'}</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2 transition-all duration-200"
          >
            <span>Continue to Column Mapping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
