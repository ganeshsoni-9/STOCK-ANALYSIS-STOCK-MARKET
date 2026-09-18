import React from 'react';
import { Target, TrendingUp, BarChart3, Activity, Zap } from 'lucide-react';

export default function OptionChainSummary({ summary = {} }) {
  const {
    underlyingLtp,
    atmStrike,
    selectedExpiry,
    totalCallOI = 0,
    totalPutOI = 0,
    pcr = 'N/A',
    maxCallOIStrike,
    maxPutOIStrike,
    maxPain
  } = summary;

  const pcrValue = typeof pcr === 'number' ? pcr : parseFloat(pcr);
  let pcrBadgeClass = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
  if (!isNaN(pcrValue)) {
    if (pcrValue > 1.2) pcrBadgeClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    else if (pcrValue < 0.8) pcrBadgeClass = 'text-rose-400 bg-rose-950/40 border-rose-500/30';
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-xs">
      {/* 1. Underlying Price */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3 h-3 text-sky-400" /> Underlying
        </div>
        <div className="text-base font-black text-white mt-1">
          ₹{underlyingLtp ? underlyingLtp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
        </div>
      </div>

      {/* 2. ATM Strike */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Target className="w-3 h-3 text-amber-400" /> ATM Strike
        </div>
        <div className="text-base font-black text-amber-400 mt-1">
          ₹{atmStrike ? atmStrike.toLocaleString('en-IN') : '—'}
        </div>
      </div>

      {/* 3. Put / Call Ratio (PCR) */}
      <div className={`p-3 rounded-xl border flex flex-col justify-between ${pcrBadgeClass}`}>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> PCR (OI Ratio)
        </div>
        <div className="text-base font-black mt-1">
          {pcr !== 'N/A' ? pcr : 'N/A'}
        </div>
        <div className="text-[9px] text-slate-400 font-sans">Put OI / Call OI</div>
      </div>

      {/* 4. Total Call OI */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
        <div className="text-[10px] text-rose-400 uppercase tracking-wider flex items-center gap-1">
          <BarChart3 className="w-3 h-3 text-rose-400" /> Call OI (Resistance)
        </div>
        <div className="text-sm font-bold text-rose-300 mt-1">
          {totalCallOI ? totalCallOI.toLocaleString('en-IN') : 0}
        </div>
        <div className="text-[9px] text-slate-500">Max at ₹{maxCallOIStrike || '—'}</div>
      </div>

      {/* 5. Total Put OI */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
        <div className="text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
          <BarChart3 className="w-3 h-3 text-emerald-400" /> Put OI (Support)
        </div>
        <div className="text-sm font-bold text-emerald-300 mt-1">
          {totalPutOI ? totalPutOI.toLocaleString('en-IN') : 0}
        </div>
        <div className="text-[9px] text-slate-500">Max at ₹{maxPutOIStrike || '—'}</div>
      </div>

      {/* 6. Max Pain */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
        <div className="text-[10px] text-purple-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-purple-400" /> Max Pain
        </div>
        <div className="text-base font-black text-purple-300 mt-1">
          ₹{maxPain ? maxPain.toLocaleString('en-IN') : '—'}
        </div>
        <div className="text-[9px] text-slate-500 font-sans truncate">Calculated from OI</div>
      </div>

      {/* 7. Active Expiry */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Expiry</div>
        <div className="text-xs font-bold text-slate-200 mt-1 truncate">
          {selectedExpiry || '—'}
        </div>
        <div className="text-[9px] text-slate-500">NSE Contract</div>
      </div>
    </div>
  );
}
