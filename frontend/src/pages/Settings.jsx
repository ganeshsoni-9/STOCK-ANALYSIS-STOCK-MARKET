import React, { useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { Sliders, Save, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const [provider, setProvider] = useState('mock');
  const [refreshRate, setRefreshRate] = useState(2000);
  const [defaultTf, setDefaultTf] = useState('5m');
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('Settings updated successfully!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <DisclaimerBanner isDemoMode={provider === 'mock'} />

      <div className="glass-card p-4">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-emerald-400" />
          TradeSense AI Platform Settings
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          Configure provider feeds, indicator weights, refresh frequency, and UI defaults
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 space-y-6">
        {/* Data Provider Selection */}
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Market Data Feed Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <label
              className={`p-3 rounded-lg border cursor-pointer transition ${
                provider === 'mock' ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <input type="radio" name="provider" value="mock" checked={provider === 'mock'} onChange={() => setProvider('mock')} className="hidden" />
              <div className="font-bold text-emerald-400 mb-1">Synthetic Mock Feed</div>
              <div className="text-[10px] text-slate-400">High-fidelity simulated tick data for testing without credentials</div>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition ${
                provider === 'angelone' ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <input type="radio" name="provider" value="angelone" checked={provider === 'angelone'} onChange={() => setProvider('angelone')} className="hidden" />
              <div className="font-bold text-sky-400 mb-1">Angel One SmartAPI</div>
              <div className="text-[10px] text-slate-400">Official broker REST & WebSocket integration</div>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition ${
                provider === 'upstox' ? 'bg-emerald-950/40 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <input type="radio" name="provider" value="upstox" checked={provider === 'upstox'} onChange={() => setProvider('upstox')} className="hidden" />
              <div className="font-bold text-purple-400 mb-1">Upstox API v2</div>
              <div className="text-[10px] text-slate-400">Official Upstox real-time market data feed</div>
            </label>
          </div>
        </div>

        {/* Weights Configuration Overview */}
        <div className="border-t border-slate-800 pt-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3">
            Configurable Market Regime Weights
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">Index Trend</div>
              <div className="font-bold text-emerald-400">20% Weight</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">Market Breadth</div>
              <div className="font-bold text-emerald-400">20% Weight</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">Sector Strength</div>
              <div className="font-bold text-emerald-400">15% Weight</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400">Volume Confirmation</div>
              <div className="font-bold text-emerald-400">15% Weight</div>
            </div>
          </div>
        </div>

        {/* Default Parameters */}
        <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Socket Update Frequency</label>
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
            >
              <option value={1000}>1 Second (High Speed)</option>
              <option value={2000}>2 Seconds (Standard)</option>
              <option value={5000}>5 Seconds (Low Bandwidth)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Default Timeframe</label>
            <select
              value={defaultTf}
              onChange={(e) => setDefaultTf(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 focus:outline-none"
            >
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes (Intraday Standard)</option>
              <option value="15m">15 Minutes (Confirmation)</option>
              <option value="30m">30 Minutes</option>
            </select>
          </div>
        </div>

        {savedMsg && (
          <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-mono text-xs text-center">
            {savedMsg}
          </div>
        )}

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </form>
    </div>
  );
}
