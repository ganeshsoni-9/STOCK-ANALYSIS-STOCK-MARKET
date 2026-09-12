import React, { useEffect, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import StockTable from '../components/StockTable';
import { watchlistApi } from '../services/api';
import { Bookmark, Plus, Trash2 } from 'lucide-react';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  const loadWatchlist = () => {
    setLoading(true);
    watchlistApi
      .get()
      .then((res) => {
        if (res.items) setItems(res.items);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    try {
      await watchlistApi.add(newSymbol.trim());
      setNewSymbol('');
      loadWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <DisclaimerBanner isDemoMode={true} />

      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            Custom Stock Watchlist
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Track selected liquid NSE instruments in real-time
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Symbol (e.g. AXISBANK)"
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase"
          />
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 font-mono">Loading watchlist items...</div>
      ) : (
        <StockTable stocks={items} title="Watchlist Monitored Instruments" />
      )}
    </div>
  );
}
