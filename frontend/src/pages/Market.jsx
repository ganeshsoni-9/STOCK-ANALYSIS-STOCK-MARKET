import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import MarketIndicesHeader from '../components/MarketIndicesHeader';
import BreadthCard from '../components/BreadthCard';
import SectorHeatmap from '../components/SectorHeatmap';
import { marketApi } from '../services/api';

export default function Market({ socketData }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (socketData) {
      setData(socketData);
      return;
    }
    marketApi.getOverview().then((res) => {
      if (res.success) setData(res.data);
    });
  }, [socketData]);

  if (!data) return <div className="p-8 text-center text-slate-400 font-mono">Loading Market Overview...</div>;

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={false} />

      <div className="glass-card p-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight mb-1">Indian Market Overview</h1>
        <p className="text-xs text-slate-400 font-mono">
          Intraday Snapshot for NIFTY 50, BANK NIFTY, FINNIFTY & Sectorial Indices
        </p>
      </div>

      <MarketIndicesHeader indices={data.indices} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <BreadthCard breadth={data.breadth} />
        </div>
        <div className="md:col-span-2 glass-card p-4">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-2">Market Status Info</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">STATUS</div>
              <div className="font-bold text-emerald-400">{data.marketStatus?.status}</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">OPEN TIME</div>
              <div className="font-bold text-white">{data.marketStatus?.marketOpenTime}</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">CLOSE TIME</div>
              <div className="font-bold text-white">{data.marketStatus?.marketCloseTime}</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">SOURCE</div>
              <div className="font-bold text-amber-400 uppercase">{data.dataFreshness?.source}</div>
            </div>
          </div>
        </div>
      </div>

      <SectorHeatmap sectors={data.sectors} />
    </div>
  );
}
