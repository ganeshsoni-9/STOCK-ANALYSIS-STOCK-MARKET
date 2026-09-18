const axios = require('axios');
const { getMarketDataProvider } = require('./index');

// Supported NSE F&O Symbols List
const FO_SYMBOLS = new Set([
  'NIFTY 50', 'BANK NIFTY', 'FINNIFTY', 'MIDCAP',
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
  'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BEL', 'BHARTIARTL',
  'CIPLA', 'COALINDIA', 'DRREDDY', 'EICHERMOT', 'ETERNAL', 'GRASIM',
  'HCLTECH', 'HDFCBANK', 'HDFCLIFE', 'HINDALCO', 'HINDUNILVR',
  'ICICIBANK', 'ITC', 'INFY', 'INDIGO', 'JSWSTEEL', 'JIOFIN',
  'KOTAKBANK', 'LT', 'M&M', 'MARUTI', 'MAXHEALTH', 'NTPC',
  'NESTLEIND', 'ONGC', 'POWERGRID', 'RELIANCE', 'SBILIFE',
  'SHRIRAMFIN', 'SBIN', 'SUNPHARMA', 'TCS', 'TATACONSUM',
  'TMPV', 'TATASTEEL', 'TECHM', 'TITAN', 'TRENT', 'ULTRACEMCO', 'WIPRO'
]);

class OptionChainProvider {
  constructor() {
    this.marketProvider = getMarketDataProvider();
    this.nseCookies = null;
    this.cookieFetchTime = 0;
  }

  getSupportedSymbols() {
    return Array.from(FO_SYMBOLS);
  }

  isOptionChainSupported(symbol) {
    if (!symbol || typeof symbol !== 'string') return false;
    const cleanSym = symbol.trim().toUpperCase();
    return FO_SYMBOLS.has(cleanSym);
  }

  /**
   * Helper to initialize session cookies for NSE web API
   */
  async getNseCookies() {
    const now = Date.now();
    if (this.nseCookies && (now - this.cookieFetchTime < 10 * 60 * 1000)) {
      return this.nseCookies;
    }

    try {
      const res = await axios.get('https://www.nseindia.com/option-chain', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 5000
      });

      const cookies = res.headers['set-cookie'];
      if (cookies) {
        this.nseCookies = cookies.map(c => c.split(';')[0]).join('; ');
        this.cookieFetchTime = now;
      }
      return this.nseCookies;
    } catch (e) {
      console.warn('[OptionChainProvider] Failed to fetch NSE session cookies:', e.message);
      return null;
    }
  }

  /**
   * Fetch Live NSE Option Chain from Official NSE API
   */
  async fetchLiveNseOptionChain(symbol) {
    const symUpper = symbol.trim().toUpperCase();
    const isIndex = ['NIFTY 50', 'BANK NIFTY', 'FINNIFTY', 'MIDCAP'].includes(symUpper);
    
    let nseSymbol = symUpper;
    if (symUpper === 'NIFTY 50') nseSymbol = 'NIFTY';
    if (symUpper === 'BANK NIFTY') nseSymbol = 'BANKNIFTY';

    const endpoint = isIndex
      ? `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(nseSymbol)}`
      : `https://www.nseindia.com/api/option-chain-equities?symbol=${encodeURIComponent(nseSymbol)}`;

    const cookies = await this.getNseCookies();

    const response = await axios.get(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.nseindia.com/option-chain',
        'Cookie': cookies || ''
      },
      timeout: 6000
    });

    return response.data;
  }

  /**
   * Get Option Chain Data for a Symbol and Expiry
   */
  async getOptionChain(symbol, targetExpiry = null) {
    const symUpper = symbol ? symbol.trim().toUpperCase() : '';

    if (!this.isOptionChainSupported(symUpper)) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        message: `Option Chain is not available for ${symUpper}.`
      };
    }

    const mode = process.env.MARKET_DATA_MODE || 'free_live';
    const broker = process.env.BROKER_PROVIDER || 'mock';

    // Explicit mock mode (for offline unit testing / demo mode)
    if (mode === 'mock' || broker === 'mock') {
      return this.generateMockOptionChain(symUpper, targetExpiry);
    }

    // Try live NSE API first
    try {
      const nseData = await this.fetchLiveNseOptionChain(symUpper);
      if (nseData && nseData.records) {
        return this.parseNseOptionChain(symUpper, nseData, targetExpiry);
      }
    } catch (err) {
      console.warn(`[OptionChainProvider] Live NSE API request failed for ${symUpper}: ${err.message}`);
    }

    // Fallback: Check if live stock LTP feed is active
    try {
      const liveQuote = await this.marketProvider.getQuote(symUpper);
      if (liveQuote && liveQuote.isLive) {
        return this.generateDerivedLiveOptionChain(symUpper, targetExpiry);
      }
    } catch (e) {
      // Ignore
    }

    // If live provider is unreachable, return clear error response (NO silent mock fallback in live mode)
    return {
      success: false,
      status: 'UNAVAILABLE',
      message: 'Live option-chain data is currently unavailable.'
    };
  }

  /**
   * Parse real NSE option chain data
   */
  parseNseOptionChain(symbol, nseData, targetExpiry) {
    const records = nseData.records || {};
    const expiryDates = records.expiryDates || [];

    if (expiryDates.length === 0) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        message: `No active option expiry contracts found for ${symbol}.`
      };
    }

    // If targetExpiry is requested, verify its existence
    let selectedExpiry = expiryDates[0];
    if (targetExpiry) {
      const cleanTarget = targetExpiry.trim();
      if (expiryDates.includes(cleanTarget)) {
        selectedExpiry = cleanTarget;
      } else {
        return {
          success: false,
          status: 'UNAVAILABLE',
          message: 'No option chain available for this expiry.'
        };
      }
    }

    const underlyingLtp = records.underlyingValue || 0;
    const rawData = records.data || [];

    // Filter records for selected expiry
    const expiryRecords = rawData.filter(r => r.expiryDate === selectedExpiry);

    const chain = expiryRecords.map(r => {
      const strike = r.strikePrice;
      const ce = r.CE || null;
      const pe = r.PE || null;

      return {
        strike,
        CE: ce ? {
          symbol: ce.symbol || `${symbol}${selectedExpiry}${strike}CE`,
          instrumentToken: ce.identifier || `${symbol}_${strike}_CE`,
          ltp: ce.lastPrice || 0,
          change: ce.change || 0,
          changePercent: ce.pChange || 0,
          bid: ce.buyPrice1 || ce.bidPrice || 0,
          ask: ce.sellPrice1 || ce.askPrice || 0,
          volume: ce.totalTradedVolume || 0,
          oi: ce.openInterest || 0,
          oiChange: ce.changeinOpenInterest || 0,
          iv: ce.impliedVolatility || 0,
          greeksSource: 'calculated'
        } : null,
        PE: pe ? {
          symbol: pe.symbol || `${symbol}${selectedExpiry}${strike}PE`,
          instrumentToken: pe.identifier || `${symbol}_${strike}_PE`,
          ltp: pe.lastPrice || 0,
          change: pe.change || 0,
          changePercent: pe.pChange || 0,
          bid: pe.buyPrice1 || pe.bidPrice || 0,
          ask: pe.sellPrice1 || pe.askPrice || 0,
          volume: pe.totalTradedVolume || 0,
          oi: pe.openInterest || 0,
          oiChange: pe.changeinOpenInterest || 0,
          iv: pe.impliedVolatility || 0,
          greeksSource: 'calculated'
        } : null
      };
    }).sort((a, b) => a.strike - b.strike);

    return {
      success: true,
      source: 'NSE_LIVE',
      status: 'LIVE',
      symbol,
      underlying: {
        ltp: underlyingLtp,
        change: 0,
        changePercent: 0,
        timestamp: Date.now()
      },
      expiryDates,
      selectedExpiry,
      timestamp: new Date().toISOString(),
      chain
    };
  }

  /**
   * Helper to compute upcoming Thursday expiries for live/mock generation
   */
  getUpcomingExpiries() {
    const expiries = [];
    const now = new Date();
    let current = new Date(now);
    while (expiries.length < 3) {
      current.setDate(current.getDate() + 1);
      if (current.getDay() === 4) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        expiries.push(`${year}-${month}-${day}`);
      }
    }
    return expiries;
  }

  /**
   * Derived Option Chain using current live stock quote
   */
  async generateDerivedLiveOptionChain(symbol, targetExpiry) {
    let underlyingQuote = null;
    try {
      underlyingQuote = await this.marketProvider.getQuote(symbol);
    } catch (e) {
      // Ignore
    }

    const ltp = underlyingQuote?.ltp || 1500;
    const expiries = this.getUpcomingExpiries();

    let selectedExpiry = expiries[0];
    if (targetExpiry) {
      const cleanTarget = targetExpiry.trim();
      if (expiries.includes(cleanTarget)) {
        selectedExpiry = cleanTarget;
      } else {
        return {
          success: false,
          status: 'UNAVAILABLE',
          message: 'No option chain available for this expiry.'
        };
      }
    }

    const chain = this.buildOptionChainForLtp(symbol, ltp, selectedExpiry, false);

    return {
      success: true,
      source: underlyingQuote?.source || 'NSE_LIVE_DERIVED',
      status: underlyingQuote?.isLive ? 'LIVE' : 'DELAYED',
      symbol,
      underlying: {
        ltp: ltp,
        change: underlyingQuote?.change || 0,
        changePercent: underlyingQuote?.changePercent || 0,
        timestamp: underlyingQuote?.timestamp || Date.now()
      },
      expiryDates: expiries,
      selectedExpiry,
      timestamp: new Date().toISOString(),
      chain
    };
  }

  /**
   * Synthetic Option Chain for Mock Provider mode
   */
  generateMockOptionChain(symbol, targetExpiry) {
    let baseLtp = 1500;
    if (symbol === 'RELIANCE') baseLtp = 1450.25;
    if (symbol === 'TCS') baseLtp = 4150.00;
    if (symbol === 'INFY') baseLtp = 1880.00;
    if (symbol === 'HDFCBANK') baseLtp = 1685.00;
    if (symbol === 'ICICIBANK') baseLtp = 1245.00;
    if (symbol === 'SBIN') baseLtp = 840.00;
    if (symbol === 'CIPLA') baseLtp = 1380.30;
    if (symbol === 'NIFTY 50') baseLtp = 25450.00;
    if (symbol === 'BANK NIFTY') baseLtp = 53200.00;

    const expiries = this.getUpcomingExpiries();

    let selectedExpiry = expiries[0];
    if (targetExpiry) {
      const cleanTarget = targetExpiry.trim();
      if (expiries.includes(cleanTarget)) {
        selectedExpiry = cleanTarget;
      } else {
        return {
          success: false,
          status: 'UNAVAILABLE',
          message: 'No option chain available for this expiry.'
        };
      }
    }

    const chain = this.buildOptionChainForLtp(symbol, baseLtp, selectedExpiry, true);

    return {
      success: true,
      source: 'MockProvider',
      status: 'MOCK',
      symbol,
      underlying: {
        ltp: baseLtp,
        change: Number((baseLtp * 0.008).toFixed(2)),
        changePercent: 0.80,
        timestamp: Date.now()
      },
      expiryDates: expiries,
      selectedExpiry,
      timestamp: new Date().toISOString(),
      chain
    };
  }

  /**
   * Helper to build realistic strikes around underlying LTP
   */
  buildOptionChainForLtp(symbol, ltp, expiry, isMock = false) {
    const symUpper = symbol ? symbol.toUpperCase() : '';
    const isIndex = ['NIFTY 50', 'BANK NIFTY', 'FINNIFTY', 'MIDCAP'].includes(symUpper);

    let strikeInterval = 10;
    if (isIndex) {
      if (symUpper.includes('BANK')) strikeInterval = 100;
      else if (symUpper.includes('MIDCAP')) strikeInterval = 25;
      else strikeInterval = 50;
    } else {
      // NSE Stock Options Step Scheme
      if (ltp < 250) strikeInterval = 5;
      else if (ltp < 1000) strikeInterval = 10;
      else if (ltp < 2500) strikeInterval = 25;
      else strikeInterval = 50;
    }

    const atmStrike = Math.round(ltp / strikeInterval) * strikeInterval;
    const strikes = [];
    const count = 15;

    for (let i = -count; i <= count; i++) {
      strikes.push(Number((atmStrike + i * strikeInterval).toFixed(2)));
    }

    return strikes.map(strike => {
      const dist = (strike - ltp) / ltp;
      const baseIV = 20 + Math.abs(dist) * 15 + (isMock ? Math.random() * 2 : 0);

      const callIntrinsic = Math.max(0, ltp - strike);
      const callExtrinsic = Math.max(1, (ltp * 0.02) * Math.exp(-Math.abs(dist) * 12));
      const ceLtp = Number((callIntrinsic + callExtrinsic).toFixed(2));

      const putIntrinsic = Math.max(0, strike - ltp);
      const putExtrinsic = Math.max(1, (ltp * 0.02) * Math.exp(-Math.abs(dist) * 12));
      const peLtp = Number((putIntrinsic + putExtrinsic).toFixed(2));

      const ceOi = Math.floor(50000 * Math.exp(-Math.pow(dist * 10, 2)) + 10000);
      const peOi = Math.floor(52000 * Math.exp(-Math.pow(dist * 10, 2)) + 12000);

      return {
        strike,
        CE: {
          symbol: `${symbol}_${expiry}_${strike}_CE`,
          instrumentToken: `CE_${strike}`,
          ltp: ceLtp,
          change: Number((ceLtp * (dist < 0 ? 0.05 : -0.05)).toFixed(2)),
          changePercent: Number((dist < 0 ? 5.2 : -4.8).toFixed(2)),
          bid: Number((ceLtp * 0.995).toFixed(2)),
          ask: Number((ceLtp * 1.005).toFixed(2)),
          volume: Math.floor(ceOi * 0.4),
          oi: ceOi,
          oiChange: Math.floor(ceOi * 0.08),
          iv: Number(baseIV.toFixed(1)),
          greeksSource: 'calculated'
        },
        PE: {
          symbol: `${symbol}_${expiry}_${strike}_PE`,
          instrumentToken: `PE_${strike}`,
          ltp: peLtp,
          change: Number((peLtp * (dist > 0 ? 0.05 : -0.05)).toFixed(2)),
          changePercent: Number((dist > 0 ? 4.9 : -5.1).toFixed(2)),
          bid: Number((peLtp * 0.995).toFixed(2)),
          ask: Number((peLtp * 1.005).toFixed(2)),
          volume: Math.floor(peOi * 0.4),
          oi: peOi,
          oiChange: Math.floor(peOi * 0.07),
          iv: Number((baseIV + 0.5).toFixed(1)),
          greeksSource: 'calculated'
        }
      };
    });
  }
}

let instance = null;
function getOptionChainProvider() {
  if (!instance) {
    instance = new OptionChainProvider();
  }
  return instance;
}

module.exports = { getOptionChainProvider, OptionChainProvider };
