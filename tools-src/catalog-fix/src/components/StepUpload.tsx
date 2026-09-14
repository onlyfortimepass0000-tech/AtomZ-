import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, FileType, Loader2, AlertCircle } from 'lucide-react';
import { parseSpreadsheetFile } from '../utils/fileParser';
import { ParseResult } from '../types';

interface StepUploadProps {
  onParsed: (result: ParseResult) => void;
}

export const StepUpload: React.FC<StepUploadProps> = ({ onParsed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a CSV, XLSX, or XLS spreadsheet file.');
      return;
    }

    try {
      setIsLoading(true);
      const parseRes = await parseSpreadsheetFile(file);
      onParsed(parseRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse spreadsheet file. Please check file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-center animate-fadeIn">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6">
        <span>Catalog Normalization & Error Cleaner</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6 font-display">
        Turn your messy product spreadsheet into an{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500">
          upload-ready catalog.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-normal">
        Upload your file, choose the platform, fix the errors, and download.
      </p>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-950/60 border border-red-800/80 rounded-2xl text-red-200 text-sm flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">File Error</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`max-w-2xl mx-auto p-8 md:p-12 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 relative group bg-gray-900/50 backdrop-blur-sm ${
          isDragging
            ? 'border-orange-500 bg-orange-500/10 scale-[1.02]'
            : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform duration-300">
          {isLoading ? (
            <Loader2 className="w-10 h-10 animate-spin" />
          ) : (
            <Upload className="w-10 h-10" />
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2 font-display">
          {isLoading ? 'Parsing catalog spreadsheet...' : 'Drop your product spreadsheet here'}
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          or click anywhere to browse from your computer
        </p>

        <button
          type="button"
          disabled={isLoading}
          className="px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-600/25 transition-all duration-200 inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Upload Product File</span>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <FileType className="w-4 h-4 text-orange-400" />
            <span>Supported: CSV, XLSX, XLS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Large Catalogs Supported</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>100% Client-Side Privacy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
