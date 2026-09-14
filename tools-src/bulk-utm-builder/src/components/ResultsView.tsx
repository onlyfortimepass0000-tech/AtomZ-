import React, { useState } from 'react';
import { NamingRules, URLItem, UTMConfig } from '../types';
import {
  Copy,
  Download,
  ExternalLink,
  Trash2,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Edit3,
  List,
} from 'lucide-react';
import { generateCSVContent, generateTXTContent, processUrlLine } from '../utils/utmEngine';

interface ResultsViewProps {
  urlItems: URLItem[];
  setUrlItems: React.Dispatch<React.SetStateAction<URLItem[]>>;
  globalUtm: UTMConfig;
  rules: NamingRules;
  onClearAll: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  urlItems,
  setUrlItems,
  globalUtm,
  rules,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const validItems = urlItems.filter((i) => i.isValid);

  const handleCopySingle = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const text = validItems.map((i) => i.generatedUrl).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csvStr = generateCSVContent(urlItems);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracked_urls_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTXT = () => {
    const txtStr = generateTXTContent(urlItems);
    const blob = new Blob([txtStr], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracked_urls_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRemoveItem = (id: string) => {
    setUrlItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Editable Table Inline Editing
  const handleItemOverrideChange = (
    id: string,
    field: keyof UTMConfig,
    val: string
  ) => {
    setUrlItems((prev) =>
      prev.map((item, idx) => {
        if (item.id !== id) return item;
        const currentOverrides = {
          source: item.source,
          medium: item.medium,
          campaign: item.campaign,
          content: item.content,
          term: item.term,
          [field]: val,
        };
        return processUrlLine(item.rawUrl, idx, globalUtm, rules, currentOverrides);
      })
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Action Header & Global Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gray-900/90 border border-gray-800 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <span>Generated Tracked Links</span>
            <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
              {validItems.length} Links Ready
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Copy individually or export all as CSV / TXT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Card vs Table View Toggle */}
          <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Bulk Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAll}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-1.5 transition-colors"
          >
            {copiedAll ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedAll ? 'Copied All!' : 'Copy All'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTXT}
            className="px-3.5 py-2 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/80 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>TXT</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 bg-gray-950 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {urlItems.map((item) => (
            <div
              key={item.id}
              className={`p-5 bg-gray-900/90 border rounded-3xl space-y-3 transition-all ${
                !item.isValid
                  ? 'border-red-800/80 bg-red-950/20'
                  : item.isDuplicate
                  ? 'border-amber-800/80 bg-amber-950/20'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {/* Warnings / Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {!item.isValid && (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Invalid URL Syntax</span>
                    </span>
                  )}
                  {item.isDuplicate && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Duplicate Tracked URL</span>
                    </span>
                  )}
                  {item.hasExistingUtms && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-semibold">
                      Existing UTMs Handled
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-mono text-gray-500 truncate max-w-xs sm:max-w-md">
                  Original: {item.rawUrl}
                </div>
              </div>

              {/* Tracked Link Display Box */}
              {item.isValid ? (
                <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-orange-400 break-all select-all">
                    {item.generatedUrl}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopySingle(item.generatedUrl, item.id)}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.generatedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 transition-colors"
                      title="Test Open Link in New Tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 bg-gray-900 hover:bg-gray-800 rounded-xl border border-gray-800 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-2xl text-xs text-red-300 flex items-center justify-between">
                  <span>{item.errorMessage || 'Invalid URL syntax'}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-red-400 hover:text-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW MODE 2: EDITABLE BULK TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 font-mono">
                <th className="p-3">Original URL</th>
                <th className="p-3">utm_source</th>
                <th className="p-3">utm_medium</th>
                <th className="p-3">utm_campaign</th>
                <th className="p-3">Generated Tracked URL</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {urlItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-950/50 transition-colors">
                  <td className="p-3 font-mono text-gray-300 max-w-xs truncate">
                    {item.rawUrl}
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.source}
                      onChange={(e) =>
                        handleItemOverrideChange(item.id, 'source', e.target.value)
                      }
                      className="w-28 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-white font-mono text-xs"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.medium}
                      onChange={(e) =>
                        handleItemOverrideChange(item.id, 'medium', e.target.value)
                      }
                      className="w-28 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-white font-mono text-xs"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={item.campaign}
                      onChange={(e) =>
                        handleItemOverrideChange(item.id, 'campaign', e.target.value)
                      }
                      className="w-32 bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-white font-mono text-xs"
                    />
                  </td>
                  <td className="p-3 font-mono text-orange-400 max-w-xs truncate">
                    {item.generatedUrl}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.generatedUrl, item.id)}
                        className="p-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
