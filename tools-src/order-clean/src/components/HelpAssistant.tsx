import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Check } from 'lucide-react';

interface HelpAssistantProps {
  toolName: string;
}

export const HelpAssistant: React.FC<HelpAssistantProps> = ({ toolName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getHelpContent = () => {
    switch (toolName) {
      case 'OrderClean':
        return {
          title: 'Turn a messy order sheet into a clean one.',
          steps: [
            '1. Upload orders CSV or XLSX file.',
            '2. Review anything we cannot fix automatically.',
            '3. Download the cleaned file.'
          ]
        };
      case 'StockSync':
        return {
          title: 'Reconcile your stock in seconds.',
          steps: [
            '1. Upload inventory.',
            '2. Add sales/returns or physical stock.',
            '3. Download corrected quantities.'
          ]
        };
      case 'ImagePack':
        return {
          title: 'Prepare all your product images at once.',
          steps: [
            '1. Add images.',
            '2. Choose naming and image settings.',
            '3. Download your ZIP.'
          ]
        };
      case 'PriceBatch':
        return {
          title: 'Update hundreds of prices together.',
          steps: [
            '1. Upload your catalog.',
            '2. Choose your pricing rule.',
            '3. Review and download.'
          ]
        };
      case 'PickPack':
        return {
          title: 'Turn orders into a warehouse-ready list.',
          steps: [
            '1. Upload orders.',
            '2. We combine everything you need to pick.',
            '3. Print your picking list and packing slips.'
          ]
        };
      default:
        return {
          title: 'How to use this tool',
          steps: ['Upload file', 'Process & review', 'Export result']
        };
    }
  };

  const content = getHelpContent();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#151518] hover:bg-[#24242A] border border-[#24242A] text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
        aria-label="How to use"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#FF5722]" />
        <span>How to use</span>
      </button>

      {isOpen && (
        <div
          ref={cardRef}
          className="absolute right-0 mt-2 w-80 sm:w-88 p-4 rounded-2xl bg-[#151518] border border-[#24242A] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#24242A]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FF5722]/10 text-[#FF5722] flex items-center justify-center text-xs font-bold">
                ?
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {toolName} Guide
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#24242A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs font-semibold text-gray-200 my-3 leading-relaxed">
            “{content.title}”
          </p>

          <ul className="space-y-2 mb-4">
            {content.steps.map((step, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722] mt-1.5 shrink-0"></span>
                <span>{step}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2 rounded-xl bg-[#FF5722] hover:bg-[#ff6937] text-white font-bold text-xs shadow-md shadow-[#FF5722]/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Got it</span>
          </button>
        </div>
      )}
    </div>
  );
};
