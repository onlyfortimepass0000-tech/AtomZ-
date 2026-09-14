import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1 z-20">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
        aria-label="More information"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isVisible && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2.5 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 pointer-events-none transition-all z-50">
          <div className="leading-relaxed">{content}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
};
