import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { alertApi } from '../services/api';
import { Bell, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [conditionType, setConditionType] = useState('BULLISH_SCORE_GREATER');
  const [targetValue, setTargetValue] = useState(80);
  const [loading, setLoading] = useState(true);

  const loadAlerts = () => {
    setLoading(true);
    alertApi
      .get()
      .then((res) => {
        if (res.data) setAlerts(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    try {
      await alertApi.create({
        symbol: symbol.trim().toUpperCase(),
        conditionType,
        targetValue: Number(targetValue)
      });
      setSymbol('');
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertApi.delete(id);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={false} />

      <div className="glass-card p-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mb-1">
          <Bell className="w-5 h-5 text-amber-400" />
          Technical Alert System
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          In-App real-time alert triggers for market breakout conditions and score thresholds
        </p>
      </div>

      {/* Alert Creator Form */}
      <form onSubmit={handleCreate} className="glass-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="RELIANCE"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Condition Trigger</label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
          >
            <option value="BULLISH_SCORE_GREATER">Bullish Score &gt; Threshold</option>
            <option value="BEARISH_SCORE_GREATER">Bearish Score &gt; Threshold</option>
            <option value="PRICE_ABOVE_VWAP">Price Crosses Above VWAP</option>
            <option value="ORH_BREAKOUT">Breaks Opening Range High (ORH)</option>
            <option value="ORL_BREAKDOWN">Breaks Opening Range Low (ORL)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Target Value</label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" /> Create Alert
        </button>
      </form>

      {/* Active Alerts List */}
      <div className="glass-card p-4">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">Active Alerts</h2>
        {loading ? (
          <div className="p-4 text-center text-slate-400 font-mono text-xs">Loading active alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-4 text-center text-slate-500 font-mono text-xs">No active alerts set up yet.</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((al) => (
              <div key={al._id} className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-white">{al.symbol}</span>
                    <span className="text-slate-400 ml-2">[{al.conditionType}]</span>
                    {al.targetValue && <span className="text-amber-400 ml-1">Target: {al.targetValue}</span>}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(al._id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="Delete Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
