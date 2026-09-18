import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { X, Loader2, AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, CandlestickChart as CandlestickIcon } from 'lucide-react';
import { stockApi } from '../services/api';
import CandlestickChart from './CandlestickChart';

export default function StockChartModal({ symbol, stockSummary, isOpen, onClose }) {
  const [timeframe, setTimeframe] = useState('5m');
  const [activeTab, setActiveTab] = useState('price'); // 'price' | 'rsi' | 'macd'
  const [chartMode, setChartMode] = useState('line'); // 'line' | 'candles'
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !symbol) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');
    setSeries([]);

    const fetchRealCandleData = async () => {
      try {
        // Primary: fetch details with full technical series (150 candles)
        const res = await stockApi.getDetails(symbol, timeframe, 150);
        if (!isMounted) return;

        if (res && res.success && res.data && res.data.analysis && Array.isArray(res.data.analysis.series) && res.data.analysis.series.length > 0) {
          setSeries(res.data.analysis.series);
        } else {
          // Fallback: fetch raw candles (150 candles)
          const candlesRes = await stockApi.getCandles(symbol, timeframe, 150);
          if (!isMounted) return;

          if (candlesRes && candlesRes.success && Array.isArray(candlesRes.data) && candlesRes.data.length > 0) {
            setSeries(candlesRes.data);
          } else {
            setErrorMsg(`Unable to load chart for ${symbol}`);
          }
        }
      } catch (err) {
        console.error(`[StockChartModal Error] ${symbol}:`, err.message);
        if (isMounted) {
          setErrorMsg(`Unable to load chart for ${symbol}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRealCandleData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, symbol, timeframe]);

  if (!isOpen || !symbol) return null;

  const isPositive = (stockSummary?.changePercent ?? 0) >= 0;

  const formattedSeries = series.map((c) => ({
    ...c,
    time: c.timestamp ? new Date(c.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
  }));

  const timeframes = ['1m', '3m', '5m', '15m', '30m'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0B0F17] border border-slate-800 rounded-xl max-w-4xl w-full p-5 shadow-2xl space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-600 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-emerald-500/20">
              {symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-mono text-white tracking-tight">{symbol}</h2>
                <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
                  NSE Real-Time Feed
                </span>
              </div>
              <p className="text-xs text-slate-400">{stockSummary?.companyName || 'NSE Instrument'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Metrics Summary Bar */}
        {stockSummary && (
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">LTP</span>
              <span className="font-bold text-white text-sm">
                ₹{stockSummary.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Change</span>
              <span className={`font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{stockSummary.changePercent}%
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase">RSI (14)</span>
              <span className="font-bold text-sky-400">{stockSummary.rsi ?? '—'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase">VWAP Dist</span>
              <span className={`font-bold ${(stockSummary.distanceFromVWAP ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(stockSummary.distanceFromVWAP ?? 0) >= 0 ? '+' : ''}{stockSummary.distanceFromVWAP ?? '—'}%
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Bull / Bear Score</span>
              <span className="font-bold text-slate-200">
                <span className="text-emerald-400">{stockSummary.bullishScore ?? 0}</span> / <span className="text-rose-400">{stockSummary.bearishScore ?? 0}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Signal</span>
              <span className="font-bold text-amber-400">{stockSummary.signal || 'NEUTRAL'}</span>
            </div>
          </div>
        )}

        {/* Timeframe & Subchart & Chart Type View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                    timeframe === tf
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Line / Candles View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setChartMode('line')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                  chartMode === 'line'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Line Chart"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Line</span>
              </button>

              <button
                onClick={() => setChartMode('candles')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                  chartMode === 'candles'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
                title="Candlestick Chart"
              >
                <CandlestickIcon className="w-3.5 h-3.5" />
                <span>Candles</span>
              </button>
            </div>
          </div>

          {/* Indicator Subchart Tabs */}
          <div className="flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab('price')}
              className={`px-3 py-1 rounded border transition ${
                activeTab === 'price'
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 font-bold'
                  : 'text-slate-400 border-transparent hover:bg-slate-900'
              }`}
            >
              Price & VWAP
            </button>
            <button
              onClick={() => setActiveTab('rsi')}
              className={`px-3 py-1 rounded border transition ${
                activeTab === 'rsi'
                  ? 'bg-slate-800 text-sky-400 border-slate-700 font-bold'
                  : 'text-slate-400 border-transparent hover:bg-slate-900'
              }`}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setActiveTab('macd')}
              className={`px-3 py-1 rounded border transition ${
                activeTab === 'macd'
                  ? 'bg-slate-800 text-purple-400 border-slate-700 font-bold'
                  : 'text-slate-400 border-transparent hover:bg-slate-900'
              }`}
            >
              MACD
            </button>
          </div>
        </div>

        {/* Chart View Content */}
        <div className="min-h-[320px] flex items-center justify-center">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-mono text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Loading real technical candle data for {symbol} ({timeframe.toUpperCase()})...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center text-amber-400 font-mono text-xs bg-amber-950/30 border border-amber-500/30 rounded-lg flex flex-col items-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div className="font-bold">{errorMsg}</div>
              <p className="text-[11px] text-amber-300/80 font-sans">
                Historical candle feed is currently unavailable for this symbol.
              </p>
            </div>
          ) : formattedSeries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono text-xs">
              No historical candle data available for {symbol}.
            </div>
          ) : (
            <div className="w-full">
              {activeTab === 'price' && (
                <div>
                  {chartMode === 'line' ? (
                    <>
                      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mb-2">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-400"></span> Close Price</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-400"></span> VWAP</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-sky-400"></span> EMA 9</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-purple-400"></span> EMA 20</span>
                      </div>

                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={formattedSeries}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                            <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                            <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={11} orientation="right" />
                            <YAxis yAxisId="vol" orientation="left" hide domain={[0, (max) => max * 4]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                            />
                            <Line type="monotone" dataKey="close" stroke="#10B981" strokeWidth={2} dot={false} name="Close Price" />
                            <Line type="monotone" dataKey="vwap" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="VWAP" />
                            <Line type="monotone" dataKey="ema9" stroke="#38BDF8" strokeWidth={1} dot={false} name="EMA 9" />
                            <Line type="monotone" dataKey="ema20" stroke="#C084FC" strokeWidth={1} dot={false} name="EMA 20" />
                            <Bar dataKey="volume" fill="#1E293B" yAxisId="vol" opacity={0.3} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  ) : (
                    /* Lightweight-Charts TradingView Professional Candlestick View */
                    <div className="h-[320px] w-full">
                      <CandlestickChart series={series} height={320} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rsi' && (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={formattedSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} orientation="right" />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Overbought (70)', fill: '#EF4444', fontSize: 10 }} />
                      <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Oversold (30)', fill: '#10B981', fontSize: 10 }} />
                      <Line type="monotone" dataKey="rsi" stroke="#38BDF8" strokeWidth={2} dot={false} name="RSI 14" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'macd' && (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={formattedSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                      <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} orientation="right" />
                      <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                      <ReferenceLine y={0} stroke="#475569" />
                      <Line type="monotone" dataKey="macd" stroke="#C084FC" strokeWidth={1.5} dot={false} name="MACD" />
                      <Line type="monotone" dataKey="macdSignal" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Signal" />
                      <Bar dataKey="macdHistogram" fill="#10B981" name="Histogram" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



