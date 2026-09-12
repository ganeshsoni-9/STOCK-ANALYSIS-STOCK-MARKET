import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MarketIndicesHeader({ indices = [] }) {
  if (!indices || indices.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {indices.map((idx) => {
        const isPositive = idx.changePercent >= 0;
        const isVix = idx.symbol === 'INDIA VIX';
        
        let textColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
        let bgColor = isPositive ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-rose-950/30 border-rose-500/20';

        // VIX down is generally good for market sentiment
        if (isVix) {
          textColor = idx.changePercent <= 0 ? 'text-emerald-400' : 'text-amber-400';
        }

        return (
          <div key={idx.symbol} className={`glass-card p-3 border ${bgColor} glass-card-hover`}>
            <div className="flex justify-between items-start text-xs mb-1">
              <span className="font-bold text-slate-200 tracking-wide">{idx.symbol}</span>
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>

            <div className="text-lg font-bold font-mono text-white tracking-tight">
              ₹{idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            <div className={`text-xs font-semibold font-mono flex items-center justify-between mt-0.5 ${textColor}`}>
              <span>{isPositive ? '+' : ''}{idx.change}</span>
              <span>({isPositive ? '+' : ''}{idx.changePercent}%)</span>
            </div>

            <div className="text-[10px] text-slate-400 flex justify-between mt-2 pt-1.5 border-t border-slate-800/80">
              <span>H: {idx.high}</span>
              <span>L: {idx.low}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
