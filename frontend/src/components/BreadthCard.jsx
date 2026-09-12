import React from 'react';
import { Activity } from 'lucide-react';

export default function BreadthCard({ breadth }) {
  if (!breadth) return null;

  const { advances = 0, declines = 0, unchanged = 0, adRatio = 1.0, breadthLabel = 'Neutral' } = breadth;
  const total = advances + declines + unchanged || 1;

  const advPct = Math.round((advances / total) * 100);
  const decPct = Math.round((declines / total) * 100);
  const uncPct = 100 - advPct - decPct;

  let labelColor = 'text-amber-400 border-amber-500/30 bg-amber-950/40';
  if (breadthLabel === 'Bullish') labelColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40';
  if (breadthLabel === 'Bearish') labelColor = 'text-rose-400 border-rose-500/30 bg-rose-950/40';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">MARKET BREADTH</span>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${labelColor}`}>
          Breadth: {breadthLabel}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-2">
          <div className="text-xs text-emerald-400/80 font-medium">ADVANCES</div>
          <div className="text-lg font-bold font-mono text-emerald-400">{advances}</div>
        </div>
        <div className="bg-rose-950/20 border border-rose-500/20 rounded p-2">
          <div className="text-xs text-rose-400/80 font-medium">DECLINES</div>
          <div className="text-lg font-bold font-mono text-rose-400">{declines}</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded p-2">
          <div className="text-xs text-slate-400 font-medium">UNCHANGED</div>
          <div className="text-lg font-bold font-mono text-slate-300">{unchanged}</div>
        </div>
      </div>

      {/* Visual ratio bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-800 h-2.5 rounded-full flex overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${advPct}%` }} />
          <div className="bg-slate-600 h-full transition-all duration-500" style={{ width: `${uncPct}%` }} />
          <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${decPct}%` }} />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span>A/D Ratio: <strong className="text-white">{adRatio}</strong></span>
          <span>{advPct}% Adv vs {decPct}% Dec</span>
        </div>
      </div>
    </div>
  );
}
