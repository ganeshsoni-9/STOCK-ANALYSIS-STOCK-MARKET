/**
 * Calculates Bearish Score (0-100) and factor breakdown for a stock
 * @param {Object} params
 * @param {Object} params.stock
 * @param {Object} params.analysis
 * @param {Object} params.marketRegime
 * @param {Object} params.sector
 */
function calculateBearishScore({ stock, analysis, marketRegime = {}, sector = {} }) {
  if (!stock || !analysis || !analysis.latest) {
    return { score: 0, factors: [] };
  }

  const latest = analysis.latest;
  const ltp = stock.ltp;
  const vwap = latest.vwap || stock.vwap || ltp;
  let score = 0;
  const factors = [];

  // 1. Price < VWAP (+15)
  if (ltp < vwap) {
    score += 15;
    factors.push({ name: 'Price below VWAP', points: 15, pass: true });
  } else {
    factors.push({ name: 'Price below VWAP', points: 0, pass: false });
  }

  // 2. EMA 9 < EMA 20 (+10)
  if (latest.ema9 && latest.ema20 && latest.ema9 < latest.ema20) {
    score += 10;
    factors.push({ name: 'EMA 9 < EMA 20 Bearish Alignment', points: 10, pass: true });
  } else {
    factors.push({ name: 'EMA 9 < EMA 20 Bearish Alignment', points: 0, pass: false });
  }

  // 3. EMA 20 < EMA 50 (+10)
  if (latest.ema20 && latest.ema50 && latest.ema20 < latest.ema50) {
    score += 10;
    factors.push({ name: 'EMA 20 < EMA 50 Downtrend Alignment', points: 10, pass: true });
  } else {
    factors.push({ name: 'EMA 20 < EMA 50 Downtrend Alignment', points: 0, pass: false });
  }

  // 4. RSI between 28-45 (+10) (Bearish momentum)
  const rsi = latest.rsi || 50;
  if (rsi >= 28 && rsi <= 45) {
    score += 10;
    factors.push({ name: `Bearish RSI Range (${rsi})`, points: 10, pass: true });
  } else if (rsi < 28) {
    score += 5;
    factors.push({ name: `Oversold RSI (${rsi})`, points: 5, pass: true });
  } else {
    factors.push({ name: `Bearish RSI Range (${rsi})`, points: 0, pass: false });
  }

  // 5. MACD Bearish (+10)
  if (latest.macd !== null && latest.macdSignal !== null && latest.macd < latest.macdSignal && latest.macdHistogram < 0) {
    score += 10;
    factors.push({ name: 'Bearish MACD Crossover', points: 10, pass: true });
  } else {
    factors.push({ name: 'Bearish MACD Crossover', points: 0, pass: false });
  }

  // 6. Volume > Average Volume (Selling pressure confirmation) (+15)
  const rvol = latest.rvol || 1.0;
  if (rvol >= 1.2 && stock.changePercent < 0) {
    score += 15;
    factors.push({ name: `High Selling Volume (${rvol}x RVOL)`, points: 15, pass: true });
  } else {
    factors.push({ name: `High Selling Volume (${rvol}x RVOL)`, points: 0, pass: false });
  }

  // 7. Negative Price Momentum (+10)
  if (stock.changePercent < -0.5) {
    score += 10;
    factors.push({ name: `Negative Intraday Momentum (${stock.changePercent}%)`, points: 10, pass: true });
  } else {
    factors.push({ name: 'Negative Intraday Momentum', points: 0, pass: false });
  }

  // 8. Market Regime Bearish (+10)
  if (marketRegime.regime === 'BEARISH' || marketRegime.regime === 'STRONG BEARISH') {
    score += 10;
    factors.push({ name: `Bearish Market Regime (${marketRegime.regime})`, points: 10, pass: true });
  } else {
    factors.push({ name: 'Bearish Market Regime', points: 0, pass: false });
  }

  // 9. Sector Bearish (+10)
  if (sector.changePercent && sector.changePercent < -0.3) {
    score += 10;
    factors.push({ name: `Sector Weakness (${sector.name || 'Sector'})`, points: 10, pass: true });
  } else {
    factors.push({ name: 'Sector Weakness', points: 0, pass: false });
  }

  return {
    score: Math.min(100, score),
    factors
  };
}

module.exports = { calculateBearishScore };
