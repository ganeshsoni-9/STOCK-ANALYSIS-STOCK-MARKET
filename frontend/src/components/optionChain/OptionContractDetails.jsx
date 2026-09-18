import React from 'react';
import { X, ShieldCheck, Zap, Info } from 'lucide-react';

export default function OptionContractDetails({ contract, strike, type, expiry, isOpen, onClose }) {
  if (!isOpen || !contract) return null;

  const isCall = type === 'CE';
  const isPositive = (contract.changePercent ?? 0) >= 0;

  const greeks = contract.greeks || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${isCall ? 'bg-rose-950 text-rose-400 border border-rose-500/30' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'}`}>
                {type}
              </span>
              <h3 className="text-lg font-black text-white">{contract.symbol || `Strike ${strike} ${type}`}</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Expiry: {expiry || 'N/A'} | Strike: ₹{strike}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price & Change Banner */}
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Option LTP</div>
            <div className="text-2xl font-black text-white">
              {contract.ltp != null ? `₹${contract.ltp.toFixed(2)}` : 'N/A'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Change</div>
            <div className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{contract.change != null ? contract.change.toFixed(2) : '0.00'} ({isPositive ? '+' : ''}{contract.changePercent != null ? contract.changePercent.toFixed(2) : '0.00'}%)
            </div>
          </div>
        </div>

        {/* Market Depth & Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Bid / Ask</span>
            <span className="font-bold text-slate-200">
              ₹{contract.bid != null ? contract.bid.toFixed(2) : 'N/A'} / ₹{contract.ask != null ? contract.ask.toFixed(2) : 'N/A'}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Implied Volatility (IV)</span>
            <span className="font-bold text-sky-400">
              {contract.iv != null ? `${contract.iv}%` : 'N/A'}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Traded Volume</span>
            <span className="font-bold text-slate-200">
              {contract.volume != null ? contract.volume.toLocaleString('en-IN') : 'N/A'}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Open Interest (OI)</span>
            <span className="font-bold text-slate-200">
              {contract.oi != null ? contract.oi.toLocaleString('en-IN') : 'N/A'}
            </span>
          </div>
        </div>

        {/* Black-Scholes Greeks Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Option Greeks</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              {contract.greeksSource || 'Calculated (Black-Scholes)'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-800/60 p-2 rounded">
              <div className="text-[10px] text-slate-400">Delta (Δ)</div>
              <div className="font-bold text-sky-400">{greeks.delta ?? 'N/A'}</div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded">
              <div className="text-[10px] text-slate-400">Gamma (Γ)</div>
              <div className="font-bold text-purple-400">{greeks.gamma ?? 'N/A'}</div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded">
              <div className="text-[10px] text-slate-400">Theta (Θ/day)</div>
              <div className="font-bold text-rose-400">{greeks.theta ?? 'N/A'}</div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded">
              <div className="text-[10px] text-slate-400">Vega (ν)</div>
              <div className="font-bold text-amber-400">{greeks.vega ?? 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Contract Identifiers */}
        <div className="text-[10px] text-slate-500 space-y-1 bg-slate-950 p-2.5 rounded border border-slate-900">
          <div>Instrument Token: <span className="text-slate-400">{contract.instrumentToken || 'N/A'}</span></div>
          <div>Exchange: <span className="text-slate-400">NSE F&O</span></div>
        </div>
      </div>
    </div>
  );
}
