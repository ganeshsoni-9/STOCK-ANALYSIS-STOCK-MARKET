# TradeSense AI — Indian Intraday Market Scanner

> **Educational and Research-Oriented Intraday Stock Market Analysis Platform**

TradeSense AI is a full-stack, production-quality Indian stock market analysis application designed to evaluate live and intraday market feed parameters to classify overall market regime:
- 🟢 **STRONG BULLISH / BULLISH** (Score: 55 – 100)
- 🟡 **NEUTRAL** (Score: 46 – 54)
- 🔴 **BEARISH / STRONG BEARISH** (Score: 0 – 45)

The platform evaluates liquid National Stock Exchange (NSE) stocks, primary indices (**NIFTY 50**, **BANK NIFTY**, **FINNIFTY**, **INDIA VIX**), market breadth, and sector strength using multi-factor technical algorithms without black-box promises or price prediction claims.

---

## ⚠️ Important Legal Disclaimer

> TradeSense AI is an educational and research-oriented market analysis platform. It does not provide guaranteed predictions, financial advice, investment advice, or guaranteed trading signals. Market conditions can change rapidly. Users are responsible for their own decisions.

---

## Key Features

- **Market Regime Engine**: Weighted 0–100 score incorporating Index Trend (20%), Market Breadth (20%), Sector Performance (15%), Volume Confirmation (15%), Price Momentum (10%), VWAP Position (10%), RSI (5%), and Moving Average Alignment (5%).
- **Multi-Factor Stock Scanner**: Intraday scanner for liquid NSE stocks with composite Bullish & Bearish scores, Relative Volume (RVOL), VWAP distance %, and RSI/MACD indicators.
- **Provider Abstraction Architecture**: Decoupled market feed engine supporting `MockProvider` (high-fidelity synthetic tick simulator for testing), `AngelOneProvider` (SmartAPI), and `UpstoxProvider`.
- **Opening Range Analysis**: 09:15–09:30 IST Opening Range High (ORH) and Opening Range Low (ORL) breakout/breakdown detection.
- **Multi-Timeframe Confirmation**: 5-minute primary intraday analysis supported by 15-minute timeframe confirmation and conflict warnings (`COUNTER-TREND`, `TIMEFRAME CONFLICT`, `MARKET DIVERGENCE`).
- **Educational Reference Levels**: ATR-based risk/reward reference levels (Entry, Stop Loss, Target) with explicit educational safety disclaimers.
- **Real-Time WebSockets**: Socket.IO integration broadcasting tick updates every 1-2 seconds without page refresh.
- **Dark Trading Terminal UI**: Dark-mode glassmorphic interface built with Vite, React, Tailwind CSS, and Recharts.

---

## Architecture Flow

```
[ Market Feed (Mock / Angel One / Upstox API) ]
                         │
                         ▼
        [ Market Data Provider Abstraction Layer ]
                         │
                         ▼
             [ Technical Indicator Engine ]
     (SMA, EMA, RSI, MACD, VWAP, ATR, Bollinger, Vol)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Market Regime Engine ]       [ Bullish & Bearish Engines ]
 (Weighted Score 0-100)           (Stock Scoring 0-100)
        │                                 │
        └────────────────┬────────────────┘
                         ▼
               [ Signal Engine ]
    (Multi-timeframe, Conflicts, Risk Levels)
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
 [ REST API Endpoints ]         [ Socket.IO Real-time ]
         │                               │
         └───────────────┬───────────────┘
                         ▼
       [ React Dark Trading Terminal Dashboard ]
```

---

## Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router v7, Recharts, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express.js, Socket.IO, MongoDB & Mongoose, Axios, Helmet, CORS, Express-Rate-Limit.
- **Testing**: Node.js native test runner (`node --test`).

---

## Environment Variables Configuration

Create `.env` in `backend/`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/tradesense_ai
JWT_SECRET=tradesense_super_secret_jwt_key_2026
MARKET_DATA_MODE=mock
BROKER_PROVIDER=mock

# Angel One Smart API Credentials (Optional)
ANGEL_API_KEY=
ANGEL_CLIENT_ID=
ANGEL_PASSWORD=
ANGEL_TOTP_SECRET=

# Upstox API v2 Credentials (Optional)
UPSTOX_CLIENT_ID=
UPSTOX_CLIENT_SECRET=
UPSTOX_ACCESS_TOKEN=

CLIENT_URL=http://localhost:5173
```

Create `.env` in `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Run Unit Tests
```bash
npm test
```

### 3. Run Development Servers (Backend + Frontend concurrently)
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api`
- **Developer Diagnostics**: `http://localhost:5173/debug`
