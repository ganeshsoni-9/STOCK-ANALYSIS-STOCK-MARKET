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

      {/* Volume Shockers */}
      <StockTable
        stocks={data?.volumeShockers}
        title="⚡ Volume Shockers (High RVOL)"
        subtitle="Stocks experiencing elevated relative volume compared to 20-period baseline"
      />
    </div>
  );
}
