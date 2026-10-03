/**
 * Dynamic Support, Resistance, and VWAP Engine
 * Calculates key intraday levels: PDH, PDL, Previous Close, Intraday Support & Resistance, VWAP.
 */

function calculateKeyLevels(candles, currentQuote) {
  if (!candles || candles.length === 0) {
    const ltp = currentQuote?.ltp || 0;
    return {
      pdh: currentQuote?.high || ltp,
      pdl: currentQuote?.low || ltp,
      previousClose: currentQuote?.previousClose || ltp,
      intradayHigh: currentQuote?.high || ltp,
      intradayLow: currentQuote?.low || ltp,
      vwap: currentQuote?.vwap || ltp,
      supportLevels: [Number((ltp * 0.995).toFixed(2)), Number((ltp * 0.990).toFixed(2))],
      resistanceLevels: [Number((ltp * 1.005).toFixed(2)), Number((ltp * 1.010).toFixed(2))],
      vwapStatus: 'VWAP unavailable'
    };
  }

  const ltp = currentQuote?.ltp || candles[candles.length - 1].close;
  const intradayHigh = Math.max(...candles.map(c => c.high), currentQuote?.high || ltp);
  const intradayLow = Math.min(...candles.map(c => c.low), currentQuote?.low || ltp);
  const pdh = currentQuote?.high || intradayHigh;
  const pdl = currentQuote?.low || intradayLow;
  const previousClose = currentQuote?.previousClose || candles[0].open;

  // Dynamic VWAP calculation
  let cumVolPrice = 0;
  let cumVol = 0;
  candles.forEach(c => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1000;
    cumVolPrice += typicalPrice * vol;
    cumVol += vol;
  });

  const vwapVal = cumVol > 0 ? Number((cumVolPrice / cumVol).toFixed(2)) : Number(((intradayHigh + intradayLow + ltp) / 3).toFixed(2));

  let vwapStatus = 'VWAP unavailable';
  if (vwapVal > 0) {
    const diffPct = ((ltp - vwapVal) / vwapVal) * 100;
    if (Math.abs(diffPct) < 0.05) vwapStatus = 'Price hovering at VWAP';
    else if (ltp > vwapVal) vwapStatus = `Price above VWAP (+${diffPct.toFixed(2)}%)`;
    else vwapStatus = `Price below VWAP (${diffPct.toFixed(2)}%)`;
  }

  // Dynamic Support & Resistance levels from price clusters
  const highs = candles.map(c => c.high).sort((a, b) => b - a);
  const lows = candles.map(c => c.low).sort((a, b) => a - b);

  const resistanceLevels = Array.from(new Set([
    Number(intradayHigh.toFixed(2)),
    Number(highs[Math.floor(highs.length * 0.2)].toFixed(2)),
    Number((pdh * 1.002).toFixed(2))
  ])).filter(r => r > ltp).sort((a, b) => a - b);

  const supportLevels = Array.from(new Set([
    Number(intradayLow.toFixed(2)),
    Number(lows[Math.floor(lows.length * 0.2)].toFixed(2)),
    Number((pdl * 0.998).toFixed(2))
  ])).filter(s => s < ltp).sort((a, b) => b - a);

  // Fallbacks if list is empty
  if (resistanceLevels.length === 0) resistanceLevels.push(Number((ltp * 1.005).toFixed(2)), Number((ltp * 1.01).toFixed(2)));
  if (supportLevels.length === 0) supportLevels.push(Number((ltp * 0.995).toFixed(2)), Number((ltp * 0.99).toFixed(2)));

  return {
    pdh: Number(pdh.toFixed(2)),
    pdl: Number(pdl.toFixed(2)),
    previousClose: Number(previousClose.toFixed(2)),
    intradayHigh: Number(intradayHigh.toFixed(2)),
    intradayLow: Number(intradayLow.toFixed(2)),
    vwap: vwapVal,
    vwapStatus,
    supportLevels: supportLevels.slice(0, 3),
    resistanceLevels: resistanceLevels.slice(0, 3)
  };
}

module.exports = {
  calculateKeyLevels
};
