import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import MarketIndicesHeader from '../components/MarketIndicesHeader';
import RegimeScoreGauge from '../components/RegimeScoreGauge';
import BreadthCard from '../components/BreadthCard';
import SectorHeatmap from '../components/SectorHeatmap';
import StockTable from '../components/StockTable';
import { marketApi } from '../services/api';

function getIndianMarketStatus() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);

  const weekday = parts.find((p) => p.type === 'weekday')?.value;
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);

  const timeInMinutes = hour * 60 + minute;

  const marketOpen = 9 * 60 + 15;   // 09:15 AM
  const marketClose = 15 * 60 + 30; // 03:30 PM

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  const isMarketOpen =
    !isWeekend &&
    timeInMinutes >= marketOpen &&
    timeInMinutes <= marketClose;

  return isMarketOpen;
}

export default function Dashboard({ socketData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shockers');

  const [isMarketOpen, setIsMarketOpen] = useState(
    getIndianMarketStatus()
  );

  // Check market status every second
  useEffect(() => {
    const updateMarketStatus = () => {
      setIsMarketOpen(getIndianMarketStatus());
    };

    updateMarketStatus();

    const interval = setInterval(updateMarketStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch market data only when market is open
  useEffect(() => {
    if (!isMarketOpen) {
      setLoading(false);
      return;
    }

    if (socketData) {
      setData(socketData);
      setLoading(false);
      return;
    }

    setLoading(true);

    marketApi
      .getOverview()
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch((error) => {
        console.error('[Dashboard] Market data error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [socketData, isMarketOpen]);

  /*
   * MARKET CLOSED SCREEN
   */
  if (!isMarketOpen) {
    return (
      <div className="space-y-4">
        <DisclaimerBanner
          isDemoMode={data?.dataFreshness?.source === 'mock'}
        />

        <div className="min-h-[55vh] flex items-center justify-center">
          <div className="w-full max-w-2xl bg-slate-900/80 border border-rose-500/30 rounded-2xl p-8 text-center shadow-xl">

            <div className="text-5xl mb-4">
              🔴
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              MARKET NOT OPEN
            </h1>

            <p className="text-slate-400 text-sm md:text-base mb-6">
              Indian equity market is currently closed.
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg px-5 py-3">
              <span className="text-slate-400 text-sm">
                Regular Market Hours
              </span>

              <span className="text-emerald-400 font-semibold font-mono">
                09:15 AM – 03:30 PM IST
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-6">
              Live market dashboard will be available when the market opens.
            </p>

          </div>
        </div>
      </div>
    );
  }

  /*
   * LOADING SCREEN
   */
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

      {/* Tab Switcher */}
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