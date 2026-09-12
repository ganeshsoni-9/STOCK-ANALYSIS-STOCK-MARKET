const SECTOR_MAPPING = {
  'NIFTY BANK': ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK'],
  'NIFTY IT': ['TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM'],
  'NIFTY AUTO': ['MARUTI', 'TATAMOTORS'],
  'NIFTY PHARMA': ['SUNPHARMA', 'CIPLA'],
  'NIFTY FMCG': ['ITC', 'HINDUNILVR'],
  'NIFTY METAL': ['TATASTEEL', 'ADANIENT', 'COALINDIA'],
  'NIFTY ENERGY': ['RELIANCE', 'POWERGRID', 'NTPC', 'ONGC'],
  'NIFTY REALTY': ['ULTRACEMCO'],
  'NIFTY FINANCIAL SERVICES': ['BAJFINANCE']
};

/**
 * Computes Sector performance & strength scores from stock ticks
 * @param {Array} stockSnapshots
 */
function computeSectorPerformance(stockSnapshots) {
  const stockMap = new Map(stockSnapshots.map((s) => [s.symbol, s]));
  const sectorResults = [];

  Object.entries(SECTOR_MAPPING).forEach(([sectorName, symbols]) => {
    let totalChange = 0;
    let count = 0;
    const topStocks = [];

    symbols.forEach((sym) => {
      const stk = stockMap.get(sym);
      if (stk) {
        totalChange += stk.changePercent;
        count++;
        topStocks.push({ symbol: stk.symbol, changePercent: stk.changePercent, ltp: stk.ltp });
      }
    });

    const avgChangePct = count > 0 ? Number((totalChange / count).toFixed(2)) : 0;
    topStocks.sort((a, b) => b.changePercent - a.changePercent);

    // Sector strength score 0-100
    const strengthScore = Math.min(100, Math.max(0, Math.round(50 + avgChangePct * 25)));
    let trend = 'NEUTRAL';
    if (strengthScore >= 65) trend = 'BULLISH';
    else if (strengthScore <= 35) trend = 'BEARISH';

    sectorResults.push({
      name: sectorName,
      changePercent: avgChangePct,
      strengthScore,
      trend,
      stockCount: count,
      topStocks: topStocks.slice(0, 3)
    });
  });

  // Sort sectors strongest to weakest
  sectorResults.sort((a, b) => b.changePercent - a.changePercent);
  return sectorResults;
}

module.exports = { computeSectorPerformance, SECTOR_MAPPING };
