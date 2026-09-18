import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Activity, Cpu, Sliders, Bell, Bookmark, LayoutDashboard, Radio, LogIn, LogOut } from 'lucide-react';

const POPULAR_SYMBOLS = ['RELIANCE', 'HDFCBANK', 'TCS', 'ICICIBANK', 'SBIN', 'INFY', 'BAJFINANCE', 'TATAMOTORS'];

export default function Navbar({ isConnected = true, lastUpdated }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [istTime, setIstTime] = useState('');

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token && token !== 'null' && token !== 'undefined';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // IST Clock
  useEffect(() => {
    const updateClock = () => {
      const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
      setIstTime(new Intl.DateTimeFormat('en-US', options).format(new Date()));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const q = searchQuery.toUpperCase();
      const filtered = POPULAR_SYMBOLS.filter((s) => s.includes(q));
      setSuggestions(filtered);
      setShowSuggestions(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSymbol = (symbol) => {
    setSearchQuery('');
    setShowSuggestions(false);
    navigate(`/stock/${symbol}`);
  };

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Market', path: '/market', icon: Activity },
    { label: 'Stock Scanner', path: '/scanner', icon: Cpu },
    { label: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { label: 'Alerts', path: '/alerts', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Sliders }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Connection Status */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg shadow-emerald-500/20">
  <img
    src="https://static.vecteezy.com/system/resources/thumbnails/079/859/474/small/buy-and-sell-buttons-with-bull-and-bear-on-stock-market-chart-on-a-transparent-background-png.png"
    alt="Bull Bear Stock Market"
    className="w-full h-full object-cover"
  />
</div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                SONI TRADESENSE FOR STOCKS <span className="text-emerald-400"></span>
              </span>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase leading-none">
                Indian Market Scanner
              </div>
            </div>
          </Link>

          {/* Connection & Clock Badge */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${isConnected ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/60 border-rose-500/40 text-rose-400'}`}>
              <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
              {isConnected ? '● LIVE' : 'DISCONNECTED'}
            </span>
            <span className="text-slate-400 hidden sm:inline bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              IST: <strong className="text-slate-200">{istTime || '10:00:00'}</strong>
            </span>
          </div>
        </div>

        {/* Global Stock Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              placeholder="Search Indian stocks (e.g. RELIANCE, TCS, HDFCBANK)..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-slate-800">
              {suggestions.map((sym) => (
                <div
                  key={sym}
                  onClick={() => handleSelectSymbol(sym)}
                  className="px-4 py-2 text-xs font-mono text-slate-200 hover:bg-slate-800 hover:text-emerald-400 cursor-pointer flex items-center justify-between"
                >
                  <span>{sym}</span>
                  <span className="text-[10px] text-slate-500 font-sans">View Technical Analysis</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Tabs & Auth */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 transition flex items-center gap-1.5 shrink-0 ml-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition flex items-center gap-1.5 shrink-0 ml-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
