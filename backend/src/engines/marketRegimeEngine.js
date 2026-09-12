const { weights, thresholds } = require('../config/marketWeights');

/**
 * Calculates Market Breadth Metrics & Score
 * @param {Array<{ changePercent: number }>} stocks
 */
function calculateMarketBreadth(stocks) {
  let advances = 0;
  let declines = 0;
  let unchanged = 0;

  stocks.forEach((s) => {
    if (s.changePercent > 0.05) advances++;
    else if (s.changePercent < -0.05) declines++;
    else unchanged++;
  });

  const adRatio = Number((advances / Math.max(declines, 1)).toFixed(2));
  let breadthScore = 50;

  if (adRatio > 2.0) breadthScore = 90;
  else if (adRatio > 1.3) breadthScore = 75;
  else if (adRatio > 0.9) breadthScore = 50;
  else if (adRatio > 0.5) breadthScore = 30;
  else breadthScore = 10;

  let breadthLabel = 'Neutral';
  if (advances > declines * 1.3) breadthLabel = 'Bullish';
  else if (declines > advances * 1.3) breadthLabel = 'Bearish';

  return {
    advances,
    declines,
    unchanged,
    adRatio,
    breadthScore,
    breadthLabel
  };
}

/**
 * Computes overall Intraday Market Regime Score (0-100)
 * @param {Object} params
 * @param {Array} params.indices - Primary indices data
 * @param {Array} params.stocks - Stock universe snapshot
 * @param {Array} params.sectors - Sector snapshots
 */
function computeMarketRegime({ indices = [], stocks = [], sectors = [] }) {
  const breadth = calculateMarketBreadth(stocks);

  // 1. Index Trend Score (20%)
  const nifty = indices.find((i) => i.symbol === 'NIFTY 50') || { changePercent: 0, ltp: 0, vwap: 0 };
  const bankNifty = indices.find((i) => i.symbol === 'BANK NIFTY') || { changePercent: 0, ltp: 0, vwap: 0 };

  let indexTrendScore = 50;
  const avgIndexChange = (nifty.changePercent + bankNifty.changePercent) / 2;
  if (avgIndexChange >= 1.2) indexTrendScore = 95;
  else if (avgIndexChange >= 0.5) indexTrendScore = 78;
  else if (avgIndexChange >= 0.0) indexTrendScore = 55;
  else if (avgIndexChange >= -0.5) indexTrendScore = 38;
  else indexTrendScore = 15;

  // 2. Market Breadth Score (20%)
  const breadthScore = breadth.breadthScore;

  // 3. Sector Strength Score (15%)
  let sectorScore = 50;
  if (sectors.length > 0) {
    const bullishSectors = sectors.filter((sec) => sec.changePercent > 0.2).length;
    const bearishSectors = sectors.filter((sec) => sec.changePercent < -0.2).length;
    const ratio = bullishSectors / Math.max(sectors.length, 1);
    sectorScore = Number((ratio * 100).toFixed(2));
  }

  // 4. Volume Confirmation Score (15%)
  const avgStockVolChange = stocks.reduce((acc, curr) => acc + (curr.changePercent > 0 ? 1 : 0), 0);
  const volScore = stocks.length > 0 ? Number(((avgStockVolChange / stocks.length) * 100).toFixed(2)) : 50;

  // 5. Momentum Score (10%)
  const momentumScore = Math.min(100, Math.max(0, Math.round(50 + avgIndexChange * 25)));

  // 6. VWAP Position Score (10%)
  let vwapScore = 50;
  if (nifty.vwap && nifty.ltp) {
    vwapScore = nifty.ltp >= nifty.vwap ? 85 : 20;
  }

  // 7. RSI Score (5%)
  const rsiScore = avgIndexChange > 0 ? 65 : 35;

  // 8. MA Structure Score (5%)
  const maScore = avgIndexChange > 0 ? 70 : 30;

  // Calculate Weighted Market Score
  const totalScore = Math.round(
    indexTrendScore * weights.indexTrend +
    breadthScore * weights.marketBreadth +
    sectorScore * weights.sectorStrength +
    volScore * weights.volumeConfirmation +
    momentumScore * weights.momentum +
    vwapScore * weights.vwapPosition +
    rsiScore * weights.rsi +
    maScore * weights.maStructure
  );

  const finalScore = Math.min(100, Math.max(0, totalScore));

  // Determine Regime Label
  let regime = 'NEUTRAL';
  let biasText = 'Neutral Bias';
  let confidence = 'Moderate';

  if (finalScore >= thresholds.strongBullish.min) {
    regime = 'STRONG BULLISH';
    biasText = 'Strong Bullish Bias';
    confidence = 'High';
  } else if (finalScore >= thresholds.bullish.min) {
    regime = 'BULLISH';
    biasText = 'Moderate Bullish Bias';
    confidence = 'Moderate';
  } else if (finalScore <= thresholds.strongBearish.max) {
    regime = 'STRONG BEARISH';
    biasText = 'Strong Bearish Bias';
    confidence = 'High';
  } else if (finalScore <= thresholds.bearish.max) {
    regime = 'BEARISH';
    biasText = 'Moderate Bearish Bias';
    confidence = 'Moderate';
  }

  const reasons = [];
  if (nifty.changePercent > 0) reasons.push(`NIFTY 50 up +${nifty.changePercent}%`);
  else if (nifty.changePercent < 0) reasons.push(`NIFTY 50 down ${nifty.changePercent}%`);

  if (breadth.advances > breadth.declines) reasons.push(`Positive Market Breadth (${breadth.advances} Advances / ${breadth.declines} Declines)`);
  else if (breadth.declines > breadth.advances) reasons.push(`Negative Market Breadth (${breadth.declines} Declines / ${breadth.advances} Advances)`);

  if (nifty.vwap && nifty.ltp >= nifty.vwap) reasons.push('NIFTY 50 trading above VWAP');
  else if (nifty.vwap && nifty.ltp < nifty.vwap) reasons.push('NIFTY 50 trading below VWAP');

  return {
    score: finalScore,
    regime,
    biasText,
    confidence,
    breadth,
    factors: {
      indexTrendScore,
      breadthScore,
      sectorScore,
      volScore,
      momentumScore,
      vwapScore,
      rsiScore,
      maScore
    },
    reasons,
    updatedAt: new Date().toISOString()
  };
}

module.exports = { computeMarketRegime, calculateMarketBreadth };
