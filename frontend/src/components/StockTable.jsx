import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  AlertCircle,
  Bookmark,
  Check,
  Loader2,
  Trash2,
  AlertTriangle,
  Search,
  LineChart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock
} from 'lucide-react';
import { watchlistApi } from '../services/api';
import StockChartModal from './StockChartModal';

export default function StockTable({
  stocks = [],
  title = 'Stock Scanner',
  subtitle = '',
  onWatchlistChange,
  isOpenLowMode = false,
  emptyMessage = ''
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [watchlistSymbols, setWatchlistSymbols] = useState([]);
  const [loadingSymbol, setLoadingSymbol] = useState(null);
  const [errorToast, setErrorToast] = useState('');

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(null); // 'symbol' | 'open' | 'low' | 'ltp' | 'changePercent' | 'volume' | 'rvol' | 'distanceFromVWAP' | 'rsi' | 'bullishScore' | 'bearishScore'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [selectedChartStock, setSelectedChartStock] = useState(null);

  // Fetch logged-in user's watchlist symbols on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      watchlistApi
        .get()
        .then((res) => {
          if (res && Array.isArray(res.symbols)) {
            setWatchlistSymbols(res.symbols.map((s) => s.toUpperCase()));
          }
        })
        .catch((err) => console.error('[StockTable Watchlist Fetch Error]', err));
    }
  }, []);

  const handleWatchlistToggle = async (e, symbol, actionType = 'toggle') => {
    e.stopPropagation();
    setErrorToast('');
    const token = localStorage.getItem('token');

    // If unauthenticated, redirect to login with return location state
    if (!token || token === 'null' || token === 'undefined') {
      navigate('/login', { state: { from: location } });
      return;
    }

    const symUpper = symbol.toUpperCase().trim();
    const isCurrentlyAdded = watchlistSymbols.includes(symUpper);

    // If removing, request confirmation popup
    if (isCurrentlyAdded || actionType === 'remove') {
      const confirmed = window.confirm(`Are you sure you want to remove ${symUpper} from watchlist?`);
      if (!confirmed) return;
    }

    setLoadingSymbol(symUpper);

    if (isCurrentlyAdded || actionType === 'remove') {
      // Optimistic UI update: immediately remove from local state
      setWatchlistSymbols((prev) => prev.filter((s) => s !== symUpper));

      try {
        await watchlistApi.remove(symUpper);
        if (onWatchlistChange) {
          onWatchlistChange();
        }
      } catch (err) {
        console.error(`[Watchlist Remove Error] ${symUpper}:`, err);
        // Rollback state & show error toast
        setWatchlistSymbols((prev) => [...prev, symUpper]);
        setErrorToast(`Failed to remove ${symUpper}, please try again`);
        setTimeout(() => setErrorToast(''), 4000);
      } finally {
        setLoadingSymbol(null);
      }
    } else {
      // Adding to watchlist
      try {
        await watchlistApi.add(symUpper);
        setWatchlistSymbols((prev) => [...prev, symUpper]);
        if (onWatchlistChange) {
          onWatchlistChange();
        }
      } catch (err) {
        console.error(`[Watchlist Add Error] ${symUpper}:`, err);
        setErrorToast(`Failed to add ${symUpper}, please try again`);
        setTimeout(() => setErrorToast(''), 4000);
      } finally {
        setLoadingSymbol(null);
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatVolume = (vol) => {
    if (vol == null) return '—';
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)}Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(1)}L`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toLocaleString('en-IN');
  };

  const getSignalBadge = (signal, score) => {
    let style = 'bg-slate-800 text-slate-300 border-slate-700';
    if (signal === 'STRONG BULLISH') style = 'bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950';
    else if (signal === 'BULLISH') style = 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30';
    else if (signal === 'WEAK BULLISH') style = 'bg-emerald-950/40 text-emerald-400 border-emerald-600/20';
    else if (signal === 'STRONG BEARISH') style = 'bg-rose-950 text-rose-400 border-rose-500/50 shadow-sm shadow-rose-950';
    else if (signal === 'BEARISH') style = 'bg-rose-900/60 text-rose-300 border-rose-500/30';
    else if (signal === 'WEAK BEARISH') style = 'bg-rose-950/40 text-rose-400 border-rose-600/20';
    else if (signal === 'NEUTRAL') style = 'bg-amber-950/40 text-amber-400 border-amber-500/30';

    return (
      <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border inline-flex items-center gap-1 ${style}`}>
        {signal || 'NEUTRAL'} ({score ?? 0})
      </span>
    );
  };

  // 1. Search Filter
  const filteredStocks = stocks.filter((stk) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const symMatch = stk.symbol?.toLowerCase().includes(q);
    const nameMatch = stk.companyName?.toLowerCase().includes(q) || stk.name?.toLowerCase().includes(q);
    return symMatch || nameMatch;
  });

  // 2. Sorting
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (!sortField) return 0;

    let valA = a[sortField];
    let valB = b[sortField];

    if (valA == null) return 1;
    if (valB == null) return -1;

    if (typeof valA === 'string') {
      const cmp = valA.localeCompare(valB);
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    return sortDirection === 'asc' ? valA - valB : valB - valA;
  });

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover/col:text-slate-400 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-400 ml-1 inline font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-400 ml-1 inline font-bold" />
    );
  };

  const formattedLastUpdated = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  if (!stocks || stocks.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-slate-400 font-mono text-xs space-y-2">
        <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <div className="text-slate-300 font-bold">
          {isOpenLowMode ? 'No Open = Low stocks found' : (emptyMessage || 'Your watchlist is empty')}
        </div>
        <div>
          {isOpenLowMode
            ? 'There are currently no stocks matching the Open = Low condition in the market feed.'
            : (emptyMessage ? 'No items available at this time.' : 'Your watchlist is empty. Add stocks to track them here.')}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      {errorToast && (
        <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs font-mono text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Counter */}
          <span className="text-xs font-mono text-emerald-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg font-bold">
            {isOpenLowMode
              ? `Open = Low Stocks: ${sortedStocks.length}`
              : (sortedStocks.length === stocks.length
                  ? `${stocks.length} Instruments Monitored`
                  : `${sortedStocks.length} of ${stocks.length} Instruments`)}
          </span>

          {/* Last Updated Timestamp */}
          <span className="text-xs font-mono text-slate-500 hidden sm:flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Last updated: <strong className="text-slate-300">{formattedLastUpdated}</strong>
          </span>

          {/* Search Box Filter */}
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol or name..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            {isOpenLowMode ? (
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider bg-slate-900/50">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Symbol / Stock Name {renderSortIndicator('symbol')}
                </th>
                <th
                  onClick={() => handleSort('open')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Open (₹) {renderSortIndicator('open')}
                </th>
                <th
                  onClick={() => handleSort('low')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Low (₹) {renderSortIndicator('low')}
                </th>
                <th
                  onClick={() => handleSort('ltp')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  LTP (₹) {renderSortIndicator('ltp')}
                </th>
                <th
                  onClick={() => handleSort('changePercent')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Change % {renderSortIndicator('changePercent')}
                </th>
                <th
                  onClick={() => handleSort('volume')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Volume {renderSortIndicator('volume')}
                </th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Watchlist / Chart</th>
              </tr>
            ) : (
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider bg-slate-900/50">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Symbol / Company {renderSortIndicator('symbol')}
                </th>
                <th
                  onClick={() => handleSort('ltp')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  LTP (₹) {renderSortIndicator('ltp')}
                </th>
                <th
                  onClick={() => handleSort('changePercent')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Change % {renderSortIndicator('changePercent')}
                </th>
                <th
                  onClick={() => handleSort('rvol')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  RVOL {renderSortIndicator('rvol')}
                </th>
                <th
                  onClick={() => handleSort('distanceFromVWAP')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  VWAP Dist {renderSortIndicator('distanceFromVWAP')}
                </th>
                <th
                  onClick={() => handleSort('rsi')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  RSI {renderSortIndicator('rsi')}
                </th>
                <th
                  onClick={() => handleSort('bullishScore')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Bull Score {renderSortIndicator('bullishScore')}
                </th>
                <th
                  onClick={() => handleSort('bearishScore')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white group/col select-none"
                >
                  Bear Score {renderSortIndicator('bearishScore')}
                </th>
                <th className="py-2.5 px-3">Signal</th>
                <th className="py-2.5 px-3 text-right">Watchlist / Chart</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedStocks.length === 0 ? (
              <tr>
                <td colSpan={isOpenLowMode ? 8 : 10} className="py-8 text-center text-slate-500 font-mono text-xs">
                  {isOpenLowMode ? 'No Open = Low stocks found' : `No stocks match "${searchQuery}".`}
                </td>
              </tr>
            ) : (
              sortedStocks.map((stk, idx) => {
                const isPositive = (stk.changePercent ?? 0) >= 0;
                const isAboveVWAP = (stk.distanceFromVWAP ?? 0) >= 0;
                const symUpper = stk.symbol ? stk.symbol.toUpperCase() : 'N/A';
                const isInWatchlist = watchlistSymbols.includes(symUpper);
                const isPending = loadingSymbol === symUpper;

                if (isOpenLowMode) {
                  return (
                    <tr
                      key={stk.symbol || idx}
                      onClick={() => navigate(`/stock/${stk.symbol}`)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          {stk.symbol || '—'}
                          {stk.conflicts && stk.conflicts.length > 0 && (
                            <AlertCircle className="w-3.5 h-3.5 text-amber-400" title={stk.conflicts[0]} />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">
                          {stk.companyName || stk.name || '—'}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-emerald-300">
                        {stk.open != null ? `₹${stk.open.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      <td className="py-3 px-3 font-bold text-emerald-300">
                        {stk.low != null ? `₹${stk.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-100">
                        {stk.ltp != null ? `₹${stk.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      <td className={`py-3 px-3 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stk.changePercent != null ? (
                          <div className="flex items-center gap-0.5">
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {isPositive ? '+' : ''}{stk.changePercent}%
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {formatVolume(stk.volume)}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded text-xs font-mono font-bold border bg-emerald-950 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-950 inline-flex items-center gap-1">
                          OPEN = LOW
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChartStock(stk);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                            title={`View real technical chart for ${stk.symbol}`}
                          >
                            <LineChart className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleWatchlistToggle(e, stk.symbol)}
                            disabled={isPending}
                            className={`px-2 py-1 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition ${
                              isInWatchlist
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-500 hover:text-black hover:border-emerald-400'
                            }`}
                            title={isInWatchlist ? 'Click to remove from Watchlist' : 'Click to add to Watchlist'}
                          >
                            {isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                            ) : isInWatchlist ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="hidden sm:inline">In Watchlist</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3 h-3 text-slate-400" />
                                <span className="hidden sm:inline">Add</span>
                              </>
                            )}
                          </button>

                          {isInWatchlist && (
                            <button
                              onClick={(e) => handleWatchlistToggle(e, stk.symbol, 'remove')}
                              disabled={isPending}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                              title={`Remove ${stk.symbol} from Watchlist`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/stock/${stk.symbol}`)}
                            className="text-slate-400 group-hover:text-white p-1 rounded hover:bg-slate-700"
                            title="View Instrument Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={stk.symbol || idx}
                    onClick={() => navigate(`/stock/${stk.symbol}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        {stk.symbol || '—'}
                        {stk.conflicts && stk.conflicts.length > 0 && (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" title={stk.conflicts[0]} />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">
                        {stk.companyName || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-100">
                      {stk.ltp != null ? `₹${stk.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>

                    <td className={`py-3 px-3 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stk.changePercent != null ? (
                        <div className="flex items-center gap-0.5">
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : ''}{stk.changePercent}%
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {stk.rvol != null ? (
                        <span className={stk.rvol >= 1.5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {stk.rvol}x
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className={`py-3 px-3 ${isAboveVWAP ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stk.distanceFromVWAP != null ? `${isAboveVWAP ? '+' : ''}${stk.distanceFromVWAP}%` : '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {stk.rsi != null ? stk.rsi : 'N/A'}
                    </td>

                    <td className="py-3 px-3">
                      {stk.bullishScore != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${stk.bullishScore}%` }} />
                          </div>
                          <span className="text-emerald-400 font-semibold text-[11px]">{stk.bullishScore}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {stk.bearishScore != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-full" style={{ width: `${stk.bearishScore}%` }} />
                          </div>
                          <span className="text-rose-400 font-semibold text-[11px]">{stk.bearishScore}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {getSignalBadge(stk.signal, stk.score)}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Real Chart Modal Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChartStock(stk);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                          title={`View real technical chart for ${stk.symbol}`}
                        >
                          <LineChart className="w-3.5 h-3.5" />
                        </button>

                        {/* Watchlist Toggle Button */}
                        <button
                          onClick={(e) => handleWatchlistToggle(e, stk.symbol)}
                          disabled={isPending}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition ${
                            isInWatchlist
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-500 hover:text-black hover:border-emerald-400'
                          }`}
                          title={isInWatchlist ? 'Click to remove from Watchlist' : 'Click to add to Watchlist'}
                        >
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                          ) : isInWatchlist ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="hidden sm:inline">In Watchlist</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3 h-3 text-slate-400" />
                              <span className="hidden sm:inline">Add</span>
                            </>
                          )}
                        </button>

                        {isInWatchlist && (
                          <button
                            onClick={(e) => handleWatchlistToggle(e, stk.symbol, 'remove')}
                            disabled={isPending}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                            title={`Remove ${stk.symbol} from Watchlist`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/stock/${stk.symbol}`)}
                          className="text-slate-400 group-hover:text-white p-1 rounded hover:bg-slate-700"
                          title="View Instrument Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Chart Modal */}
      {selectedChartStock && (
        <StockChartModal
          symbol={selectedChartStock.symbol}
          stockSummary={selectedChartStock}
          isOpen={!!selectedChartStock}
          onClose={() => setSelectedChartStock(null)}
        />
      )}
    </div>
  );
}