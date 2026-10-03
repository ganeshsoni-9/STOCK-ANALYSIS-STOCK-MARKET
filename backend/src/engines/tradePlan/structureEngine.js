/**
 * Market Structure Engine
 * Evaluates Market Structure on 15M (Context) and 5M (Setup/Trigger) timeframes.
 * Detects Pivots (HH, HL, LH, LL), Break of Structure (BOS), Change of Character (CHoCH), and Trend.
 */

function findPivotPoints(candles, leftRightBars = 2) {
  const pivots = [];
  if (!candles || candles.length < (leftRightBars * 2 + 1)) return pivots;

  for (let i = leftRightBars; i < candles.length - leftRightBars; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = i - leftRightBars; j <= i + leftRightBars; j++) {
      if (i === j) continue;
      if (candles[j].high >= currentHigh) isHigh = false;
      if (candles[j].low <= currentLow) isLow = false;
    }

    if (isHigh) {
      pivots.push({ index: i, type: 'HIGH', price: currentHigh, timestamp: candles[i].timestamp });
    }
    if (isLow) {
      pivots.push({ index: i, type: 'LOW', price: currentLow, timestamp: candles[i].timestamp });
    }
  }

  return pivots;
}

function analyzeTimeframeStructure(candles, timeframeLabel = '5M') {
  if (!candles || candles.length < 10) {
    return {
      timeframe: timeframeLabel,
      trend: 'NO CLEAR STRUCTURE',
      bos: false,
      choch: false,
      lastBOS: null,
      lastSwingHigh: null,
      lastSwingLow: null,
      structureEvents: [],
      reason: 'Insufficient candle data for structural analysis'
    };
  }

  const pivots = findPivotPoints(candles, 2);
  const highs = pivots.filter(p => p.type === 'HIGH');
  const lows = pivots.filter(p => p.type === 'LOW');

  const lastSwingHigh = highs.length > 0 ? highs[highs.length - 1].price : candles[candles.length - 1].high;
  const prevSwingHigh = highs.length > 1 ? highs[highs.length - 2].price : null;

  const lastSwingLow = lows.length > 0 ? lows[lows.length - 1].price : candles[candles.length - 1].low;
  const prevSwingLow = lows.length > 1 ? lows[lows.length - 2].price : null;

  const currentPrice = candles[candles.length - 1].close;

  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;

  for (let i = 1; i < highs.length; i++) {
    if (highs[i].price > highs[i - 1].price) hhCount++;
    else lhCount++;
  }

  for (let i = 1; i < lows.length; i++) {
    if (lows[i].price > lows[i - 1].price) hlCount++;
    else llCount++;
  }

  let trend = 'NEUTRAL';
  let reason = 'Market is consolidating in range';

  if (hhCount >= 1 && hlCount >= 1 && lastSwingHigh > (prevSwingHigh || 0)) {
    trend = 'BULLISH';
    reason = 'Forming Higher Highs and Higher Lows';
  } else if (lhCount >= 1 && llCount >= 1 && lastSwingLow < (prevSwingLow || Infinity)) {
    trend = 'BEARISH';
    reason = 'Forming Lower Highs and Lower Lows';
  } else if (hhCount > lhCount && hlCount >= llCount) {
    trend = 'BULLISH';
    reason = 'Bullish structural pressure';
  } else if (lhCount > hhCount && llCount >= hlCount) {
    trend = 'BEARISH';
    reason = 'Bearish structural pressure';
  } else {
    trend = 'CHOPPY / NO CLEAR STRUCTURE';
    reason = 'Overlapping swing points with no clear directional bias';
  }

  // Detect BOS (Break of Structure) & CHoCH (Change of Character)
  let bos = false;
  let choch = false;
  let bosDetails = null;

  if (prevSwingHigh && currentPrice > prevSwingHigh) {
    bos = true;
    bosDetails = { type: 'BULLISH_BOS', level: prevSwingHigh, timestamp: Date.now() };
    if (trend === 'BEARISH') choch = true;
  } else if (prevSwingLow && currentPrice < prevSwingLow) {
    bos = true;
    bosDetails = { type: 'BEARISH_BOS', level: prevSwingLow, timestamp: Date.now() };
    if (trend === 'BULLISH') choch = true;
  }

  return {
    timeframe: timeframeLabel,
    trend,
    bos,
    choch,
    lastBOS: bosDetails,
    lastSwingHigh,
    lastSwingLow,
    prevSwingHigh,
    prevSwingLow,
    pivotCount: pivots.length,
    reason
  };
}

/**
 * Main Market Structure Analysis across 15M and 5M timeframes
 */
function analyzeMarketStructure(candles15m, candles5m) {
  const tf15m = analyzeTimeframeStructure(candles15m, '15M');
  const tf5m = analyzeTimeframeStructure(candles5m, '5M');

  let overallBias = 'NEUTRAL';
  let overallReason = 'Timeframe alignments are mixed or neutral';

  if (tf15m.trend === 'BULLISH' && (tf5m.trend === 'BULLISH' || tf5m.bos)) {
    overallBias = 'BULLISH';
    overallReason = '15M and 5M structure aligned bullishly';
  } else if (tf15m.trend === 'BEARISH' && (tf5m.trend === 'BEARISH' || tf5m.bos)) {
    overallBias = 'BEARISH';
    overallReason = '15M and 5M structure aligned bearishly';
  } else if (tf15m.trend === 'BULLISH') {
    overallBias = 'BULLISH';
    overallReason = 'Higher timeframe (15M) context is bullish, 5M consolidating';
  } else if (tf15m.trend === 'BEARISH') {
    overallBias = 'BEARISH';
    overallReason = 'Higher timeframe (15M) context is bearish, 5M consolidating';
  } else if (tf5m.trend === 'BULLISH') {
    overallBias = 'BULLISH';
    overallReason = '5M intraday momentum is bullish';
  } else if (tf5m.trend === 'BEARISH') {
    overallBias = 'BEARISH';
    overallReason = '5M intraday momentum is bearish';
  } else {
    overallBias = 'NEUTRAL';
    overallReason = 'Market structure is choppy/rangebound across timeframes';
  }

  return {
    overallBias,
    overallReason,
    timeframe15m: tf15m,
    timeframe5m: tf5m
  };
}

module.exports = {
  findPivotPoints,
  analyzeTimeframeStructure,
  analyzeMarketStructure
};
