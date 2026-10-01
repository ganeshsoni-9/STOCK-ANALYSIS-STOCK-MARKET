import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, Radio } from 'lucide-react';

function getIndianMarketStatus() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);

  const timeInMinutes = hour * 60 + minute;

  const marketOpen = 9 * 60 + 15;   // 09:15 AM
  const marketClose = 15 * 60 + 30; // 03:30 PM

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  const isMarketOpen =
    !isWeekend &&
    timeInMinutes >= marketOpen &&
    timeInMinutes <= marketClose;

  if (isMarketOpen) {
    return {
      isMarketOpen: true,
      status: 'LIVE MARKET'
    };
  }

  return {
    isMarketOpen: false,
    status: isWeekend ? 'MARKET NOT OPEN' : 'MARKET NOT OPEN'
  };
}

export default function DisclaimerBanner({ isDemoMode = false }) {
  const [marketStatus, setMarketStatus] = useState(getIndianMarketStatus());

  useEffect(() => {
    const updateStatus = () => {
      setMarketStatus(getIndianMarketStatus());
    };

    updateStatus();

    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-2 mb-4">

      {/* MARKET STATUS */}
      {marketStatus.isMarketOpen ? (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2.5 text-xs text-emerald-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />

            <span className="font-semibold tracking-wide">
              🟢 LIVE MARKET
            </span>

            <span className="hidden md:inline text-emerald-400/80">
              Indian equity market is currently open
            </span>
          </div>

          <span className="bg-emerald-900/60 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold">
            MARKET OPEN
          </span>
        </div>
      ) : (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />

            <span className="font-semibold tracking-wide">
              🔴 MARKET NOT OPEN
            </span>

            <span className="hidden md:inline text-rose-400/80">
              Indian equity market is currently closed
            </span>
          </div>

          <span className="bg-rose-900/60 text-rose-300 text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold">
            MARKET CLOSED
          </span>
        </div>
      )}

      {/* DEMO MODE WARNING */}
      {isDemoMode && (
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

      {/* LEGAL DISCLAIMER */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />

        <div>
          <span className="font-semibold text-slate-200">
            Legal Disclaimer:
          </span>{' '}
          TradeSense AI provides market data and technical-analysis tools for
          educational and research purposes. Market conditions are
          unpredictable, and no analysis guarantees profits. Always perform
          your own research and manage risk before making any trading decision.
        </div>
      </div>

    </div>
  );
}