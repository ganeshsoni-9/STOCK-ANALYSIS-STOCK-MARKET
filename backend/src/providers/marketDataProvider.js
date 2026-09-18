class MarketDataProvider {
  constructor(providerName = 'AbstractProvider') {
    this.name = providerName;
  }

  async getQuote(symbol) {
    throw new Error('getQuote() method must be implemented by concrete provider');
  }

  async getQuotes(symbols) {
    throw new Error('getQuotes() method must be implemented by concrete provider');
  }

  async getHistoricalCandles(symbol, timeframe = '5m', count = 100) {
    throw new Error('getHistoricalCandles() method must be implemented by concrete provider');
  }

  async getMarketDepth(symbol) {
    throw new Error('getMarketDepth() method must be implemented by concrete provider');
  }

  subscribeToMarketData(symbols, callback) {
    throw new Error('subscribeToMarketData() method must be implemented by concrete provider');
  }

  unsubscribeFromMarketData(symbols) {
    throw new Error('unsubscribeFromMarketData() method must be implemented by concrete provider');
  }
}

module.exports = MarketDataProvider;
