const MockProvider = require('./mockProvider');
const AngelOneProvider = require('./angelOneProvider');
const UpstoxProvider = require('./upstoxProvider');
const FreeLiveProvider = require('./freeLiveProvider');

let instance = null;

function getMarketDataProvider() {
  if (instance) return instance;

  const mode = process.env.MARKET_DATA_MODE || 'mock';
  const broker = process.env.BROKER_PROVIDER || 'mock';

  if (mode === 'free_live' || broker === 'free_live') {
    console.log('[MarketDataProvider] Initialized FreeLiveProvider (100% Free Real NSE Market Data)');
    instance = new FreeLiveProvider();
  } else if (mode === 'mock' || broker === 'mock') {
    console.log('[MarketDataProvider] Initialized MockProvider (Synthetic Market Mode)');
    instance = new MockProvider();
  } else if (broker === 'angelone') {
    console.log('[MarketDataProvider] Initialized AngelOneProvider');
    instance = new AngelOneProvider();
  } else if (broker === 'upstox') {
    console.log('[MarketDataProvider] Initialized UpstoxProvider');
    instance = new UpstoxProvider();
  } else {
    console.log('[MarketDataProvider] Fallback to FreeLiveProvider');
    instance = new FreeLiveProvider();
  }

  return instance;
}

module.exports = { getMarketDataProvider, MockProvider, AngelOneProvider, UpstoxProvider, FreeLiveProvider };
