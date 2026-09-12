import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import StockScanner from './pages/StockScanner';
import StockDetails from './pages/StockDetails';
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import AdminDebug from './pages/AdminDebug';
import { useMarketSocket } from './hooks/useMarketSocket';

export default function App() {
  const { isConnected, marketData, lastUpdated } = useMarketSocket();

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 selection:bg-emerald-500 selection:text-black">
        <Navbar isConnected={isConnected} lastUpdated={lastUpdated} />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard socketData={marketData} />} />
            <Route path="/market" element={<Market socketData={marketData} />} />
            <Route path="/scanner" element={<StockScanner />} />
            <Route path="/stock/:symbol" element={<StockDetails />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/debug" element={<AdminDebug isConnected={isConnected} />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-800/80 py-4 text-center text-xs font-mono text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              TradeSense AI &copy; 2026 — Educational & Research Indian Market Scanner
            </div>
            <div className="flex items-center gap-3">
              <a href="/debug" className="hover:text-slate-300 transition">Diagnostics</a>
              <span>•</span>
              <span>Asia/Kolkata Timezone Engine</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
