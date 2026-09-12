import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight, AlertCircle } from 'lucide-react';

export default function StockTable({ stocks = [], title = 'Stock Scanner', subtitle = '' }) {
  const navigate = useNavigate();

  const getSignalBadge = (signal, score) => {
    let style = 'bg-slate-800 text-slate-300 border-slate-700';
    if (signal === 'STRONG BULLISH') style = 'bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950';
    else if (signal === 'BULLISH') style = 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30';
    else if (signal === 'WEAK BULLISH') style = 'bg-emerald-950/40 text-emerald-400 border-emerald-600/20';
    else if (signal === 'STRONG BEARISH') style = 'bg-rose-950 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-950';
    else if (signal === 'BEARISH') style = 'bg-rose-900/60 text-rose-300 border-rose-500/30';
    else if (signal === 'WEAK BEARISH') style = 'bg-rose-950/40 text-rose-400 border-rose-600/20';
    else if (signal === 'NEUTRAL') style = 'bg-amber-950/40 text-amber-400 border-amber-500/30';

    return (
      <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border inline-flex items-center gap-1 ${style}`}>
        {signal} ({score})
      </span>
    );
  };

  if (!stocks || stocks.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-slate-400">
        No stock scanner results available for current parameters.
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <span className="text-xs font-mono text-slate-400">{stocks.length} Instruments Monitored</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider bg-slate-900/50">
              <th className="py-2.5 px-3">Symbol / Company</th>
              <th className="py-2.5 px-3">LTP (₹)</th>
              <th className="py-2.5 px-3">Change %</th>
              <th className="py-2.5 px-3">RVOL</th>
              <th className="py-2.5 px-3">VWAP Dist</th>
              <th className="py-2.5 px-3">RSI</th>
              <th className="py-2.5 px-3">Bull Score</th>
              <th className="py-2.5 px-3">Bear Score</th>
              <th className="py-2.5 px-3">Signal</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {stocks.map((stk) => {
              const isPositive = stk.changePercent >= 0;
              const isAboveVWAP = stk.distanceFromVWAP >= 0;

              return (
                <tr
                  key={stk.symbol}
                  onClick={() => navigate(`/stock/${stk.symbol}`)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      {stk.symbol}
                      {stk.conflicts && stk.conflicts.length > 0 && (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" title={stk.conflicts[0]} />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">
                      {stk.companyName}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-100">
                    ₹{stk.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  <td className={`py-3 px-3 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="flex items-center gap-0.5">
                      {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{stk.changePercent}%
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    <span className={stk.rvol >= 1.5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {stk.rvol}x
                    </span>
                  </td>

                  <td className={`py-3 px-3 ${isAboveVWAP ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAboveVWAP ? '+' : ''}{stk.distanceFromVWAP}%
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    {stk.rsi}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${stk.bullishScore}%` }} />
                      </div>
                      <span className="text-emerald-400 font-semibold text-[11px]">{stk.bullishScore}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full" style={{ width: `${stk.bearishScore}%` }} />
                      </div>
                      <span className="text-rose-400 font-semibold text-[11px]">{stk.bearishScore}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {getSignalBadge(stk.signal, stk.score)}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button className="text-slate-400 group-hover:text-white p-1 rounded hover:bg-slate-700">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
