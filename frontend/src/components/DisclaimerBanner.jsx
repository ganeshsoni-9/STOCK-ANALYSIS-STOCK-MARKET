import React from 'react';
import { AlertTriangle, Info, Radio } from 'lucide-react';

export default function DisclaimerBanner({ isDemoMode = false }) {
  return (
    <div className="w-full space-y-2 mb-4">
      {!isDemoMode ? (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide">
              🟢 100% FREE REAL LIVE NSE MARKET DATA
            </span>
            <span className="hidden md:inline text-emerald-400/80">
              (Live feed connected with 0 broker fees & zero API cost)
            </span>
          </div>
          <span className="bg-emerald-900/60 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold">
            Free Live Feed Active
          </span>
        </div>
      ) : (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold tracking-wide">
              DEMO MARKET DATA — NOT LIVE MARKET DATA
            </span>
          </div>
          <span className="bg-amber-900/60 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
            Mock Mode
          </span>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
<span className="font-semibold text-slate-200">Legal Disclaimer:</span>{" "}
TradeSense AI identifies potentially favorable market setups using real-time
market data, technical analysis, and AI-powered insights. While our analysis
can help users spot promising opportunities, market conditions are
unpredictable and profits are never guaranteed. Always perform your own
research and manage risk before making any trading decision.
        </div>
      </div>
    </div>
  );
}
