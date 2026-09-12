const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const FreeLiveProvider = require('../src/providers/freeLiveProvider');
const marketService = require('../src/services/marketService');

// Prevent background setInterval timer during test suite execution
FreeLiveProvider.prototype.startLiveFeed = function () {};

// Clean up any default provider timers created when marketService was required
if (marketService.provider && marketService.provider.timer) {
  clearInterval(marketService.provider.timer);
}

test('FreeLiveProvider fetchSymbolQuote open price and high/low tests', async (t) => {
  const provider = new FreeLiveProvider();

  const originalGet = axios.get;
  t.after(() => {
    axios.get = originalGet;
  });

  // Mock response with regularMarketOpen and regularMarketDayHigh/Low
  axios.get = async () => ({
    data: {
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 100,
            chartPreviousClose: 98,
            regularMarketOpen: 99.5,
            regularMarketDayHigh: 102.5,
            regularMarketDayLow: 97.5,
            dayHigh: 105,
            dayLow: 95,
            regularMarketVolume: 50000
          }
        }]
      }
    }
  });

  const quote = await provider.fetchSymbolQuote('RELIANCE');
  assert.equal(quote.open, 99.5);
  assert.equal(quote.high, 102.5);
  assert.equal(quote.low, 97.5);
});

test('FreeLiveProvider fetchSymbolQuote fallback tests', async (t) => {
  const provider = new FreeLiveProvider();

  const originalGet = axios.get;
  t.after(() => {
    axios.get = originalGet;
  });

  // Mock response without regularMarketOpen and regularMarketDayHigh/Low
  axios.get = async () => ({
    data: {
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 100,
            chartPreviousClose: 98,
            dayHigh: 104,
            dayLow: 96,
            regularMarketVolume: 50000
          }
        }]
      }
    }
  });

  const quote = await provider.fetchSymbolQuote('RELIANCE');
  // open falls back to chartPreviousClose (98)
  assert.equal(quote.open, 98);
  // high/low fall back to dayHigh/dayLow (104, 96)
  assert.equal(quote.high, 104);
  assert.equal(quote.low, 96);
});

test('FreeLiveProvider getMarketDepth isSynthetic test', async (t) => {
  const provider = new FreeLiveProvider();

  const originalGet = axios.get;
  t.after(() => {
    axios.get = originalGet;
  });

  axios.get = async () => ({
    data: {
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 100,
            chartPreviousClose: 98
          }
        }]
      }
    }
  });

  const depth = await provider.getMarketDepth('RELIANCE');
  assert.equal(depth.isSynthetic, true);
  assert.equal(depth.symbol, 'RELIANCE');
  assert.ok(Array.isArray(depth.bids));
  assert.ok(Array.isArray(depth.asks));
});

test('MarketService dataFreshness source test for free_live and mock modes', async (t) => {
  const origMode = process.env.MARKET_DATA_MODE;
  const origBroker = process.env.BROKER_PROVIDER;
  t.after(() => {
    process.env.MARKET_DATA_MODE = origMode;
    process.env.BROKER_PROVIDER = origBroker;
  });

  const origGetQuotes = marketService.provider.getQuotes;
  marketService.provider.getQuotes = async () => [
    { symbol: 'NIFTY 50', isIndex: true, changePercent: 1.0, ltp: 25000, vwap: 24900 },
    { symbol: 'RELIANCE', isIndex: false, changePercent: 0.5, ltp: 1400, vwap: 1390 }
  ];
  t.after(() => {
    marketService.provider.getQuotes = origGetQuotes;
  });

  // Test free_live mode
  process.env.MARKET_DATA_MODE = 'free_live';
  delete process.env.BROKER_PROVIDER;

  let overview = await marketService.getMarketOverview();
  assert.equal(overview.dataFreshness.source, 'free_live');

  // Test broker provider override
  process.env.BROKER_PROVIDER = 'yahoo';
  overview = await marketService.getMarketOverview();
  assert.equal(overview.dataFreshness.source, 'yahoo');

  // Test mock mode
  process.env.MARKET_DATA_MODE = 'mock';
  delete process.env.BROKER_PROVIDER;
  overview = await marketService.getMarketOverview();
  assert.equal(overview.dataFreshness.source, 'mock');
});
