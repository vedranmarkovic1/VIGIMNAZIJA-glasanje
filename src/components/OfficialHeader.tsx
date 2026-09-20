import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const OfficialHeader: React.FC = () => {
  return (
    <header className="bg-[#081729] text-slate-300 border-b border-blue-950 no-print text-[11px] select-none">
      {/* Serbian Flag tricolor top ribbon */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#c6363c]" />
        <div className="w-1/3 bg-[#0c4076]" />
        <div className="w-1/3 bg-[#f8fafc]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-white font-semibold">ŠESTA BEOGRADSKA GIMNAZIJA</span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-blue-300 font-medium hidden md:inline">UČENIČKI PARLAMENT</span>
        </div>

        <div className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>PORTAL ELEKTRONSKOG GLASANJA</span>
        </div>
      </div>
    </header>
  );
};
