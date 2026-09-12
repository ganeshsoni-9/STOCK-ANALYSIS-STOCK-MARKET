import React from 'react';
import { Layers, TrendingUp, TrendingDown } from 'lucide-react';

export default function SectorHeatmap({ sectors = [] }) {
  if (!sectors || sectors.length === 0) return null;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
            SECTOR PERFORMANCE & STRENGTH
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Sorted: Strongest → Weakest</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {sectors.map((sec) => {
          const isBullish = sec.changePercent >= 0;
          const bg = isBullish ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-rose-950/20 border-rose-500/20';
          const text = isBullish ? 'text-emerald-400' : 'text-rose-400';

          return (
            <div key={sec.name} className={`p-3 rounded-lg border ${bg} transition hover:border-slate-600`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-xs text-slate-200 truncate max-w-[120px]">
                  {sec.name}
                </span>
                <span className={`text-xs font-bold font-mono ${text}`}>
                  {isBullish ? '+' : ''}{sec.changePercent}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>Strength: <strong className="text-white font-mono">{sec.strengthScore}/100</strong></span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isBullish ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                  {sec.trend}
                </span>
              </div>

              {/* Top Stocks */}
              {sec.topStocks && sec.topStocks.length > 0 && (
                <div className="flex gap-1.5 flex-wrap pt-1.5 border-t border-slate-800/60">
                  {sec.topStocks.map((stk) => (
                    <span key={stk.symbol} className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {stk.symbol} ({stk.changePercent >= 0 ? '+' : ''}{stk.changePercent}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
