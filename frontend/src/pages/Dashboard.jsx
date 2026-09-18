import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import MarketIndicesHeader from '../components/MarketIndicesHeader';
import RegimeScoreGauge from '../components/RegimeScoreGauge';
import BreadthCard from '../components/BreadthCard';
import SectorHeatmap from '../components/SectorHeatmap';
import StockTable from '../components/StockTable';
import { marketApi } from '../services/api';

export default function Dashboard({ socketData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shockers'); // 'shockers' | 'all'

  useEffect(() => {
    if (socketData) {
      setData(socketData);
      setLoading(false);
      return;
    }

    marketApi
      .getOverview()
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [socketData]);

  if (loading && !data) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        Connecting to TradeSense AI Free Live Intraday Engine...
      </div>
    );
  }

  const isMock = data?.dataFreshness?.source === 'mock';

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={isMock} />

      {/* Primary Indices Overview */}
      <MarketIndicesHeader indices={data?.indices} />

      {/* Top Grid: Market Regime & Breadth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RegimeScoreGauge regimeData={data?.marketRegime} />
        </div>
        <div>
          <BreadthCard breadth={data?.breadth} />
        </div>
      </div>

      {/* Sector Heatmap */}
      <SectorHeatmap sectors={data?.sectors} />

      {/* Stock Scanner Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StockTable
          stocks={data?.topBullish}
          title="🟢 Top Bullish Momentum Stocks"
          subtitle="Highest composite bullish scores supported by VWAP, EMA & Volume"
        />
        <StockTable
          stocks={data?.topBearish}
          title="🔴 Top Bearish Momentum Stocks"
          subtitle="Highest composite bearish scores supported by VWAP breakdown & RSI"
        />
      </div>

      {/* Tab Switcher: Volume Shockers vs All Stocks */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800 w-fit font-mono text-xs">
          <button
            onClick={() => setActiveTab('shockers')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'shockers'
                ? 'bg-emerald-500 text-black shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Volume Shockers
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-black shadow font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 All Monitored Stocks ({data?.allStocks?.length || 0})
          </button>
        </div>

        {activeTab === 'shockers' ? (
          <StockTable
            stocks={data?.volumeShockers}
            title="⚡ Volume Shockers (High RVOL)"
            subtitle="Stocks experiencing elevated relative volume compared to 20-period baseline"
          />
        ) : (
          <StockTable
            stocks={data?.allStocks}
            title="📊 All Monitored Instruments (Full List)"
            subtitle="Complete list of all liquid NSE instruments with real intraday technical metrics"
          />
        )}
      </div>
    </div>
  );
}
