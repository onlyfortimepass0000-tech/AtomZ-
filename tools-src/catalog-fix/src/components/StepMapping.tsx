import React from 'react';
import { ColumnMapping, PlatformSpec } from '../types';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface StepMappingProps {
  sourceHeaders: string[];
  platformSpec: PlatformSpec;
  mapping: ColumnMapping;
  onMappingChange: (targetKey: string, sourceCol: string) => void;
  onNext: () => void;
}

export const StepMapping: React.FC<StepMappingProps> = ({
  sourceHeaders,
  platformSpec,
  mapping,
  onMappingChange,
  onNext,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white font-display mb-2 flex items-center gap-2">
            <span>Column Mapping</span>
            <Tooltip text="Match your current spreadsheet columns to the format your platform expects." />
          </h2>
          <p className="text-xs text-gray-400">
            We automatically matched your spreadsheet columns to {platformSpec.name}. Verify or adjust mappings below.
          </p>
        </div>

        {/* Mapping Rows Grid */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          {platformSpec.fields.map((field) => {
            const mappedCol = mapping[field.key] || '';
            const isMapped = Boolean(mappedCol);

            return (
              <div
                key={field.key}
                className="p-4 bg-gray-950/80 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                {/* Target Field Info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                      isMapped
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : field.required
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {isMapped ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white font-mono flex items-center gap-1.5">
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="text-[10px] text-red-400 font-sans font-medium uppercase">
                          *Required
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Synonyms: {field.synonyms.slice(0, 3).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Mapping Select */}
                <div className="w-full sm:w-64">
                  <select
                    value={mappedCol}
                    onChange={(e) => onMappingChange(field.key, e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- Select Source Column --</option>
                    {sourceHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onNext}
            className="w-full py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2 transition-all duration-200"
          >
            <span>Clean, Fix & Review Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
