const { getMarketDataProvider } = require('../providers');
const { computeMarketRegime } = require('../engines/marketRegimeEngine');
const { computeSectorPerformance } = require('./sectorService');
const stockScannerService = require('./stockScannerService');
const { getMarketStatus } = require('../utils/marketHours');
const { generateIntradayTradePlan } = require('../engines/tradePlan/intradayTradePlanEngine');

class MarketService {
  constructor() {
    this.provider = getMarketDataProvider();
    this.cachedOverview = null;
    this.lastUpdateTime = 0;
  }

  async getMarketOverview() {
    const marketStatus = getMarketStatus();
    const allQuotes = await this.provider.getQuotes();

    const indices = allQuotes.filter((q) => q.isIndex);
    const stocks = allQuotes.filter((q) => !q.isIndex);

    const sectors = computeSectorPerformance(stocks);
    const scannerData = await stockScannerService.scanAllStocks('5m');

    const marketRegime = computeMarketRegime({
      indices,
      stocks,
      sectors
    });

    const mode = process.env.MARKET_DATA_MODE || 'mock';
    const overview = {
      marketStatus,
      indices,
      marketRegime,
      sectors,
      breadth: marketRegime.breadth,
      topGainers: scannerData.topGainers,
      topLosers: scannerData.topLosers,
      volumeShockers: scannerData.volumeShockers,
      topBullish: scannerData.topBullish,
      topBearish: scannerData.topBearish,
      allStocks: scannerData.stocks,
      dataFreshness: {
        timestamp: Date.now(),
        source: mode !== 'mock' ? (process.env.BROKER_PROVIDER || mode) : 'mock',
        isLive: true
      }
    };

    this.cachedOverview = overview;
    this.lastUpdateTime = Date.now();
    return overview;
  }

  async getIndices() {
    const quotes = await this.provider.getQuotes(['NIFTY 50', 'BANK NIFTY', 'FINNIFTY', 'MIDCAP', 'SMALLCAP', 'INDIA VIX']);
    return quotes;
  }

  normalizeSymbol(symbolInput) {
    if (!symbolInput) return 'NIFTY 50';
    const clean = String(symbolInput).toUpperCase().trim();
    if (clean === 'NIFTY' || clean === 'NIFTY50' || clean === 'NIFTY 50' || clean === '^NSEI') return 'NIFTY 50';
    if (clean === 'BANKNIFTY' || clean === 'BANK NIFTY' || clean === 'NIFTYBANK' || clean === '^NSEBANK') return 'BANK NIFTY';
    return clean;
  }

  async getIntradayTradePlan(symbolInput) {
    const symbol = this.normalizeSymbol(symbolInput);
    try {
      const quote = await this.provider.getQuote(symbol).catch(() => null);
      const candles15m = await this.provider.getHistoricalCandles(symbol, '15m', 60).catch(() => []);
      const candles5m = await this.provider.getHistoricalCandles(symbol, '5m', 60).catch(() => []);
      const candles1m = await this.provider.getHistoricalCandles(symbol, '1m', 60).catch(() => []);

      const mode = process.env.MARKET_DATA_MODE || 'mock';
      const dataSource = quote?.source || (mode !== 'mock' ? (process.env.BROKER_PROVIDER || mode) : 'mock');
      const dataStatus = quote ? (quote.isLive ? 'LIVE' : 'DELAYED') : 'UNAVAILABLE';

      const tradePlan = generateIntradayTradePlan(
        symbol,
        quote,
        candles15m,
        candles5m,
        candles1m,
        dataStatus,
        dataSource
      );

      return tradePlan;
    } catch (err) {
      console.error(`[MarketService] Error generating trade plan for ${symbol}:`, err.message);
      return generateIntradayTradePlan(symbol, null, [], [], [], 'UNAVAILABLE', 'error');
    }
  }
}

module.exports = new MarketService();

