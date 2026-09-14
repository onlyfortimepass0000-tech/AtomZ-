import React from 'react';
import { PlatformDestination } from '../types/surgeon';
import { ShoppingBag, Share2, Search, FileCode, HelpCircle } from 'lucide-react';

interface StageDestinationProps {
  onSelect: (dest: PlatformDestination) => void;
}

export const StageDestination: React.FC<StageDestinationProps> = ({ onSelect }) => {
  const cards = [
    {
      id: 'SHOPIFY' as PlatformDestination,
      title: 'Shopify',
      desc: 'Fix Handles, Variant SKUs, Prices, Option Columns, and Images.',
      icon: ShoppingBag,
      color: 'hover:border-emerald-500 hover:shadow-emerald-500/10 text-emerald-400',
    },
    {
      id: 'META' as PlatformDestination,
      title: 'Meta Catalog',
      desc: 'Fix Product IDs, Availability, Conditions, and Image Links.',
      icon: Share2,
      color: 'hover:border-sky-500 hover:shadow-sky-500/10 text-sky-400',
    },
    {
      id: 'GOOGLE' as PlatformDestination,
      title: 'Google Merchant',
      desc: 'Fix GTINs, Product Categories, HTTPS URLs, and required fields.',
      icon: Search,
      color: 'hover:border-amber-500 hover:shadow-amber-500/10 text-amber-400',
    },
    {
      id: 'GENERIC' as PlatformDestination,
      title: 'Generic CSV',
      desc: 'Standard currency, whitespace, encoding, and duplicate cleaning.',
      icon: FileCode,
      color: 'hover:border-purple-500 hover:shadow-purple-500/10 text-purple-400',
    },
    {
      id: 'NOT_SURE' as PlatformDestination,
      title: 'Not sure',
      desc: 'General spreadsheet validation, header alias mapping, and formatting.',
      icon: HelpCircle,
      color: 'hover:border-slate-500 text-slate-400',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 text-center animate-in fade-in duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
          Where are you trying to upload this?
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Select your target platform so we can apply exact validation rules and headers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onSelect(card.id)}
              className={`p-6 bg-slate-900 border border-slate-800 rounded-3xl transition-all duration-200 group hover:shadow-2xl text-left flex flex-col justify-between space-y-4 ${card.color}`}
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {card.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white">
                <span>Select Target</span>
                <span>&rarr;</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
