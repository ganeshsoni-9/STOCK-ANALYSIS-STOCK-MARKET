import React, { useEffect, useState } from 'react';
import { systemApi } from '../services/api';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDebug({ isConnected }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    systemApi
      .getHealth()
      .then((res) => setHealth(res))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-4 font-mono text-xs max-w-4xl mx-auto">
      <div className="glass-card p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            Developer System Health & Diagnostics
          </h1>
          <p className="text-slate-400 text-xs">
            Real-time backend engine latency, socket gateway metrics, and provider status
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="text-slate-400 text-[10px] uppercase">Socket Gateway</div>
          <div className="text-base font-bold flex items-center gap-1.5 mt-1">
            {isConnected ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> CONNECTED
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> DISCONNECTED
              </span>
            )}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-slate-400 text-[10px] uppercase">Market Mode</div>
          <div className="text-base font-bold text-amber-400 uppercase mt-1">
            {health?.services?.marketDataMode || 'mock'}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-slate-400 text-[10px] uppercase">MongoDB Database</div>
          <div className="text-base font-bold text-sky-400 mt-1">
            {health?.services?.mongoDB || 'Mock/InMemory'}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-slate-400 text-[10px] uppercase">Server Uptime</div>
          <div className="text-base font-bold text-white mt-1">
            {health?.system?.uptimeSeconds || 0}s
          </div>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Raw Diagnostic Payload</h2>
        <pre className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto">
          {JSON.stringify(health, null, 2)}
        </pre>
      </div>
    </div>
  );
}
