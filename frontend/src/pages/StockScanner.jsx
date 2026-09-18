import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import StockTable from '../components/StockTable';
import { stockApi } from '../services/api';
import { Filter, RefreshCw, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

export default function StockScanner() {
  const [activeTab, setActiveTab] = useState('OPEN_LOW'); // Default to OPEN_LOW or SIGNALS
  const [stocks, setStocks] = useState([]);
  const [openLowStocks, setOpenLowStocks] = useState([]);
  const [timeframe, setTimeframe] = useState('5m');
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [rvolFilter, setRvolFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadStocks = () => {
    setLoading(true);
    setErrorMsg('');

    if (activeTab === 'OPEN_LOW') {
      stockApi
        .getOpenLow(timeframe)
        .then((res) => {
          if (res && res.success) {
            setOpenLowStocks(res.data || []);
          } else {
            setErrorMsg('Unable to fetch market data.');
          }
        })
        .catch((err) => {
          console.error('[OpenLowScanner Error]', err);
          setErrorMsg('Unable to fetch market data.');
        })
        .finally(() => setLoading(false));
    } else {
      stockApi
        .getAll(timeframe)
        .then((res) => {
          if (res && res.success) {
            setStocks(res.data || []);
          } else {
            setErrorMsg('Unable to fetch market data.');
          }
        })
        .catch((err) => {
          console.error('[StockScanner Error]', err);
          setErrorMsg('Unable to fetch market data.');
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadStocks();
  }, [timeframe, activeTab]);

  const filteredSignalsStocks = stocks.filter((stk) => {
    if (signalFilter === 'BULLISH' && !stk.signal?.includes('BULLISH')) return false;
    if (signalFilter === 'BEARISH' && !stk.signal?.includes('BEARISH')) return false;
    if (signalFilter === 'STRONG' && !stk.signal?.startsWith('STRONG')) return false;
    if (rvolFilter === 'HIGH' && (stk.rvol ?? 0) < 1.5) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={false} />

      {/* Scanner View Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('OPEN_LOW')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'OPEN_LOW'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          OPEN = LOW SCANNER
          {openLowStocks.length > 0 && activeTab === 'OPEN_LOW' && (
            <span className="bg-black/20 text-black px-1.5 py-0.5 rounded text-[10px]">
              {openLowStocks.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SIGNALS')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'SIGNALS'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          ALL TECHNICAL SIGNALS
        </button>
      </div>

      {/* Filter Controls Header */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            {activeTab === 'OPEN_LOW' ? 'OPEN = LOW SCANNER' : 'Liquid NSE Stock Scanner (100% Free Live Feed)'}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {activeTab === 'OPEN_LOW'
              ? "Stocks where today's Open equals today's Low"
              : 'Multi-factor intraday momentum scanner with composite scoring'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Timeframe Selector */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center gap-1">
            {['1m', '3m', '5m', '15m', '30m'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  timeframe === tf ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {activeTab === 'SIGNALS' && (
            <>
              {/* Signal Filter */}
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Signals</option>
                <option value="BULLISH">Bullish Only</option>
                <option value="BEARISH">Bearish Only</option>
                <option value="STRONG">Strong Signals Only</option>
              </select>

              {/* RVOL Filter */}
              <select
                value={rvolFilter}
                onChange={(e) => setRvolFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Volume</option>
                <option value="HIGH">High RVOL (&ge; 1.5x)</option>
              </select>
            </>
          )}

          <button
            onClick={loadStocks}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh Scanner"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-sm space-y-2">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
          <div className="text-slate-200 font-bold">Scanning stocks...</div>
        </div>
      ) : activeTab === 'OPEN_LOW' ? (
        <StockTable
          stocks={openLowStocks}
          title="OPEN = LOW SCANNER"
          subtitle="Stocks where today's Open equals today's Low"
          isOpenLowMode={true}
          emptyMessage="No Open = Low stocks found"
        />
      ) : (
        <StockTable
          stocks={filteredSignalsStocks}
          title={`Scanner Results (${timeframe.toUpperCase()} Timeframe)`}
        />
      )}
    </div>
  );
}
