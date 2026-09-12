const MarketDataProvider = require('./marketDataProvider');
const MockProvider = require('./mockProvider');

/**
 * Angel One SmartAPI Provider Implementation
 */
class AngelOneProvider extends MarketDataProvider {
  constructor(config = {}) {
    super('AngelOneProvider');
    this.apiKey = config.apiKey || process.env.ANGEL_API_KEY;
    this.clientId = config.clientId || process.env.ANGEL_CLIENT_ID;
    this.password = config.password || process.env.ANGEL_PASSWORD;
    this.totpSecret = config.totpSecret || process.env.ANGEL_TOTP_SECRET;

    this.fallbackMock = new MockProvider();
    this.isConfigured = Boolean(this.apiKey && this.clientId);
  }

  async getQuote(symbol) {
    if (!this.isConfigured) {
      return this.fallbackMock.getQuote(symbol);
    }
    // Real Angel One REST quote call structure
    try {
      // Stubbed network call to Angel SmartAPI Endpoint
      throw new Error('Angel One credentials active but API call pending production token initialization');
    } catch (e) {
      return this.fallbackMock.getQuote(symbol);
    }
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

module.exports = AngelOneProvider;
