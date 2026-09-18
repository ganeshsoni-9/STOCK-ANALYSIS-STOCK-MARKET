import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DisclaimerBanner from '../components/DisclaimerBanner';
import StockChart from '../components/StockChart';
import OptionChain from '../components/optionChain/OptionChain';
import { stockApi, watchlistApi } from '../services/api';
import { ArrowLeft, Bookmark, AlertTriangle, ShieldCheck, Zap, Info, Layers } from 'lucide-react';

export default function StockDetails() {
  const { symbol } = useParams();
  const [details, setDetails] = useState(null);
  const [timeframe, setTimeframe] = useState('5m');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chart' | 'technicals' | 'option-chain'
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistMsg, setWatchlistMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    stockApi
      .getDetails(symbol, timeframe)
      .then((res) => {
        if (res.success) setDetails(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [symbol, timeframe]);

  useEffect(() => {
    const checkWatchlist = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token && token !== 'null' && token !== 'undefined') {
          const res = await watchlistApi.get();
          if (res && Array.isArray(res.items)) {
            const isListed = res.items.some((item) => item.symbol === symbol);
            setInWatchlist(isListed);
          }
        }
      } catch (err) {
        // Silently ignore if unauthenticated
      }
    };
    checkWatchlist();
  }, [symbol]);

  const handleToggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await watchlistApi.remove(symbol);
        setInWatchlist(false);
        setWatchlistMsg('Removed from Watchlist');
      } else {
        await watchlistApi.add(symbol);
        setInWatchlist(true);
        setWatchlistMsg('Added to Watchlist');
      }
      setTimeout(() => setWatchlistMsg(''), 3000);
    } catch (e) {
      console.error(e);
      const msg = e.message?.replace(/^API Error:\s*/, '') || 'Failed to update Watchlist';
      setWatchlistMsg(msg);
      setTimeout(() => setWatchlistMsg(''), 4000);
    }
  };

  if (loading || !details) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono">
        Analyzing technical metrics for {symbol}...
      </div>
    );
  }

  const { stock, analysis, signalData, openingRange } = details;
  const latest = analysis?.latest || {};
  const isPositive = stock.changePercent >= 0;

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={false} />

      {/* Header & Symbol Info */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/scanner" className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black font-mono text-white tracking-tight">{stock.symbol}</h1>
              <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                NSE Liquid
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">{stock.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">
              ₹{stock.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className={`text-xs font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{stock.change} ({isPositive ? '+' : ''}{stock.changePercent}%)
            </div>
          </div>

          <button
            onClick={handleToggleWatchlist}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              inWatchlist
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
        </div>
      </div>

      {watchlistMsg && (
        <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-400 font-mono text-center">
          {watchlistMsg}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'chart'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Chart
        </button>

        <button
          onClick={() => setActiveTab('technicals')}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'technicals'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Technicals
        </button>

        <button
          onClick={() => setActiveTab('option-chain')}
          className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeTab === 'option-chain'
              ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/20'
              : 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Option Chain
        </button>
      </div>

      {/* TAB CONTENT: OPTION CHAIN */}
      {activeTab === 'option-chain' && (
        <OptionChain symbol={stock.symbol} />
      )}

      {/* TAB CONTENT: CHART ONLY */}
      {activeTab === 'chart' && (
        <StockChart
          series={analysis?.series}
          symbol={stock.symbol}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
        />
      )}

      {/* TAB CONTENT: TECHNICALS ONLY */}
      {activeTab === 'technicals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">INTRADAY SIGNAL & SCORE</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                {signalData?.signal} ({signalData?.score}/100)
              </span>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Transparent Scoring Reasons:
              </h3>
              <div className="space-y-1.5 font-mono text-xs">
                {signalData?.reasons && signalData.reasons.length > 0 ? (
                  signalData.reasons.map((r, i) => (
                    <div key={i} className="bg-slate-900/80 p-2 rounded border border-slate-800 text-emerald-400 flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {r}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs italic">No strong directional confirmation factors.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-4">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Technical Indicators Matrix ({timeframe.toUpperCase()})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <div className="text-slate-400">VWAP</div>
                  <div className="font-bold text-amber-400 text-sm">₹{latest.vwap || stock.vwap}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Dist: {stock.distanceFromVWAP}%</div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <div className="text-slate-400">EMA 9</div>
                  <div className="font-bold text-sky-400 text-sm">₹{latest.ema9 || stock.ltp}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Short Term Trend</div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <div className="text-slate-400">EMA 20</div>
                  <div className="font-bold text-purple-400 text-sm">₹{latest.ema20 || stock.ltp}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Medium Trend Baseline</div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <div className="text-slate-400">EMA 50</div>
                  <div className="font-bold text-slate-200 text-sm">₹{latest.ema50 || stock.ltp}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Long Term Support</div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <div className="text-slate-400">RSI (14)</div>
                  <div className="font-bold text-sky-300 text-sm">{latest.rsi || 50}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {latest.rsi >= 70 ? 'Overbought' : latest.rsi <= 30 ? 'Oversold' : 'Neutral Zone'}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded border border-slate-800">
                  <div className="text-slate-400">RVOL</div>
                  <div className="font-bold text-amber-400 text-sm">{stock.rvol}x</div>
                  <div className="text-[10px] text-slate-500 mt-1">Relative Vol Baseline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW (ALL DEFAULT VIEWS) */}
      {activeTab === 'overview' && (
        <>
          {/* Recharts Interactive Chart */}
          <StockChart
            series={analysis?.series}
            symbol={stock.symbol}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
          />

          {/* 2-Column Grid: Signal & Scoring vs Technical Factor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Signal & Transparent Factor Breakdown */}
            <div className="glass-card p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">INTRADAY SIGNAL & SCORE</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                  {signalData?.signal} ({signalData?.score}/100)
                </span>
              </div>

              {/* Contributing Scoring Factors */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Transparent Scoring Reasons:
                </h3>
                <div className="space-y-1.5 font-mono text-xs">
                  {signalData?.reasons && signalData.reasons.length > 0 ? (
                    signalData.reasons.map((r, i) => (
                      <div key={i} className="bg-slate-900/80 p-2 rounded border border-slate-800 text-emerald-400 flex items-center gap-2">
                        <span className="text-emerald-400">✓</span> {r}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs italic">No strong directional confirmation factors.</div>
                  )}
                </div>
              </div>

              {/* Timeframe & Conflicts */}
              {signalData?.conflicts && signalData.conflicts.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded p-2.5 text-xs text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-4 h-4" /> Conflict Warnings Detected:
                  </div>
                  {signalData.conflicts.map((c, idx) => (
                    <div key={idx} className="text-[11px] text-amber-200/90">• {c}</div>
                  ))}
                </div>
              )}

              {/* Educational Risk Levels (ATR Based) */}
              {signalData?.riskReference && (
                <div className="bg-slate-900/90 border border-slate-800 rounded p-3 text-xs space-y-2 font-mono">
                  <div className="font-bold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Educational ATR Reference Levels</span>
                    <span className="text-[10px] text-slate-500">ATR: ₹{signalData.riskReference.atrVal}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="bg-slate-800/60 p-1.5 rounded">
                      <div className="text-[10px] text-slate-400">Entry Ref</div>
                      <div className="font-bold text-white">₹{signalData.riskReference.entryRef}</div>
                    </div>
                    <div className="bg-rose-950/40 p-1.5 rounded border border-rose-500/20">
                      <div className="text-[10px] text-rose-400">Stop Loss Ref</div>
                      <div className="font-bold text-rose-300">₹{signalData.riskReference.stopLossRef}</div>
                    </div>
                    <div className="bg-emerald-950/40 p-1.5 rounded border border-emerald-500/20">
                      <div className="text-[10px] text-emerald-400">Target Ref</div>
                      <div className="font-bold text-emerald-300">₹{signalData.riskReference.targetRef}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 italic font-sans flex items-start gap-1">
                    <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    {signalData.riskReference.disclaimer}
                  </div>
                </div>
              )}
            </div>

            {/* Technical Indicators & Opening Range Grid */}
            <div className="lg:col-span-2 space-y-4">
              {/* Opening Range Card */}
              <div className="glass-card p-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  09:15 – 09:30 Opening Range (ORH / ORL)
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400">OR High</div>
                    <div className="font-bold text-emerald-400">₹{openingRange?.high || stock.high}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400">OR Low</div>
                    <div className="font-bold text-rose-400">₹{openingRange?.low || stock.low}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400">Range Status</div>
                    <div className="font-bold text-white">{openingRange?.status}</div>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <div className="text-slate-400">Diff %</div>
                    <div className="font-bold text-amber-400">{openingRange?.diffPercent}%</div>
                  </div>
                </div>
              </div>

              {/* Technical Indicators Matrix */}
              <div className="glass-card p-4">
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Technical Indicators Matrix ({timeframe.toUpperCase()})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-slate-400">VWAP</div>
                    <div className="font-bold text-amber-400 text-sm">₹{latest.vwap || stock.vwap}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Dist: {stock.distanceFromVWAP}%</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-slate-400">EMA 9</div>
                    <div className="font-bold text-sky-400 text-sm">₹{latest.ema9 || stock.ltp}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Short Term Trend</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-slate-400">EMA 20</div>
                    <div className="font-bold text-purple-400 text-sm">₹{latest.ema20 || stock.ltp}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Medium Trend Baseline</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-slate-400">EMA 50</div>
                    <div className="font-bold text-slate-200 text-sm">₹{latest.ema50 || stock.ltp}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Long Term Support</div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-slate-400">RSI (14)</div>
                    <div className="font-bold text-sky-300 text-sm">{latest.rsi || 50}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {latest.rsi >= 70 ? 'Overbought' : latest.rsi <= 30 ? 'Oversold' : 'Neutral Zone'}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800">
                    <div className="text-slate-400">RVOL</div>
                    <div className="font-bold text-amber-400 text-sm">{stock.rvol}x</div>
                    <div className="text-[10px] text-slate-500 mt-1">Relative Vol Baseline</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
