import React from 'react';
import { Radio, RefreshCw, Database } from 'lucide-react';

export default function OptionChainHeader({
  symbol,
  underlying = {},
  status = 'LIVE',
  source = 'NSE_LIVE',
  lastUpdated,
  onRefresh
}) {
  const ltp = underlying?.ltp ?? 0;
  const change = underlying?.change ?? 0;
  const changePercent = underlying?.changePercent ?? 0;
  const isPositive = changePercent >= 0;

  const getStatusBadge = () => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE ●
          </span>
        );
      case 'DELAYED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-amber-400" />
            DELAYED
          </span>
        );
      case 'MOCK':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-purple-400" />
            MOCK DATA
          </span>
        );
      case 'MARKET CLOSED':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            MARKET CLOSED
          </span>
        );
    }
  };

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' IST'
    : '—';

  return (
    <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-emerald-500">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black font-mono text-white tracking-tight">{symbol} OPTION CHAIN</h2>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            NSE Stock Option Contracts & Real-Time Open Interest Analytics
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        {/* Underlying Price Box */}
        <div className="text-right">
          <div className="text-xs text-slate-400 font-mono uppercase">Underlying Price</div>
          <div className="text-lg font-black font-mono text-white">
            ₹{ltp ? ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
          </div>
          <div className={`text-xs font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{change} ({isPositive ? '+' : ''}{changePercent}%)
          </div>
        </div>

        {/* Source & Timestamp Info */}
        <div className="text-right border-l border-slate-800 pl-4 text-xs font-mono">
          <div className="text-slate-400">
            Source: <strong className="text-slate-200">{source}</strong>
          </div>
          <div className="text-slate-400 mt-0.5">
            Updated: <strong className="text-slate-300">{formattedTime}</strong>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Refresh Option Chain"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
