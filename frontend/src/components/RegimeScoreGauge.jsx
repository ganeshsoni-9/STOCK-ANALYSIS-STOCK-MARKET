import React from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function RegimeScoreGauge({ regimeData }) {
  if (!regimeData) return null;

  const score = regimeData.score || 50;
  const regime = regimeData.regime || 'NEUTRAL';
  const confidence = regimeData.confidence || 'Moderate';

  let colorClass = 'text-amber-400';
  let barGradient = 'from-amber-500 to-amber-400';
  let Icon = Minus;

  if (score >= 70) {
    colorClass = 'text-emerald-400';
    barGradient = 'from-emerald-600 to-emerald-400';
    Icon = TrendingUp;
  } else if (score >= 55) {
    colorClass = 'text-emerald-300';
    barGradient = 'from-emerald-700 to-emerald-500';
    Icon = TrendingUp;
  } else if (score <= 30) {
    colorClass = 'text-rose-500';
    barGradient = 'from-rose-700 to-rose-500';
    Icon = TrendingDown;
  } else if (score <= 45) {
    colorClass = 'text-rose-400';
    barGradient = 'from-rose-600 to-rose-400';
    Icon = TrendingDown;
  }

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            INTRADAY MARKET REGIME
          </div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl md:text-3xl font-extrabold ${colorClass} tracking-tight flex items-center gap-2`}>
              <Icon className="w-7 h-7" />
              {regime}
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              Confidence: <strong className="text-white">{confidence}</strong>
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight">
            {score}<span className="text-slate-500 text-lg font-normal">/100</span>
          </div>
          <div className="text-xs text-slate-400">Market Strength Score</div>
        </div>
      </div>

      {/* Progress Gauge Bar */}
      <div className="space-y-1.5">
        <div className="relative w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/60">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out`}
            style={{ width: `${Math.max(5, Math.min(100, score))}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-0.5">
          <span className="text-rose-400 font-semibold">0 (BEARISH)</span>
          <span className="text-amber-400 font-semibold">50 (NEUTRAL)</span>
          <span className="text-emerald-400 font-semibold">100 (BULLISH)</span>
        </div>
      </div>

      {/* Key Factors Summary */}
      {regimeData.reasons && regimeData.reasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1.5 font-medium">
            Supporting Market Factors:
          </div>
          <div className="flex flex-wrap gap-2">
            {regimeData.reasons.map((reason, idx) => (
              <span key={idx} className="bg-slate-800/90 text-slate-200 px-2.5 py-1 rounded text-xs border border-slate-700/50">
                ✓ {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
