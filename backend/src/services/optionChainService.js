const { getOptionChainProvider } = require('../providers/optionChainProvider');

// Black-Scholes Standard Math Helper Functions
function CND(x) {
  const a1 = 0.31938153, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;
  const L = Math.abs(x);
  const k = 1.0 / (1.0 + 0.2316419 * L);
  let w = 1.0 - 1.0 / Math.sqrt(2 * Math.PI) * Math.exp(-L * L / 2) * (a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));
  if (x < 0) w = 1.0 - w;
  return w;
}

function NPDF(x) {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

function calculateBlackScholesGreeks(type, S, K, T, r = 0.07, sigma = 0.20) {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) {
    return { delta: 'N/A', gamma: 'N/A', theta: 'N/A', vega: 'N/A' };
  }

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2.0) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let delta = 0;
  let theta = 0;

  if (type === 'CE') {
    delta = CND(d1);
    theta = (-(S * NPDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * CND(d2)) / 365.0;
  } else {
    delta = CND(d1) - 1.0;
    theta = (-(S * NPDF(d1) * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * CND(-d2)) / 365.0;
  }

  const gamma = NPDF(d1) / (S * sigma * Math.sqrt(T));
  const vega = (S * NPDF(d1) * Math.sqrt(T)) / 100.0;

  return {
    delta: Number(delta.toFixed(3)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2))
  };
}

class OptionChainService {
  constructor() {
    this.provider = getOptionChainProvider();
    this.cache = new Map();
  }

  isOptionChainSupported(symbol) {
    return this.provider.isOptionChainSupported(symbol);
  }

  getSupportedSymbols() {
    return this.provider.getSupportedSymbols();
  }

  async getOptionExpiries(symbol) {
    const rawData = await this.provider.getOptionChain(symbol);
    if (!rawData.success) {
      return { success: false, symbol, expiries: [], message: rawData.message };
    }
    return {
      success: true,
      symbol,
      expiries: rawData.expiryDates || [],
      selectedExpiry: rawData.selectedExpiry || null
    };
  }

  async getOptionChain(symbol, expiry = null) {
    const symUpper = symbol ? symbol.trim().toUpperCase() : '';
    const cacheKey = `${symUpper}_${expiry || 'default'}`;
    const now = Date.now();

    // Check 4-second short cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.time < 4000) {
        return cached.data;
      }
    }

    const rawData = await this.provider.getOptionChain(symUpper, expiry);

    if (!rawData.success || !Array.isArray(rawData.chain) || rawData.chain.length === 0) {
      return rawData;
    }

    const underlyingLtp = rawData.underlying?.ltp || 0;
    const chain = rawData.chain;

    // 1. Find ATM Strike (Strike closest to underlying LTP)
    let atmStrike = chain[0].strike;
    let minDiff = Math.abs(underlyingLtp - atmStrike);

    chain.forEach(row => {
      const diff = Math.abs(underlyingLtp - row.strike);
      if (diff < minDiff) {
        minDiff = diff;
        atmStrike = row.strike;
      }
    });

    // 2. Compute Total Call OI, Total Put OI, Max Call OI Strike, Max Put OI Strike
    let totalCallOI = 0;
    let totalPutOI = 0;
    let maxCallOI = -1;
    let maxPutOI = -1;
    let maxCallOIStrike = atmStrike;
    let maxPutOIStrike = atmStrike;

    chain.forEach(row => {
      const ceOi = row.CE?.oi || 0;
      const peOi = row.PE?.oi || 0;

      totalCallOI += ceOi;
      totalPutOI += peOi;

      if (ceOi > maxCallOI) {
        maxCallOI = ceOi;
        maxCallOIStrike = row.strike;
      }

      if (peOi > maxPutOI) {
        maxPutOI = peOi;
        maxPutOIStrike = row.strike;
      }
    });

    // 3. Compute PCR (Put/Call Ratio)
    let pcr = 'N/A';
    if (totalCallOI > 0) {
      pcr = Number((totalPutOI / totalCallOI).toFixed(2));
    }

    // 4. Compute Max Pain
    let maxPain = atmStrike;
    let minTotalLoss = Infinity;

    chain.forEach(candidateRow => {
      const S = candidateRow.strike;
      let totalLoss = 0;

      chain.forEach(row => {
        const K = row.strike;
        const ceOi = row.CE?.oi || 0;
        const peOi = row.PE?.oi || 0;

        if (K <= S) {
          totalLoss += ceOi * (S - K);
        }
        if (K >= S) {
          totalLoss += peOi * (K - S);
        }
      });

      if (totalLoss < minTotalLoss) {
        minTotalLoss = totalLoss;
        maxPain = S;
      }
    });

    // Calculate Days to Expiry (T in years)
    let timeToExpiryYears = 7 / 365.25; // default 7 days if unparsed
    if (rawData.selectedExpiry) {
      const expDate = new Date(rawData.selectedExpiry);
      if (!isNaN(expDate.getTime())) {
        const diffMs = expDate.getTime() - now;
        const days = Math.max(0.5, diffMs / (1000 * 60 * 60 * 24));
        timeToExpiryYears = days / 365.25;
      }
    }

    // 5. Enrich rows with ITM/OTM/ATM badges and Greeks
    const processedChain = chain.map(row => {
      const isATM = row.strike === atmStrike;
      const callITM = row.strike < atmStrike;
      const putITM = row.strike > atmStrike;

      // Greeks calculation
      const ceIv = (row.CE?.iv || 20) / 100.0;
      const peIv = (row.PE?.iv || 20) / 100.0;

      const ceGreeks = calculateBlackScholesGreeks('CE', underlyingLtp, row.strike, timeToExpiryYears, 0.07, ceIv);
      const peGreeks = calculateBlackScholesGreeks('PE', underlyingLtp, row.strike, timeToExpiryYears, 0.07, peIv);

      return {
        ...row,
        isATM,
        callITM,
        putITM,
        CE: row.CE ? {
          ...row.CE,
          greeks: ceGreeks
        } : null,
        PE: row.PE ? {
          ...row.PE,
          greeks: peGreeks
        } : null
      };
    });

    const result = {
      success: true,
      source: rawData.source || 'NSE_LIVE',
      status: rawData.status || 'LIVE',
      symbol: symUpper,
      underlying: rawData.underlying,
      expiryDates: rawData.expiryDates || [],
      selectedExpiry: rawData.selectedExpiry,
      atmStrike,
      totalCallOI,
      totalPutOI,
      pcr,
      maxCallOIStrike,
      maxPutOIStrike,
      maxPain,
      timestamp: rawData.timestamp || new Date().toISOString(),
      chain: processedChain
    };

    // Store in cache
    this.cache.set(cacheKey, { time: now, data: result });

    return result;
  }
}

module.exports = new OptionChainService();
