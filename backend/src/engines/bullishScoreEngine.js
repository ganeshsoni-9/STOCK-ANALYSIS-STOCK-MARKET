/**
 * Calculates Bullish Score (0-100) and detailed factor breakdown for a stock
 * @param {Object} params
 * @param {Object} params.stock - Stock tick snapshot
 * @param {Object} params.analysis - Technical indicators analysis object
 * @param {Object} params.marketRegime - Current market regime output
 * @param {Object} params.sector - Sector information
 */
function calculateBullishScore({ stock, analysis, marketRegime = {}, sector = {} }) {
  if (!stock || !analysis || !analysis.latest) {
    return { score: 0, factors: [] };
  }

  const latest = analysis.latest;
  const ltp = stock.ltp;
  const vwap = latest.vwap || stock.vwap || ltp;
  let score = 0;
  const factors = [];

  // 1. Price > VWAP (+15)
  if (ltp > vwap) {
    score += 15;
    factors.push({ name: 'Price above VWAP', points: 15, pass: true });
  } else {
    factors.push({ name: 'Price above VWAP', points: 0, pass: false });
  }

  // 2. EMA 9 > EMA 20 (+10)
  if (latest.ema9 && latest.ema20 && latest.ema9 > latest.ema20) {
    score += 10;
    factors.push({ name: 'EMA 9 > EMA 20 Alignment', points: 10, pass: true });
  } else {
    factors.push({ name: 'EMA 9 > EMA 20 Alignment', points: 0, pass: false });
  }

  // 3. EMA 20 > EMA 50 (+10)
  if (latest.ema20 && latest.ema50 && latest.ema20 > latest.ema50) {
    score += 10;
    factors.push({ name: 'EMA 20 > EMA 50 Trend Alignment', points: 10, pass: true });
  } else {
    factors.push({ name: 'EMA 20 > EMA 50 Trend Alignment', points: 0, pass: false });
  }

  // 4. RSI between 55-70 (+10) (Strong bullish momentum without extreme overbought)
  const rsi = latest.rsi || 50;
  if (rsi >= 55 && rsi <= 72) {
    score += 10;
    factors.push({ name: `Optimal Bullish RSI (${rsi})`, points: 10, pass: true });
  } else if (rsi > 72) {
    score += 5;
    factors.push({ name: `High RSI (${rsi}) - Approaching Overbought`, points: 5, pass: true });
  } else {
    factors.push({ name: `RSI in Bullish Range (${rsi})`, points: 0, pass: false });
  }

  // 5. MACD Bullish (+10)
  if (latest.macd !== null && latest.macdSignal !== null && latest.macd > latest.macdSignal && latest.macdHistogram > 0) {
    score += 10;
    factors.push({ name: 'Bullish MACD Crossover', points: 10, pass: true });
  } else {
    factors.push({ name: 'Bullish MACD Crossover', points: 0, pass: false });
  }

  // 6. Volume > Average Volume (RVOL > 1.2) (+15)
  const rvol = latest.rvol || 1.0;
  if (rvol >= 1.2) {
    score += 15;
    factors.push({ name: `High Relative Volume (${rvol}x)`, points: 15, pass: true });
  } else {
    factors.push({ name: `High Relative Volume (${rvol}x)`, points: 0, pass: false });
  }

  // 7. Positive Price Momentum (+10)
  if (stock.changePercent > 0.5) {
    score += 10;
    factors.push({ name: `Positive Intraday Momentum (+${stock.changePercent}%)`, points: 10, pass: true });
  } else {
    factors.push({ name: 'Positive Intraday Momentum', points: 0, pass: false });
  }

  // 8. Market Regime Bullish (+10)
  if (marketRegime.regime === 'BULLISH' || marketRegime.regime === 'STRONG BULLISH') {
    score += 10;
    factors.push({ name: `Bullish Market Regime (${marketRegime.regime})`, points: 10, pass: true });
  } else {
    factors.push({ name: `Bullish Market Regime`, points: 0, pass: false });
  }

  // 9. Sector Bullish (+10)
  if (sector.changePercent && sector.changePercent > 0.3) {
    score += 10;
    factors.push({ name: `Sector Strength (${sector.name || 'Sector'})`, points: 10, pass: true });
  } else {
    factors.push({ name: 'Sector Strength', points: 0, pass: false });
  }

  return {
    score: Math.min(100, score),
    factors
  };
}

module.exports = { calculateBullishScore };
