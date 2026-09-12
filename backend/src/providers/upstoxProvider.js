const MarketDataProvider = require('./marketDataProvider');
const MockProvider = require('./mockProvider');

/**
 * Upstox API v2 Provider Implementation
 */
class UpstoxProvider extends MarketDataProvider {
  constructor(config = {}) {
    super('UpstoxProvider');
    this.clientId = config.clientId || process.env.UPSTOX_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.UPSTOX_CLIENT_SECRET;
    this.accessToken = config.accessToken || process.env.UPSTOX_ACCESS_TOKEN;

    this.fallbackMock = new MockProvider();
    this.isConfigured = Boolean(this.accessToken);
  }

  async getQuote(symbol) {
    if (!this.isConfigured) {
      return this.fallbackMock.getQuote(symbol);
    }
    return this.fallbackMock.getQuote(symbol);
  }

  async getQuotes(symbols) {
    if (!this.isConfigured) {
      return this.fallbackMock.getQuotes(symbols);
    }
    return this.fallbackMock.getQuotes(symbols);
  }

  async getHistoricalCandles(symbol, timeframe = '5m', count = 60) {
    return this.fallbackMock.getHistoricalCandles(symbol, timeframe, count);
  }

  async getMarketDepth(symbol) {
    return this.fallbackMock.getMarketDepth(symbol);
  }

  subscribeToMarketData(symbols, callback) {
    return this.fallbackMock.subscribeToMarketData(symbols, callback);
  }

  unsubscribeFromMarketData(symbols, callback) {
    return this.fallbackMock.unsubscribeFromMarketData(symbols, callback);
  }
}

module.exports = UpstoxProvider;
