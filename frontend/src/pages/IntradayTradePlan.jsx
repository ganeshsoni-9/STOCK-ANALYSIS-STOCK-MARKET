import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Target,
  ArrowRight,
  Activity,
  Zap,
  BarChart3,
  Layers,
  Award,
  Info
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import StockChart from '../components/StockChart';
import { marketApi, stockApi } from '../services/api';
import { io } from 'socket.io-client';

export default function IntradayTradePlan({ socketData }) {
  const { symbol: rawSymbol } = useParams();
  const navigate = useNavigate();

  const currentSymbol = (rawSymbol || 'NIFTY 50').toUpperCase() === 'BANKNIFTY' ? 'BANK NIFTY' : (rawSymbol || 'NIFTY 50').toUpperCase();

  const [tradePlan, setTradePlan] = useState(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [socketConnected, setSocketConnected] = useState(false);

  // Fetch Trade Plan data
  const loadTradePlan = async (sym) => {
    try {
      setLoading(true);
      setError(null);
      const res = await marketApi.getTradePlan(sym);
      if (res.success) {
        setTradePlan(res.data);
      } else {
        setError(res.message || 'Failed to fetch trade plan');
      }

      // Fetch historical candles for chart
      const candleRes = await stockApi.getCandles(sym, timeframe, 120).catch(() => ({ success: false, data: [] }));
      if (candleRes.success && Array.isArray(candleRes.data)) {
        setCandles(candleRes.data);
      }
    } catch (err) {
      console.error('Error loading trade plan:', err);
      setError(err.message || 'Error connecting to market data engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTradePlan(currentSymbol);
  }, [currentSymbol, timeframe]);

  // Socket.IO real-time stream subscription for live trade plan updates
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('subscribeTradePlan', { symbol: currentSymbol });
    });

    socket.on('tradePlan:update', (data) => {
      if (data && (data.symbol === currentSymbol || (data.symbol === 'NIFTY 50' && currentSymbol.includes('NIFTY')))) {
        setTradePlan(data);
      }
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    return () => {
      socket.emit('unsubscribeTradePlan', { symbol: currentSymbol });
      socket.disconnect();
    };
  }, [currentSymbol]);

  const handleSymbolSwitch = (newSym) => {
    navigate(`/trade-plan/${encodeURIComponent(newSym)}`);
  };

  if (loading && !tradePlan) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-sm text-slate-400">Loading Live Intraday Trade Plan for {currentSymbol}...</p>
      </div>
    );
  }

  const isMock = tradePlan?.dataSource === 'mock';
  const setup = tradePlan?.setup || {};
  const structure = tradePlan?.structure || {};
  const zones = tradePlan?.zones || { supply: [], demand: [] };
  const tradeMgmt = tradePlan?.tradeManagement || {};
  const exitPlan = tradePlan?.exitPlan || {};
  const isMarketClosed = tradePlan?.marketStatus?.includes('CLOSED') || tradePlan?.setup?.status === 'MARKET_CLOSED';

  // Bias Color Helpers
  const getBiasBadge = (bias) => {
    if (bias === 'BULLISH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
          <TrendingUp className="w-4 h-4" /> BULLISH BIAS
        </span>
      );
    }
    if (bias === 'BEARISH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
          <TrendingDown className="w-4 h-4" /> BEARISH BIAS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
        <Activity className="w-4 h-4" /> NEUTRAL / CHOPPY
      </span>
    );
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ENTRY_CONDITION_MET':
        return <span className="bg-emerald-500 text-black px-3 py-1 rounded font-mono font-extrabold text-xs">🟢 ENTRY CONDITION MET</span>;
      case 'WAITING_FOR_CONFIRMATION':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded font-mono font-bold text-xs">⏳ WAITING FOR CONFIRMATION</span>;
      case 'MARKET_CLOSED':
        return <span className="bg-rose-950 text-rose-400 border border-rose-800 px-3 py-1 rounded font-mono font-bold text-xs">🔴 MARKET CLOSED</span>;
      case 'LIVE_DATA_UNAVAILABLE':
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded font-mono font-bold text-xs">⚠️ LIVE DATA UNAVAILABLE</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded font-mono font-bold text-xs">✋ NO HIGH QUALITY SETUP</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <DisclaimerBanner isDemoMode={isMock} />

      {/* Top Header & Instrument Switcher */}
      <div className="glass-card p-5 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
                {currentSymbol}
              </h1>
              {getBiasBadge(tradePlan?.bias)}
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>Live Rule-Based Intraday Decision Support</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{tradePlan?.marketStatus}</span>
            </p>
          </div>

          {/* Instrument Toggle */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => handleSymbolSwitch('NIFTY 50')}
              className={`px-4 py-2 rounded-md font-mono font-bold text-xs transition ${
                currentSymbol === 'NIFTY 50'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NIFTY 50
            </button>
            <button
              onClick={() => handleSymbolSwitch('BANK NIFTY')}
              className={`px-4 py-2 rounded-md font-mono font-bold text-xs transition ${
                currentSymbol === 'BANK NIFTY'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BANK NIFTY
            </button>
          </div>
        </div>

        {/* Real-time Market Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Current Price</div>
            <div className="text-xl font-bold text-white font-mono">
              ₹{tradePlan?.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Data Status</div>
            <div className={`font-bold flex items-center gap-1.5 ${
              tradePlan?.dataStatus === 'LIVE' ? 'text-emerald-400' : tradePlan?.dataStatus === 'STALE' ? 'text-amber-400' : 'text-rose-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                tradePlan?.dataStatus === 'LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}></span>
              {tradePlan?.dataStatus || 'UNKNOWN'}
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Data Source</div>
            <div className="font-bold text-slate-200 uppercase truncate">
              {tradePlan?.dataSource || 'NSE'}
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Data Age</div>
            <div className="font-bold text-sky-400">
              {tradePlan?.dataAge || 0}s ago
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">VWAP Line</div>
            <div className="font-bold text-purple-400">
              ₹{tradePlan?.vwap?.toLocaleString('en-IN') || '0.00'}
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 mb-1">Setup Quality</div>
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{setup.qualityScore || 0} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Layout: Entry Plan & Checklist (Left) vs Risk & Targets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Entry Plan & Checklist (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Setup Status Banner */}
          <div className="glass-card p-5 border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Live Intraday Entry Plan
                </h2>
              </div>
              <div>
                {getStatusBadge(setup.status)}
              </div>
            </div>

            {/* Waiting Reason or Entry Confirmation Banner */}
            {setup.waitingReason && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 text-xs font-mono text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">STATUS DETAIL: </span>
                  {setup.waitingReason}
                </div>
              </div>
            )}

            {/* Entry Checklist */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
                ENTRY CONFIRMATION CHECKLIST
              </h3>

              {setup.checklist && setup.checklist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {setup.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 transition ${
                        item.met
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {item.met ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-200">{item.title}</div>
                        <div className="text-[11px] opacity-80">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-lg text-xs text-slate-500 font-mono">
                  No active entry checklist for current market status.
                </div>
              )}
            </div>

            {/* Dynamic Entry Zone & Trigger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-xs mb-1">ENTRY ZONE / RANGE</div>
                <div className="text-lg font-bold text-emerald-400">
                  ₹{setup.entry?.low?.toLocaleString('en-IN')} — ₹{setup.entry?.high?.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-xs mb-1">ENTRY TRIGGER</div>
                <div className="text-sm font-bold text-white truncate">
                  {setup.entry?.trigger || 'Wait for BOS / Reversal Candle'}
                </div>
              </div>
            </div>
          </div>

          {/* Market Structure Details */}
          <div className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Multi-Timeframe Market Structure
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {/* 15M Structure */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-400">15M CONTEXT TIMEFRAME</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    structure.timeframe15m?.trend === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {structure.timeframe15m?.trend || 'NEUTRAL'}
                  </span>
                </div>
                <div className="space-y-1 text-slate-300 pt-1 border-t border-slate-800">
                  <div>Swing High: <span className="font-bold text-white">₹{structure.timeframe15m?.lastSwingHigh}</span></div>
                  <div>Swing Low: <span className="font-bold text-white">₹{structure.timeframe15m?.lastSwingLow}</span></div>
                  <div>BOS Status: <span className="font-bold text-emerald-400">{structure.timeframe15m?.bos ? 'CONFIRMED' : 'NO BOS'}</span></div>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">{structure.timeframe15m?.reason}</p>
              </div>

              {/* 5M Structure */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">5M SETUP TIMEFRAME</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    structure.timeframe5m?.trend === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {structure.timeframe5m?.trend || 'NEUTRAL'}
                  </span>
                </div>
                <div className="space-y-1 text-slate-300 pt-1 border-t border-slate-800">
                  <div>Swing High: <span className="font-bold text-white">₹{structure.timeframe5m?.lastSwingHigh}</span></div>
                  <div>Swing Low: <span className="font-bold text-white">₹{structure.timeframe5m?.lastSwingLow}</span></div>
                  <div>BOS Status: <span className="font-bold text-emerald-400">{structure.timeframe5m?.bos ? 'CONFIRMED' : 'WAITING BOS'}</span></div>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">{structure.timeframe5m?.reason}</p>
              </div>
            </div>
          </div>

          {/* Supply & Demand Zones */}
          <div className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                Dynamic Supply & Demand Zones
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              {/* Demand Zones */}
              <div className="space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <span>🟢 DEMAND ZONES</span>
                </div>
                {zones.demand && zones.demand.length > 0 ? (
                  zones.demand.map((z) => (
                    <div key={z.id} className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>₹{z.zoneLow} — ₹{z.zoneHigh}</span>
                        <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 rounded">{z.freshness}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Strength: {z.strength}/100 • Touches: {z.touches}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">{z.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-500">No active demand zone nearby</div>
                )}
              </div>

              {/* Supply Zones */}
              <div className="space-y-2">
                <div className="font-bold text-rose-400 flex items-center gap-1">
                  <span>🔴 SUPPLY ZONES</span>
                </div>
                {zones.supply && zones.supply.length > 0 ? (
                  zones.supply.map((z) => (
                    <div key={z.id} className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-lg space-y-1">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>₹{z.zoneLow} — ₹{z.zoneHigh}</span>
                        <span className="text-rose-400 text-[10px] bg-rose-500/10 px-1.5 rounded">{z.freshness}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Strength: {z.strength}/100 • Touches: {z.touches}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">{z.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-900 rounded border border-slate-800 text-slate-500">No active supply zone nearby</div>
                )}
              </div>
            </div>
          </div>

          {/* WHY THIS SETUP / WHY WAIT */}
          <div className="glass-card p-5 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Info className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                WHY THIS TRADE PLAN? (TRANSPARENT REASONING)
              </h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {setup.whyReasons && setup.whyReasons.length > 0 ? (
                setup.whyReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded border border-slate-800">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Market conditions are currently being evaluated against technical rules.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Risk Plan, Targets & Trade Management */}
        <div className="space-y-6">

          {/* Risk Plan & Structural Stop Loss */}
          <div className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Risk & Stop Loss
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                SL INVALIDATION
              </span>
            </div>

            <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl space-y-2 font-mono">
              <div className="text-xs text-slate-400">STRUCTURAL STOP LOSS</div>
              <div className="text-2xl font-black text-rose-400">
                ₹{setup.stopLoss?.price?.toLocaleString('en-IN') || '0.00'}
              </div>
              <p className="text-xs text-slate-300 italic pt-1 border-t border-rose-500/20">
                <span className="font-bold">Reason: </span>
                {setup.stopLoss?.reason}
              </p>
            </div>
          </div>

          {/* Target Plan (T1, T2, T3) */}
          <div className="glass-card p-5 border border-slate-800 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wide">
                  Target Plan & R:R
                </h2>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                MIN R:R 1.5
              </span>
            </div>

            <div className="space-y-3">
              {/* T1 */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">TARGET 1 (T1)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                    R:R 1:{setup.targets?.t1?.rr || '1.2'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white">
                  ₹{setup.targets?.t1?.price?.toLocaleString('en-IN') || '0.00'}
                </div>
                <p className="text-[11px] text-slate-400 italic">{setup.targets?.t1?.reason}</p>
              </div>

              {/* T2 */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">TARGET 2 (T2)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                    R:R 1:{setup.targets?.t2?.rr || '2.0'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white">
                  ₹{setup.targets?.t2?.price?.toLocaleString('en-IN') || '0.00'}
                </div>
                <p className="text-[11px] text-slate-400 italic">{setup.targets?.t2?.reason}</p>
              </div>

              {/* T3 */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-400">TARGET 3 (T3)</span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                    R:R 1:{setup.targets?.t3?.rr || '3.0'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white">
                  ₹{setup.targets?.t3?.price?.toLocaleString('en-IN') || '0.00'}
                </div>
                <p className="text-[11px] text-slate-400 italic">{setup.targets?.t3?.reason}</p>
              </div>
            </div>
          </div>

          {/* Live Trade Management Panel */}
          <div className="glass-card p-5 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                Live Trade Management
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-slate-400">Current Trade State</div>
                <div className="font-bold text-white text-sm">
                  {tradeMgmt.stateMessage || 'WAITING FOR SETUP'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-slate-300">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">DISTANCE TO SL</div>
                  <div className="font-bold text-rose-400">{tradeMgmt.distanceToStop || 0} pts</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">DISTANCE TO T1</div>
                  <div className="font-bold text-emerald-400">{tradeMgmt.distanceToT1 || 0} pts</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated Exit Plan (6 Explicit Exit Conditions) */}
          <div className="glass-card p-5 border border-slate-800 space-y-3 font-mono">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wide">
                DEDICATED EXIT PLAN
              </h2>
            </div>

            <div className="space-y-2 text-[11px]">
              {Object.keys(exitPlan).map((key, idx) => {
                const cond = exitPlan[key];
                return (
                  <div key={key} className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-0.5">
                    <div className="font-bold text-slate-200 flex justify-between">
                      <span>Condition {idx + 1}: {cond.name}</span>
                      {cond.triggerPrice && <span className="text-amber-400">₹{cond.triggerPrice}</span>}
                    </div>
                    <div className="text-slate-400">{cond.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Dynamic Interactive Chart Section */}
      <div className="glass-card p-5 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              {currentSymbol} Intraday Price Chart & Key Levels
            </h2>
          </div>
        </div>

        {candles && candles.length > 0 ? (
          <StockChart
            series={candles}
            symbol={currentSymbol}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
          />
        ) : (
          <div className="p-8 text-center text-slate-500 font-mono">
            Loading chart candles for {currentSymbol}...
          </div>
        )}
      </div>

    </div>
  );
}
