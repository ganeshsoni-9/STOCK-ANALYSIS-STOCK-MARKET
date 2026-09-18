import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, Lock, Mail, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [identifierType, setIdentifierType] = useState('email'); // 'email' | 'mobile'
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fromPath = location.state?.from?.pathname || '/watchlist';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let payload = {
        identifierType,
        password
      };

      if (identifierType === 'email') {
        if (!email.trim()) {
          setErrorMsg('Please enter a valid email address.');
          setLoading(false);
          return;
        }
        payload.email = email.trim();
      } else {
        if (!mobile.trim()) {
          setErrorMsg('Please enter a valid 10-digit mobile number.');
          setLoading(false);
          return;
        }
        payload.mobile = mobile.trim();
      }

      let res;
      if (mode === 'login') {
        res = await authApi.login(payload);
      } else {
        res = await authApi.signup(payload);
      }

      if (res && res.success && res.token) {
        // Save JWT token and user info
        localStorage.setItem('token', res.token);
        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }

        // Navigate to target path or watchlist
        navigate(fromPath, { replace: true });
      } else {
        setErrorMsg(res?.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('[Auth Error]', err.message);
      const cleanMessage = err.message ? err.message.replace(/^API Error:\s*/, '') : 'Authentication request failed.';
      setErrorMsg(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full glass-card p-6 md:p-8 space-y-6 border border-slate-800 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-600 font-black text-black text-2xl shadow-lg shadow-emerald-500/20 mb-2">
            T
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            TradeSense <span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            {mode === 'login' ? 'Sign in to access your Watchlist & Market Alerts' : 'Create an account to begin technical tracking'}
          </p>
        </div>

        {/* Tab Switcher: Login / Signup */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-md font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'login'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 rounded-md font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register
          </button>
        </div>

        {/* Identifier Mode Switcher (Email vs Mobile) */}
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
          <span className="text-[11px] uppercase tracking-wider">Auth via:</span>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
            <input
              type="radio"
              name="identifierType"
              value="email"
              checked={identifierType === 'email'}
              onChange={() => setIdentifierType('email')}
              className="accent-emerald-500"
            />
            <span>Email</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
            <input
              type="radio"
              name="identifierType"
              value="mobile"
              checked={identifierType === 'mobile'}
              onChange={() => setIdentifierType('mobile')}
              className="accent-emerald-500"
            />
            <span>Mobile</span>
          </label>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 font-mono flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {identifierType === 'email' ? (
            <div>
              <label className="text-[11px] font-mono text-slate-300 uppercase block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@tradesense.ai"
                  className="w-full bg-slate-900 border border-slate-700/90 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-mono text-slate-300 uppercase block mb-1.5">
                10-Digit Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-900 border border-slate-700/90 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono text-slate-300 uppercase block mb-1.5">
              Password {mode === 'signup' && <span className="text-slate-400 font-sans text-[10px]">(Min 8 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700/90 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                required
                minLength={mode === 'signup' ? 8 : 1}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-black font-bold rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In to TradeSense'
              : 'Create Trader Account'}
          </button>
        </form>

        <div className="text-center font-mono text-[11px] text-slate-500">
          Educational & Intraday Stock Analytics Gateway
        </div>
      </div>
    </div>
  );
}
