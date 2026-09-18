const { getMarketDataProvider } = require('../providers');
const { analyzeCandles } = require('../technicalAnalysis');
const { synthesizeSignal } = require('../engines/signalEngine');
const { computeSectorPerformance } = require('./sectorService');
const { analyzeOpeningRange } = require('../utils/marketHours');

class StockScannerService {
  constructor() {
    this.provider = getMarketDataProvider();
    this.cache = new Map();
    this.lastScanTime = 0;
  }

  async scanAllStocks(timeframe = '5m', marketRegime = {}) {
    const allQuotes = await this.provider.getQuotes();
    const stockQuotes = allQuotes.filter((q) => !q.isIndex);
    const sectors = computeSectorPerformance(stockQuotes);
    const sectorMap = new Map(sectors.map((s) => [s.name, s]));

    const scannedStocks = await Promise.all(
      stockQuotes.map(async (stock) => {
        try {
          const candles5M = await this.provider.getHistoricalCandles(stock.symbol, '5m', 60);
          const candles15M = await this.provider.getHistoricalCandles(stock.symbol, '15m', 60);

          const analysis5M = analyzeCandles(candles5M);
          const analysis15M = analyzeCandles(candles15M);

          const stockSector = stock.sector ? sectorMap.get(stock.sector) || {} : {};

          const signalData = synthesizeSignal({
            stock,
            analysis5M,
            analysis15M,
            marketRegime,
            sector: stockSector
          });

          const latest5M = analysis5M.latest || {};

          // Calculate Opening Range high/low from early candles
          const earlyCandles = candles5M.slice(0, 3);
          const orh = earlyCandles.length > 0 ? Math.max(...earlyCandles.map((c) => c.high)) : stock.high;
          const orl = earlyCandles.length > 0 ? Math.min(...earlyCandles.map((c) => c.low)) : stock.low;
          const openingRange = analyzeOpeningRange(stock.ltp, orh, orl);

          return {
            symbol: stock.symbol,
            companyName: stock.name,
            sector: stock.sector || 'NSE Liquid',
            ltp: stock.ltp,
            change: stock.change,
            changePercent: stock.changePercent,
            open: stock.open,
            high: stock.high,
            low: stock.low,
            previousClose: stock.previousClose,
            volume: stock.volume,
            rvol: latest5M.rvol || 1.0,
            vwap: latest5M.vwap || stock.vwap || stock.ltp,
            distanceFromVWAP: Number((((stock.ltp - (latest5M.vwap || stock.ltp)) / (latest5M.vwap || stock.ltp)) * 100).toFixed(2)),
            rsi: latest5M.rsi || 50,
            macd: latest5M.macd || 0,
            macdSignal: latest5M.macdSignal || 0,
            macdHistogram: latest5M.macdHistogram || 0,
            ema9: latest5M.ema9 || stock.ltp,
            ema20: latest5M.ema20 || stock.ltp,
            ema50: latest5M.ema50 || stock.ltp,
            atr: latest5M.atr || 10,
            bullishScore: signalData.bullishScore,
            bearishScore: signalData.bearishScore,
            signal: signalData.signal,
            score: signalData.score,
            confidence: signalData.confidence,
            timeframeStatus: signalData.timeframeStatus,
            conflicts: signalData.conflicts,
            reasons: signalData.reasons,
            riskReference: signalData.riskReference,
            openingRange,
            timestamp: stock.timestamp || Date.now(),
            source: stock.source || 'mock',
            isLive: stock.isLive ?? true
          };
        } catch (e) {
          console.error(`Error scanning stock ${stock.symbol}:`, e.message);
          return null;
        }
      })
    );

    const validStocks = scannedStocks.filter(Boolean);

    // Derived Lists
    const topGainers = [...validStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);
    const topLosers = [...validStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 8);
    const volumeShockers = [...validStocks].sort((a, b) => b.rvol - a.rvol).slice(0, 8);
    const topBullish = [...validStocks].sort((a, b) => b.bullishScore - a.bullishScore).slice(0, 8);
    const topBearish = [...validStocks].sort((a, b) => b.bearishScore - a.bearishScore).slice(0, 8);

    return {
      stocks: validStocks,
      topGainers,
      topLosers,
      volumeShockers,
      topBullish,
      topBearish,
      updatedAt: new Date().toISOString()
    };
  }

  async getStockDetails(symbol, timeframe = '5m', count = 150) {
    const quote = await this.provider.getQuote(symbol);
    const candles = await this.provider.getHistoricalCandles(symbol, timeframe, count);
    const candles15M = await this.provider.getHistoricalCandles(symbol, '15m', count);

    const analysis = analyzeCandles(candles);
    const analysis15M = analyzeCandles(candles15M);
    const depth = await this.provider.getMarketDepth(symbol);

    const signalData = synthesizeSignal({
      stock: quote,
      analysis5M: analysis,
      analysis15M,
      marketRegime: {},
      sector: {}
    });

    const earlyCandles = candles.slice(0, 3);
    const orh = earlyCandles.length > 0 ? Math.max(...earlyCandles.map((c) => c.high)) : quote.high;
    const orl = earlyCandles.length > 0 ? Math.min(...earlyCandles.map((c) => c.low)) : quote.low;
    const openingRange = analyzeOpeningRange(quote.ltp, orh, orl);

    const latest = analysis.latest || {};

    return {
      stock: {
        ...quote,
        rvol: latest.rvol || 1.0,
        vwap: latest.vwap || quote.ltp,
        distanceFromVWAP: Number((((quote.ltp - (latest.vwap || quote.ltp)) / (latest.vwap || quote.ltp)) * 100).toFixed(2))
      },
      analysis: {
        latest,
        series: analysis.series
      },
      signalData,
      openingRange,
      marketDepth: depth
    };
  }
}

module.exports = new StockScannerService();
