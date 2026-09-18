import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { BarChart3, Layers } from 'lucide-react';

export default function OptionOIChart({ chain = [], atmStrike }) {
  const [viewMode, setViewMode] = useState('oi'); // 'oi' | 'volume'

  if (!chain || chain.length === 0) return null;

  const chartData = chain.map((row) => ({
    strike: row.strike,
    callOI: row.CE?.oi || 0,
    putOI: row.PE?.oi || 0,
    callVol: row.CE?.volume || 0,
    putVol: row.PE?.volume || 0,
    isATM: row.strike === atmStrike
  }));

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
            Open Interest & Volume Distribution by Strike Price
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setViewMode('oi')}
            className={`px-3 py-1 rounded transition ${
              viewMode === 'oi'
                ? 'bg-emerald-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Call OI vs Put OI
          </button>
          <button
            onClick={() => setViewMode('volume')}
            className={`px-3 py-1 rounded transition ${
              viewMode === 'volume'
                ? 'bg-sky-500 text-black font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Call Vol vs Put Vol
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
            <XAxis dataKey="strike" stroke="#64748B" fontSize={11} angle={-30} textAnchor="end" />
            <YAxis stroke="#64748B" fontSize={11} orientation="right" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
            {viewMode === 'oi' ? (
              <>
                <Bar dataKey="callOI" name="Call Open Interest (CE)" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="putOI" name="Put Open Interest (PE)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <>
                <Bar dataKey="callVol" name="Call Traded Volume (CE)" fill="#FB7185" radius={[4, 4, 0, 0]} />
                <Bar dataKey="putVol" name="Put Traded Volume (PE)" fill="#34D399" radius={[4, 4, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
