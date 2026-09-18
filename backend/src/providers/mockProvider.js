const MarketDataProvider = require('./marketDataProvider');

// Default initial universe of Indian Market Symbols (NIFTY 50)
const INITIAL_STOCKS = [
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', sector: 'NIFTY METAL', basePrice: 3120.00, prevClose: 3080.00 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', sector: 'NIFTY INFRA', basePrice: 1460.00, prevClose: 1445.00 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.', sector: 'NIFTY HEALTHCARE', basePrice: 6980.00, prevClose: 6920.00 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', sector: 'NIFTY CONSUMPTION', basePrice: 2470.00, prevClose: 2450.00 },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', sector: 'NIFTY PRIVATE BANK', basePrice: 1180.00, prevClose: 1165.00 },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', sector: 'NIFTY AUTO', basePrice: 9650.00, prevClose: 9580.00 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'NIFTY FINANCIAL SERVICES', basePrice: 7120.00, prevClose: 7010.00 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd.', sector: 'NIFTY FINANCIAL SERVICES', basePrice: 1840.00, prevClose: 1825.00 },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd.', sector: 'NIFTY CAPITAL GOODS', basePrice: 295.00, prevClose: 290.00 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'NIFTY TELECOM', basePrice: 1540.00, prevClose: 1515.00 },
  { symbol: 'CIPLA', name: 'Cipla Ltd.', sector: 'NIFTY PHARMA', basePrice: 1580.00, prevClose: 1570.00 },
  { symbol: 'COALINDIA', name: 'Coal India Ltd.', sector: 'NIFTY METAL', basePrice: 490.00, prevClose: 483.00 },
  { symbol: 'DRREDDY', name: 'Dr. Reddy\'s Laboratories Ltd.', sector: 'NIFTY PHARMA', basePrice: 6650.00, prevClose: 6600.00 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', sector: 'NIFTY AUTO', basePrice: 4880.00, prevClose: 4820.00 },
  { symbol: 'ETERNAL', name: 'Eternal Ltd.', sector: 'NIFTY CONSUMPTION', basePrice: 323.50, prevClose: 320.00 },
  { symbol: 'GRASIM', name: 'Grasim Industries Ltd.', sector: 'NIFTY REALTY', basePrice: 2680.00, prevClose: 2650.00 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', sector: 'NIFTY IT', basePrice: 1780.00, prevClose: 1802.00 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'NIFTY BANK', basePrice: 1685.00, prevClose: 1660.00 },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co. Ltd.', sector: 'NIFTY FINANCIAL SERVICES', basePrice: 710.00, prevClose: 702.00 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', sector: 'NIFTY METAL', basePrice: 685.00, prevClose: 678.00 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'NIFTY FMCG', basePrice: 2420.00, prevClose: 2435.00 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'NIFTY BANK', basePrice: 1245.00, prevClose: 1222.00 },
  { symbol: 'ITC', name: 'ITC Ltd.', sector: 'NIFTY FMCG', basePrice: 485.00, prevClose: 482.00 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sector: 'NIFTY IT', basePrice: 1880.00, prevClose: 1910.00 },
  { symbol: 'INDIGO', name: 'InterGlobe Aviation Ltd.', sector: 'NIFTY SERVICES', basePrice: 4350.00, prevClose: 4300.00 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', sector: 'NIFTY METAL', basePrice: 940.00, prevClose: 930.00 },
  { symbol: 'JIOFIN', name: 'Jio Financial Services Ltd.', sector: 'NIFTY FINANCIAL SERVICES', basePrice: 345.00, prevClose: 340.00 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', sector: 'NIFTY PRIVATE BANK', basePrice: 1790.00, prevClose: 1775.00 },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'NIFTY INFRA', basePrice: 3620.00, prevClose: 3580.00 },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', sector: 'NIFTY AUTO', basePrice: 3120.00, prevClose: 3080.00 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', sector: 'NIFTY AUTO', basePrice: 12350.00, prevClose: 12200.00 },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Institute Ltd.', sector: 'NIFTY HEALTHCARE', basePrice: 920.00, prevClose: 908.00 },
  { symbol: 'NTPC', name: 'NTPC Ltd.', sector: 'NIFTY ENERGY', basePrice: 395.00, prevClose: 389.00 },
  { symbol: 'NESTLEIND', name: 'Nestle India Ltd.', sector: 'NIFTY FMCG', basePrice: 1380.00, prevClose: 1365.00 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp.', sector: 'NIFTY ENERGY', basePrice: 295.00, prevClose: 291.00 },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'NIFTY ENERGY', basePrice: 335.00, prevClose: 331.00 },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'NIFTY ENERGY', basePrice: 1420.50, prevClose: 1398.00 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co. Ltd.', sector: 'NIFTY FINANCIAL SERVICES', basePrice: 1820.00, prevClose: 1800.00 },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd.', sector: 'NIFTY FINANCIAL SERVICES', basePrice: 3180.00, prevClose: 3140.00 },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'NIFTY PSU BANK', basePrice: 840.00, prevClose: 825.00 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind.', sector: 'NIFTY PHARMA', basePrice: 1820.00, prevClose: 1805.00 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'NIFTY IT', basePrice: 4150.00, prevClose: 4185.00 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Ltd.', sector: 'NIFTY FMCG', basePrice: 1180.00, prevClose: 1165.00 },
  { symbol: 'TMPV', name: 'Tata Motors Passenger Vehicles Ltd.', sector: 'NIFTY AUTO', basePrice: 301.10, prevClose: 298.00 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'NIFTY METAL', basePrice: 154.00, prevClose: 151.50 },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', sector: 'NIFTY IT', basePrice: 1620.00, prevClose: 1642.00 },
  { symbol: 'TITAN', name: 'Titan Company Ltd.', sector: 'NIFTY CONSUMPTION', basePrice: 3450.00, prevClose: 3420.00 },
  { symbol: 'TRENT', name: 'Trent Ltd.', sector: 'NIFTY CONSUMPTION', basePrice: 7250.00, prevClose: 7180.00 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', sector: 'NIFTY REALTY', basePrice: 11200.00, prevClose: 11050.00 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'NIFTY IT', basePrice: 535.00, prevClose: 546.00 }
];

const INITIAL_INDICES = [
  { symbol: 'NIFTY 50', name: 'NIFTY 50 Index', basePrice: 25450.00, prevClose: 25215.00 },
  { symbol: 'BANK NIFTY', name: 'NIFTY Bank Index', basePrice: 53200.00, prevClose: 52490.00 },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', basePrice: 24300.00, prevClose: 24120.00 },
  { symbol: 'MIDCAP', name: 'NIFTY Midcap 100', basePrice: 59100.00, prevClose: 58800.00 },
  { symbol: 'SMALLCAP', name: 'NIFTY Smallcap 100', basePrice: 19200.00, prevClose: 19110.00 },
  { symbol: 'INDIA VIX', name: 'India Volatility Index', basePrice: 13.25, prevClose: 13.55 }
];

class MockProvider extends MarketDataProvider {
  constructor() {
    super('MockProvider');
    this.instruments = new Map();
    this.subscribers = new Set();
    this.timer = null;

    this.initializeState();
    this.startTickSimulator();
  }

  initializeState() {
    // Populate indices
    INITIAL_INDICES.forEach((idx) => {
      this.instruments.set(idx.symbol, {
        symbol: idx.symbol,
        name: idx.name,
        exchange: 'NSE',
        isIndex: true,
        ltp: idx.basePrice,
        open: Number((idx.prevClose * (1 + (Math.random() * 0.004 - 0.001))).toFixed(2)),
        high: Number((idx.basePrice * 1.008).toFixed(2)),
        low: Number((idx.basePrice * 0.994).toFixed(2)),
        previousClose: idx.prevClose,
        change: Number((idx.basePrice - idx.prevClose).toFixed(2)),
        changePercent: Number((((idx.basePrice - idx.prevClose) / idx.prevClose) * 100).toFixed(2)),
        volume: 0,
        averagePrice: idx.basePrice,
        bidQuantity: 0,
        askQuantity: 0,
        timestamp: Date.now(),
        source: 'mock',
        isLive: true
      });
    });

    // Populate stocks
    INITIAL_STOCKS.forEach((stk) => {
      const openPrice = Number((stk.prevClose * (1 + (Math.random() * 0.006 - 0.002))).toFixed(2));
      const highPrice = Number((Math.max(stk.basePrice, openPrice) * (1 + Math.random() * 0.005)).toFixed(2));
      const lowPrice = Number((Math.min(stk.basePrice, openPrice) * (1 - Math.random() * 0.005)).toFixed(2));
      const vol = Math.floor(1000000 + Math.random() * 5000000);

      this.instruments.set(stk.symbol, {
        symbol: stk.symbol,
        name: stk.name,
        sector: stk.sector,
        exchange: 'NSE',
        isIndex: false,
        ltp: stk.basePrice,
        open: openPrice,
        high: highPrice,
        low: lowPrice,
        previousClose: stk.prevClose,
        change: Number((stk.basePrice - stk.prevClose).toFixed(2)),
        changePercent: Number((((stk.basePrice - stk.prevClose) / stk.prevClose) * 100).toFixed(2)),
        volume: vol,
        averagePrice: Number(((stk.basePrice + openPrice + highPrice + lowPrice) / 4).toFixed(2)),
        bidQuantity: Math.floor(5000 + Math.random() * 15000),
        askQuantity: Math.floor(4000 + Math.random() * 12000),
        vwap: Number((stk.basePrice * 0.996).toFixed(2)),
        '52WeekHigh': Number((stk.basePrice * 1.25).toFixed(2)),
        '52WeekLow': Number((stk.basePrice * 0.8).toFixed(2)),
        timestamp: Date.now(),
        source: 'mock',
        isLive: true
      });
    });
  }

  startTickSimulator() {
    this.timer = setInterval(() => {
      const now = Date.now();
      this.instruments.forEach((inst) => {
        // Random drift -0.15% to +0.18%
        const deltaPct = (Math.random() * 0.0033 - 0.0015);
        let newLtp = Number((inst.ltp * (1 + deltaPct)).toFixed(2));
        if (inst.symbol === 'INDIA VIX') {
          // VIX has small absolute changes
          newLtp = Number(Math.max(8.0, inst.ltp + (Math.random() * 0.2 - 0.1)).toFixed(2));
        }

        inst.ltp = newLtp;
        if (newLtp > inst.high) inst.high = newLtp;
        if (newLtp < inst.low) inst.low = newLtp;
        inst.change = Number((newLtp - inst.previousClose).toFixed(2));
        inst.changePercent = Number((((newLtp - inst.previousClose) / inst.previousClose) * 100).toFixed(2));
        if (!inst.isIndex) {
          inst.volume += Math.floor(Math.random() * 500);
        }
        inst.timestamp = now;
      });

      // Notify subscribers
      this.subscribers.forEach((callback) => {
        try {
          callback(Array.from(this.instruments.values()));
        } catch (e) {
          console.error('Error in mock tick callback:', e.message);
        }
      });
    }, 1500);
  }

  async getQuote(symbol) {
    const inst = this.instruments.get(symbol.toUpperCase());
    if (!inst) {
      throw new Error(`Symbol ${symbol} not found in mock market universe`);
    }
    return { ...inst };
  }

  async getQuotes(symbols) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return Array.from(this.instruments.values());
    }
    return symbols
      .map((s) => this.instruments.get(s.toUpperCase()))
      .filter(Boolean);
  }

  async getHistoricalCandles(symbol, timeframe = '5m', count = 60) {
    const inst = await this.getQuote(symbol);
    const candles = [];
    const now = Date.now();

    let timeframeMinutes = 5;
    if (timeframe === '1m') timeframeMinutes = 1;
    if (timeframe === '3m') timeframeMinutes = 3;
    if (timeframe === '15m') timeframeMinutes = 15;
    if (timeframe === '30m') timeframeMinutes = 30;

    const stepMs = timeframeMinutes * 60 * 1000;
    let price = inst.open;

    for (let i = count; i >= 0; i--) {
      const time = now - i * stepMs;
      const movePct = (Math.random() * 0.01 - 0.0048);
      const close = Number((price * (1 + movePct)).toFixed(2));
      const high = Number((Math.max(price, close) * (1 + Math.random() * 0.002)).toFixed(2));
      const low = Number((Math.min(price, close) * (1 - Math.random() * 0.002)).toFixed(2));
      const vol = inst.isIndex ? 0 : Math.floor(10000 + Math.random() * 90000);

      candles.push({
        timestamp: time,
        open: price,
        high,
        low,
        close,
        volume: vol
      });

      price = close;
    }

    // Force the last candle close to match current LTP
    if (candles.length > 0) {
      candles[candles.length - 1].close = inst.ltp;
      candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, inst.ltp);
      candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, inst.ltp);
    }

    return candles;
  }

  async getMarketDepth(symbol) {
    const inst = await this.getQuote(symbol);
    const ltp = inst.ltp;

    const bids = [
      { price: Number((ltp - 0.10).toFixed(2)), quantity: Math.floor(100 + Math.random() * 500), orders: Math.floor(1 + Math.random() * 5) },
      { price: Number((ltp - 0.20).toFixed(2)), quantity: Math.floor(200 + Math.random() * 800), orders: Math.floor(2 + Math.random() * 8) },
      { price: Number((ltp - 0.35).toFixed(2)), quantity: Math.floor(500 + Math.random() * 1200), orders: Math.floor(5 + Math.random() * 12) },
      { price: Number((ltp - 0.50).toFixed(2)), quantity: Math.floor(800 + Math.random() * 1500), orders: Math.floor(8 + Math.random() * 15) },
      { price: Number((ltp - 0.75).toFixed(2)), quantity: Math.floor(1200 + Math.random() * 2000), orders: Math.floor(10 + Math.random() * 20) }
    ];

    const asks = [
      { price: Number((ltp + 0.10).toFixed(2)), quantity: Math.floor(120 + Math.random() * 600), orders: Math.floor(1 + Math.random() * 5) },
      { price: Number((ltp + 0.25).toFixed(2)), quantity: Math.floor(250 + Math.random() * 700), orders: Math.floor(3 + Math.random() * 7) },
      { price: Number((ltp + 0.40).toFixed(2)), quantity: Math.floor(450 + Math.random() * 1100), orders: Math.floor(4 + Math.random() * 10) },
      { price: Number((ltp + 0.60).toFixed(2)), quantity: Math.floor(900 + Math.random() * 1600), orders: Math.floor(7 + Math.random() * 14) },
      { price: Number((ltp + 0.85).toFixed(2)), quantity: Math.floor(1300 + Math.random() * 2200), orders: Math.floor(12 + Math.random() * 25) }
    ];

    return { symbol: inst.symbol, bids, asks };
  }

  subscribeToMarketData(symbols, callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  unsubscribeFromMarketData(symbols, callback) {
    if (callback) {
      this.subscribers.delete(callback);
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
  }
}

module.exports = MockProvider;
