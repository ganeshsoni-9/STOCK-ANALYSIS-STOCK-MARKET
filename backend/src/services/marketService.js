const { getMarketDataProvider } = require('../providers');
const { computeMarketRegime } = require('../engines/marketRegimeEngine');
const { computeSectorPerformance } = require('./sectorService');
const stockScannerService = require('./stockScannerService');
const { getMarketStatus } = require('../utils/marketHours');

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
      dataFreshness: {
        timestamp: Date.now(),
        source: process.env.MARKET_DATA_MODE === 'live' ? process.env.BROKER_PROVIDER : 'mock',
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
}

module.exports = new MarketService();
