import React from 'react';
import { ShieldCheck, ArrowLeft, Wrench } from 'lucide-react';
import { HelpAssistant } from './HelpAssistant';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="../../tools.html"
            className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors border border-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tools</span>
          </a>
          <div className="h-4 w-[1px] bg-gray-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500 font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Catalog<span className="text-orange-500">Fix</span>
              </h1>
              <p className="text-[10px] text-gray-400 hidden sm:block">ATOMZ Growth Tools</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">100% Client-Side Privacy</span>
          </div>

          <HelpAssistant />
        </div>
      </div>
    </header>
  );
};
