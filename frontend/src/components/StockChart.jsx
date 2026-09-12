import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export default function StockChart({ series = [], symbol = '', timeframe = '5m', onTimeframeChange }) {
  const [activeTab, setActiveTab] = useState('price'); // price | rsi | macd

  if (!series || series.length === 0) {
    return <div className="glass-card p-6 text-center text-slate-400">Loading chart data...</div>;
  }

  const formattedData = series.map((c) => ({
    ...c,
    time: new Date(c.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }));

  const timeframes = ['1m', '3m', '5m', '15m', '30m'];

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Timeframe & Subchart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange && onTimeframeChange(tf)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                timeframe === tf
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('price')}
            className={`px-3 py-1 rounded border transition ${
              activeTab === 'price'
                ? 'bg-slate-800 text-emerald-400 border-slate-700 font-bold'
                : 'text-slate-400 border-transparent hover:bg-slate-900'
            }`}
          >
            Price & VWAP
          </button>
          <button
            onClick={() => setActiveTab('rsi')}
            className={`px-3 py-1 rounded border transition ${
              activeTab === 'rsi'
                ? 'bg-slate-800 text-sky-400 border-slate-700 font-bold'
                : 'text-slate-400 border-transparent hover:bg-slate-900'
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => setActiveTab('macd')}
            className={`px-3 py-1 rounded border transition ${
              activeTab === 'macd'
                ? 'bg-slate-800 text-purple-400 border-slate-700 font-bold'
                : 'text-slate-400 border-transparent hover:bg-slate-900'
            }`}
          >
            MACD
          </button>
        </div>
      </div>

      {/* Main Chart Rendering */}
      {activeTab === 'price' && (
        <div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-400"></span> Close</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-400"></span> VWAP</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-sky-400"></span> EMA 9</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-purple-400"></span> EMA 20</span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis domain={['auto', 'auto']} stroke="#64748B" fontSize={11} orientation="right" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="close" stroke="#10B981" strokeWidth={2} dot={false} name="Close" />
                <Line type="monotone" dataKey="vwap" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="VWAP" />
                <Line type="monotone" dataKey="ema9" stroke="#38BDF8" strokeWidth={1} dot={false} name="EMA 9" />
                <Line type="monotone" dataKey="ema20" stroke="#C084FC" strokeWidth={1} dot={false} name="EMA 20" />
                <Bar dataKey="volume" fill="#1E293B" yAxisId="vol" opacity={0.3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'rsi' && (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} orientation="right" />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Overbought (70)', fill: '#EF4444', fontSize: 10 }} />
              <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Oversold (30)', fill: '#10B981', fontSize: 10 }} />
              <Line type="monotone" dataKey="rsi" stroke="#38BDF8" strokeWidth={2} dot={false} name="RSI 14" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'macd' && (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} orientation="right" />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <ReferenceLine y={0} stroke="#475569" />
              <Line type="monotone" dataKey="macd" stroke="#C084FC" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="macdSignal" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Signal" />
              <Bar dataKey="macdHistogram" fill="#10B981" name="Histogram" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
