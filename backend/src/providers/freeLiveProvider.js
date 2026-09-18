const MarketDataProvider = require('./marketDataProvider');
const axios = require('axios');

const SYMBOL_MAP = {
  'NIFTY 50': '^NSEI',
  'BANK NIFTY': '^NSEBANK',
  'FINNIFTY': 'NIFTY_FIN_SERVICE.NS',
  'MIDCAP': 'NIFTY_MIDCAP_100.NS',
  'SMALLCAP': 'NIFTY_SMALLCAP_100.NS',
  'INDIA VIX': '^INDIAVIX',
  'ADANIENT': 'ADANIENT.NS',
  'ADANIPORTS': 'ADANIPORTS.NS',
  'APOLLOHOSP': 'APOLLOHOSP.NS',
  'ASIANPAINT': 'ASIANPAINT.NS',
  'AXISBANK': 'AXISBANK.NS',
  'BAJAJ-AUTO': 'BAJAJ-AUTO.NS',
  'BAJFINANCE': 'BAJFINANCE.NS',
  'BAJAJFINSV': 'BAJAJFINSV.NS',
  'BEL': 'BEL.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'CIPLA': 'CIPLA.NS',
  'COALINDIA': 'COALINDIA.NS',
  'DRREDDY': 'DRREDDY.NS',
  'EICHERMOT': 'EICHERMOT.NS',
  'ETERNAL': 'ETERNAL.NS',
  'GRASIM': 'GRASIM.NS',
  'HCLTECH': 'HCLTECH.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'HDFCLIFE': 'HDFCLIFE.NS',
  'HINDALCO': 'HINDALCO.NS',
  'HINDUNILVR': 'HINDUNILVR.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'ITC': 'ITC.NS',
  'INFY': 'INFY.NS',
  'INDIGO': 'INDIGO.NS',
  'JSWSTEEL': 'JSWSTEEL.NS',
  'JIOFIN': 'JIOFIN.NS',
  'KOTAKBANK': 'KOTAKBANK.NS',
  'LT': 'LT.NS',
  'M&M': 'M&M.NS',
  'MARUTI': 'MARUTI.NS',
  'MAXHEALTH': 'MAXHEALTH.NS',
  'NTPC': 'NTPC.NS',
  'NESTLEIND': 'NESTLEIND.NS',
  'ONGC': 'ONGC.NS',
  'POWERGRID': 'POWERGRID.NS',
  'RELIANCE': 'RELIANCE.NS',
  'SBILIFE': 'SBILIFE.NS',
  'SHRIRAMFIN': 'SHRIRAMFIN.NS',
  'SBIN': 'SBIN.NS',
  'SUNPHARMA': 'SUNPHARMA.NS',
  'TCS': 'TCS.NS',
  'TATACONSUM': 'TATACONSUM.NS',
  'TMPV': 'TMPV.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'TECHM': 'TECHM.NS',
  'TITAN': 'TITAN.NS',
  'TRENT': 'TRENT.NS',
  'ULTRACEMCO': 'ULTRACEMCO.NS',
  'WIPRO': 'WIPRO.NS'
};

const SECTOR_LOOKUP = {
  'ADANIENT': 'NIFTY METAL',
  'ADANIPORTS': 'NIFTY INFRA',
  'APOLLOHOSP': 'NIFTY HEALTHCARE',
  'ASIANPAINT': 'NIFTY CONSUMPTION',
  'AXISBANK': 'NIFTY PRIVATE BANK',
  'BAJAJ-AUTO': 'NIFTY AUTO',
  'BAJFINANCE': 'NIFTY FINANCIAL SERVICES',
  'BAJAJFINSV': 'NIFTY FINANCIAL SERVICES',
  'BEL': 'NIFTY CAPITAL GOODS',
  'BHARTIARTL': 'NIFTY TELECOM',
  'CIPLA': 'NIFTY PHARMA',
  'COALINDIA': 'NIFTY METAL',
  'DRREDDY': 'NIFTY PHARMA',
  'EICHERMOT': 'NIFTY AUTO',
  'ETERNAL': 'NIFTY CONSUMPTION',
  'GRASIM': 'NIFTY REALTY',
  'HCLTECH': 'NIFTY IT',
  'HDFCBANK': 'NIFTY BANK',
  'HDFCLIFE': 'NIFTY FINANCIAL SERVICES',
  'HINDALCO': 'NIFTY METAL',
  'HINDUNILVR': 'NIFTY FMCG',
  'ICICIBANK': 'NIFTY BANK',
  'ITC': 'NIFTY FMCG',
  'INFY': 'NIFTY IT',
  'INDIGO': 'NIFTY SERVICES',
  'JSWSTEEL': 'NIFTY METAL',
  'JIOFIN': 'NIFTY FINANCIAL SERVICES',
  'KOTAKBANK': 'NIFTY PRIVATE BANK',
  'LT': 'NIFTY INFRA',
  'M&M': 'NIFTY AUTO',
  'MARUTI': 'NIFTY AUTO',
  'MAXHEALTH': 'NIFTY HEALTHCARE',
  'NTPC': 'NIFTY ENERGY',
  'NESTLEIND': 'NIFTY FMCG',
  'ONGC': 'NIFTY ENERGY',
  'POWERGRID': 'NIFTY ENERGY',
  'RELIANCE': 'NIFTY ENERGY',
  'SBILIFE': 'NIFTY FINANCIAL SERVICES',
  'SHRIRAMFIN': 'NIFTY FINANCIAL SERVICES',
  'SBIN': 'NIFTY PSU BANK',
  'SUNPHARMA': 'NIFTY PHARMA',
  'TCS': 'NIFTY IT',
  'TATACONSUM': 'NIFTY FMCG',
  'TMPV': 'NIFTY AUTO',
  'TATASTEEL': 'NIFTY METAL',
  'TECHM': 'NIFTY IT',
  'TITAN': 'NIFTY CONSUMPTION',
  'TRENT': 'NIFTY CONSUMPTION',
  'ULTRACEMCO': 'NIFTY REALTY',
  'WIPRO': 'NIFTY IT'
};

class FreeLiveProvider extends MarketDataProvider {
  constructor() {
    super('FreeLiveProvider');
    this.instruments = new Map();
    this.subscribers = new Set();
    this.timer = null;

    const stockCount = Object.keys(SYMBOL_MAP).filter((s) => !s.includes('NIFTY') && !s.includes('CAP') && !s.includes('VIX')).length;
    console.log(`[FreeLiveProvider] Initialized live feed for ${stockCount} NIFTY stocks`);

    this.startLiveFeed();
  }

  async fetchSymbolQuote(displaySymbol) {
    const yahooSymbol = SYMBOL_MAP[displaySymbol] || `${displaySymbol}.NS`;
    const isIndex = displaySymbol.includes('NIFTY') || displaySymbol.includes('CAP') || displaySymbol.includes('VIX');

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=5m&range=1d`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 4000
      });

      const result = res.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const ltp = Number(meta.regularMarketPrice.toFixed(2));
      const prevClose = Number(meta.chartPreviousClose.toFixed(2));
      const change = Number((ltp - prevClose).toFixed(2));
      const changePercent = Number((((ltp - prevClose) / prevClose) * 100).toFixed(2));
      const openPrice = meta.regularMarketOpen ?? meta.chartPreviousClose ?? ltp;
      const high = Number(((meta.regularMarketDayHigh ?? meta.dayHigh) || ltp * 1.005).toFixed(2));
      const low = Number(((meta.regularMarketDayLow ?? meta.dayLow) || ltp * 0.995).toFixed(2));
      const volume = meta.regularMarketVolume || 1000000;

      const inst = {
        symbol: displaySymbol,
        name: meta.shortName || displaySymbol,
        sector: SECTOR_LOOKUP[displaySymbol] || 'NSE Liquid',
        exchange: 'NSE',
        isIndex,
        ltp,
        open: Number(openPrice.toFixed(2)),
        high,
        low,
        previousClose: prevClose,
        change,
        changePercent,
        volume,
        averagePrice: Number(((high + low + ltp) / 3).toFixed(2)),
        bidQuantity: 1000,
        askQuantity: 1000,
        vwap: Number(((high + low + ltp) / 3).toFixed(2)),
        '52WeekHigh': Number((meta.fiftyTwoWeekHigh || ltp * 1.2).toFixed(2)),
        '52WeekLow': Number((meta.fiftyTwoWeekLow || ltp * 0.8).toFixed(2)),
        timestamp: Date.now(),
        source: 'yahoo_free_live',
        isLive: true
      };

      this.instruments.set(displaySymbol, inst);
      return inst;
    } catch (e) {
      // Fallback synthetic if offline
      return null;
    }
  }

  async refreshAllQuotes() {
    const symbols = Object.keys(SYMBOL_MAP);
    await Promise.all(symbols.map((sym) => this.fetchSymbolQuote(sym)));

    this.subscribers.forEach((cb) => {
      try {
        cb(Array.from(this.instruments.values()));
      } catch (err) {
        console.error(err);
      }
    });
  }

  startLiveFeed() {
    this.refreshAllQuotes();
    // Refresh live free quotes every 5 seconds
    this.timer = setInterval(() => {
      this.refreshAllQuotes();
    }, 5000);
  }

  async getQuote(symbol) {
    const symUpper = symbol.toUpperCase();
    let inst = this.instruments.get(symUpper);
    if (!inst) {
      inst = await this.fetchSymbolQuote(symUpper);
    }
    if (!inst) throw new Error(`Symbol ${symbol} unavailable in free live feed`);
    return { ...inst };
  }

  async getQuotes(symbols) {
    if (this.instruments.size === 0) {
      await this.refreshAllQuotes();
    }
    const all = Array.from(this.instruments.values());
    if (!Array.isArray(symbols) || symbols.length === 0) return all;
    return symbols.map((s) => this.instruments.get(s.toUpperCase())).filter(Boolean);
  }

  async getHistoricalCandles(symbol, timeframe = '5m', count = 60) {
    const yahooSymbol = SYMBOL_MAP[symbol.toUpperCase()] || `${symbol.toUpperCase()}.NS`;
    let interval = '5m';
    if (timeframe === '1m') interval = '1m';
    if (timeframe === '15m') interval = '15m';
    if (timeframe === '30m') interval = '30m';

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${interval}&range=5d`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 5000
      });

      const result = res.data?.chart?.result?.[0];
      if (!result) return [];

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const { open = [], high = [], low = [], close = [], volume = [] } = quote;

      const candles = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (close[i] !== null && close[i] !== undefined) {
          candles.push({
            timestamp: timestamps[i] * 1000,
            open: Number((open[i] || close[i]).toFixed(2)),
            high: Number((high[i] || close[i]).toFixed(2)),
            low: Number((low[i] || close[i]).toFixed(2)),
            close: Number(close[i].toFixed(2)),
            volume: volume[i] || 10000
          });
        }
      }

      return candles.slice(-count);
    } catch (e) {
      console.error(`Error fetching historical candles for ${symbol}:`, e.message);
      return [];
    }
  }

  async getMarketDepth(symbol) {
    const inst = await this.getQuote(symbol);
    const ltp = inst.ltp;
    return {
      symbol: inst.symbol,
      isSynthetic: true,
      bids: [
        { price: Number((ltp - 0.15).toFixed(2)), quantity: 500, orders: 4 },
        { price: Number((ltp - 0.30).toFixed(2)), quantity: 1200, orders: 8 }
      ],
      asks: [
        { price: Number((ltp + 0.15).toFixed(2)), quantity: 600, orders: 5 },
        { price: Number((ltp + 0.35).toFixed(2)), quantity: 1400, orders: 10 }
      ]
    };
  }

  subscribeToMarketData(symbols, callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  unsubscribeFromMarketData(symbols, callback) {
    if (callback) this.subscribers.delete(callback);
  }
}

module.exports = FreeLiveProvider;
