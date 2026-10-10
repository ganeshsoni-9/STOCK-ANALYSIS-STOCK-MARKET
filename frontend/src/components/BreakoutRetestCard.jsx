import React from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  ShieldCheck,
  Info,
  Radio
} from 'lucide-react';

export default function BreakoutRetestCard({ analysis, symbol }) {
  if (!analysis) return null;

  // Handle Genuine Data Unavailable State
  if (!analysis.isAvailable) {
    return (
      <div className="glass-card p-5 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
            5-Minute High/Low Breakout + Retest Analysis
          </h2>
          <span className="ml-auto bg-amber-950/60 text-amber-400 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
            DATA UNAVAILABLE
          </span>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200 mb-0.5">5-Minute Candles Unavailable</div>
            <div>{analysis.reason || 'Genuine live 5-minute OHLC candle data is currently unavailable for this instrument.'}</div>
          </div>
        </div>
      </div>
    );
  }

  const {
    refHigh,
    refLow,
    refTime,
    refRange,
    refRangePct,
    currentPrice,
    breakoutType,
    breakoutStatus,
    breakoutTime,
    retestStatus,
    setupType,
    setupSignal,
    statusReason,
    entryPrice,
    stopLoss,
    target1,
    target2,
    riskReward,
    source,
    dataTimestamp,
    isMarketOpen,
    checklist = []
  } = analysis;

  const isBullish = setupType === 'BULLISH_BUY';
  const isBearish = setupType === 'BEARISH_SHORT';
  const isConfirmed = isBullish || isBearish;

  return (
    <div className="glass-card p-5 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              5-Minute High/Low Breakout + Retest Analysis
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            First 5M candle boundary breakout with completed candle retest confirmation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isMarketOpen && (
            <span className="bg-rose-950/80 text-rose-300 border border-rose-500/40 text-[10px] font-mono px-2.5 py-1 rounded font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              MARKET CLOSED
            </span>
          )}

          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              isBullish
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950'
                : isBearish
                ? 'bg-rose-950 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-950'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            {isBullish ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : isBearish ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            )}
            {setupSignal}
          </span>
        </div>
      </div>

      {/* 4-Stat Reference Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase mb-0.5">5M Reference High</div>
          <div className="text-base font-bold text-emerald-400">₹{refHigh}</div>
          <div className="text-[10px] text-slate-500">Established at {refTime}</div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase mb-0.5">5M Reference Low</div>
          <div className="text-base font-bold text-rose-400">₹{refLow}</div>
          <div className="text-[10px] text-slate-500">Spread: ₹{refRange} ({refRangePct}%)</div>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase mb-0.5">Breakout Status</div>
          <div
            className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
              breakoutType === 'BULLISH'
                ? 'text-emerald-400'
                : breakoutType === 'BEARISH'
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {breakoutStatus}
          </div>
          {breakoutTime && <div className="text-[10px] text-slate-500 mt-0.5">At {breakoutTime}</div>}
        </div>

        <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
          <div className="text-slate-400 text-[10px] uppercase mb-0.5">Retest Status</div>
          <div
            className={`text-xs font-bold mt-1 inline-flex items-center gap-1 ${
              retestStatus.includes('CONFIRMED')
                ? 'text-emerald-400'
                : retestStatus.includes('WAITING')
                ? 'text-amber-400'
                : retestStatus.includes('FAILED')
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {retestStatus}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {retestStatus.includes('CONFIRMED') ? 'Completed candle confirmed' : 'Requires bounce validation'}
          </div>
        </div>
      </div>

      {/* Trade Execution Panel */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 uppercase tracking-wider font-semibold">
            Actionable Execution Levels
          </span>
          <span className="text-[11px] text-slate-400">
            Current Price: <strong className="text-white">₹{currentPrice?.toFixed(2)}</strong>
          </span>
        </div>

        {isConfirmed ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Confirmed Entry</div>
              <div className="text-base font-black text-sky-400 mt-0.5">₹{entryPrice}</div>
              <div className="text-[10px] text-slate-500">Retest close</div>
            </div>

            <div className="bg-rose-950/40 p-3 rounded-lg border border-rose-500/30">
              <div className="text-[10px] text-rose-400 uppercase">Structural Stop-Loss</div>
              <div className="text-base font-black text-rose-300 mt-0.5">₹{stopLoss}</div>
              <div className="text-[10px] text-rose-400/80">Invalidation level</div>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 uppercase">Target 1 (1:1.5)</div>
              <div className="text-base font-black text-emerald-300 mt-0.5">₹{target1}</div>
              <div className="text-[10px] text-emerald-400/80">First partial exit</div>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 uppercase">Target 2 (1:2.5)</div>
              <div className="text-base font-black text-emerald-300 mt-0.5">₹{target2}</div>
              <div className="text-[10px] text-emerald-400/80">R:R {riskReward}</div>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>NO TRADE:</strong> Entry orders remain locked until completed candle retest confirmation is satisfied.
              </span>
            </div>
            <span className="font-bold text-amber-400 shrink-0 ml-2">AWAITING SETUP</span>
          </div>
        )}

        {/* Detailed Reasoning Banner */}
        {statusReason && (
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <div>{statusReason}</div>
          </div>
        )}
      </div>

      {/* Confirmation Rules Checklist */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
          Explicit Confirmation Rules Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex items-start gap-2 transition ${
                item.met
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400'
              }`}
            >
              {item.met ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold text-slate-200">{item.title}</div>
                <div className="text-[10px] opacity-80">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Source & Timestamp Verification Strip */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" />
            Source: <strong className="text-slate-400">{source}</strong>
          </span>
          <span>•</span>
          <span>
            Evaluated: <strong className="text-slate-400">{dataTimestamp} IST</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Market: <strong className={isMarketOpen ? 'text-emerald-400' : 'text-rose-400'}>{isMarketOpen ? 'ACTIVE' : 'CLOSED'}</strong>
          </span>
          <span>•</span>
          <span>Rule: No Entry Prior to Retest Confirmation</span>
        </div>
      </div>
    </div>
  );
}
