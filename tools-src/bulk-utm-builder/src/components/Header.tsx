import React from 'react';
import { HelpAssistant } from './HelpAssistant';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-[#24242A] bg-[#0E0E10]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="../../tools.html" className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
            <span className="w-8 h-8 rounded-lg bg-[#FF5722] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#FF5722]/30">
              A
            </span>
            <span>ATOM<span className="text-[#FF5722]">Z</span></span>
          </a>
          <div className="h-4 w-px bg-[#24242A]"></div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Bulk UTM Builder</h1>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">Campaign Tracking URL Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] text-[11px] font-mono font-medium">
            🔒 100% Client-Side
          </span>
          <HelpAssistant />
        </div>
      </div>
    </header>
  );
};
