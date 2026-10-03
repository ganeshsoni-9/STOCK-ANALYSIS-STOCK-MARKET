import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function MarketIndicesHeader({ indices = [], onSelectIndex }) {
  const navigate = useNavigate();

  if (!indices || indices.length === 0) return null;

  const handleClick = (symbol) => {
    if (onSelectIndex) {
      onSelectIndex(symbol);
    } else {
      navigate(`/trade-plan/${encodeURIComponent(symbol)}`);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {indices.map((idx) => {
        const isPositive = idx.changePercent >= 0;
        const isVix = idx.symbol === 'INDIA VIX';
        const isSupportedPlan = idx.symbol === 'NIFTY 50' || idx.symbol === 'BANK NIFTY' || idx.symbol === 'FINNIFTY';
        
        let textColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
        let bgColor = isPositive ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-rose-950/30 border-rose-500/20';

        // VIX down is generally good for market sentiment
        if (isVix) {
          textColor = idx.changePercent <= 0 ? 'text-emerald-400' : 'text-amber-400';
        }

        return (
          <div
            key={idx.symbol}
            onClick={() => handleClick(idx.symbol)}
            className={`glass-card p-3 border ${bgColor} glass-card-hover cursor-pointer relative group transition-all duration-200 hover:scale-[1.02] hover:border-emerald-500/40`}
            title={`Click to view Live Intraday Trade Plan for ${idx.symbol}`}
          >
            <div className="flex justify-between items-start text-xs mb-1">
              <span className="font-bold text-slate-200 tracking-wide flex items-center gap-1">
                {idx.symbol}
                {isSupportedPlan && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1 rounded border border-emerald-500/30">
                    PLAN
                  </span>
                )}
              </span>
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>

            <div className="text-lg font-bold font-mono text-white tracking-tight">
              ₹{idx.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
            </div>

            <div className={`text-xs font-semibold font-mono flex items-center justify-between mt-0.5 ${textColor}`}>
              <span>{isPositive ? '+' : ''}{idx.change}</span>
              <span>({isPositive ? '+' : ''}{idx.changePercent}%)</span>
            </div>

            <div className="text-[10px] text-slate-400 flex justify-between items-center mt-2 pt-1.5 border-t border-slate-800/80">
              <span>H: {idx.high}</span>
              <span className="text-emerald-400 opacity-0 group-hover:opacity-100 transition font-mono flex items-center gap-0.5">
                <Target className="w-3 h-3" /> Plan
              </span>
              <span>L: {idx.low}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

