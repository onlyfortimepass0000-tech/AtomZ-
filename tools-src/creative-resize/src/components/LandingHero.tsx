import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, FileType, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
  onFileSelect: (file: File) => void;
  error: string | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onFileSelect, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-6">
        <span>Instant Multi-Format Resize Engine</span>
      </div>

      <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
        Resize one creative for <br className="hidden sm:block" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-blue-500">
          every platform in seconds.
        </span>
      </h1>

      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-normal">
        Upload once. Adjust once. Export every size for Instagram, Facebook, LinkedIn, YouTube, X, WhatsApp & Google Ads in one ZIP.
      </p>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-sm flex items-start gap-3 text-left animate-shake">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Unsupported File or Error</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Drag and Drop Box */}
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
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform duration-300">
          <Upload className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          Drop your creative image here
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          or click anywhere to browse from your computer
        </p>

        <button
          type="button"
          className="px-8 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-lg shadow-orange-600/25 transition-all duration-200 inline-flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Upload Creative</span>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <FileType className="w-4 h-4 text-orange-400" />
            <span>Formats: PNG, JPG, WebP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No File Size Limit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Processed 100% in Browser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
