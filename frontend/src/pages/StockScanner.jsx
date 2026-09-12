import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import StockTable from '../components/StockTable';
import { stockApi } from '../services/api';
import { Filter, RefreshCw } from 'lucide-react';

export default function StockScanner() {
  const [stocks, setStocks] = useState([]);
  const [timeframe, setTimeframe] = useState('5m');
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [rvolFilter, setRvolFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadStocks = () => {
    setLoading(true);
    stockApi
      .getAll(timeframe)
      .then((res) => {
        if (res.success) setStocks(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStocks();
  }, [timeframe]);

  const filteredStocks = stocks.filter((stk) => {
    if (signalFilter === 'BULLISH' && !stk.signal.includes('BULLISH')) return false;
    if (signalFilter === 'BEARISH' && !stk.signal.includes('BEARISH')) return false;
    if (signalFilter === 'STRONG' && !stk.signal.startsWith('STRONG')) return false;
    if (rvolFilter === 'HIGH' && stk.rvol < 1.5) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={false} />

      {/* Filter Controls Header */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            Liquid NSE Stock Scanner (100% Free Live Feed)
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Multi-factor intraday momentum scanner with composite scoring
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

          <button
            onClick={loadStocks}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh Scanner"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 font-mono">Running live technical scanner engine...</div>
      ) : (
        <StockTable stocks={filteredStocks} title={`Scanner Results (${timeframe.toUpperCase()} Timeframe)`} />
      )}
    </div>
  );
}
