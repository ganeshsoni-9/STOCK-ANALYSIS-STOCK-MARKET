const { calculateBullishScore } = require('./bullishScoreEngine');
const { calculateBearishScore } = require('./bearishScoreEngine');

/**
 * Synthesizes comprehensive signal state, conflicts, multi-timeframe status, and educational reference levels
 */
function synthesizeSignal({ stock, analysis5M, analysis15M, marketRegime = {}, sector = {} }) {
  if (!stock || !analysis5M) {
    return {
      signal: 'NEUTRAL',
      score: 50,
      bullishScore: 0,
      bearishScore: 0,
      confidence: 'Low',
      conflicts: [],
      reasons: [],
      riskReference: null
    };
  }

  const bull = calculateBullishScore({ stock, analysis: analysis5M, marketRegime, sector });
  const bear = calculateBearishScore({ stock, analysis: analysis5M, marketRegime, sector });

  const bullishScore = bull.score;
  const bearishScore = bear.score;

  let signal = 'NEUTRAL';
  let primaryScore = 50;
  let activeFactors = [];

  const bullConfirmations = bull.factors.filter((f) => f.pass).length;
  const bearConfirmations = bear.factors.filter((f) => f.pass).length;

  if (bullishScore >= 75 && marketRegime.regime !== 'STRONG BEARISH' && bullConfirmations >= 3) {
    signal = 'STRONG BULLISH';
    primaryScore = bullishScore;
    activeFactors = bull.factors.filter((f) => f.pass);
  } else if (bearishScore >= 75 && marketRegime.regime !== 'STRONG BULLISH' && bearConfirmations >= 3) {
    signal = 'STRONG BEARISH';
    primaryScore = bearishScore;
    activeFactors = bear.factors.filter((f) => f.pass);
  } else if (bullishScore >= 60 && bullishScore > bearishScore) {
    signal = 'BULLISH';
    primaryScore = bullishScore;
    activeFactors = bull.factors.filter((f) => f.pass);
  } else if (bearishScore >= 60 && bearishScore > bullishScore) {
    signal = 'BEARISH';
    primaryScore = bearishScore;
    activeFactors = bear.factors.filter((f) => f.pass);
  } else if (bullishScore >= 45 && bullishScore > bearishScore) {
    signal = 'WEAK BULLISH';
    primaryScore = bullishScore;
    activeFactors = bull.factors.filter((f) => f.pass);
  } else if (bearishScore >= 45 && bearishScore > bullishScore) {
    signal = 'WEAK BEARISH';
    primaryScore = bearishScore;
    activeFactors = bear.factors.filter((f) => f.pass);
  } else {
    signal = 'NEUTRAL';
    primaryScore = 50;
    activeFactors = [];
  }

  // Multi-timeframe evaluation (5M vs 15M)
  let tfStatus = 'CONFIRMED';
  let signal15M = 'NEUTRAL';
  if (analysis15M) {
    const bull15 = calculateBullishScore({ stock, analysis: analysis15M, marketRegime, sector });
    const bear15 = calculateBearishScore({ stock, analysis: analysis15M, marketRegime, sector });
    if (bull15.score > bear15.score + 10) signal15M = 'BULLISH';
    else if (bear15.score > bull15.score + 10) signal15M = 'BEARISH';

    const is5MBull = signal.includes('BULLISH');
    const is5MBear = signal.includes('BEARISH');
    const is15MBull = signal15M.includes('BULLISH');
    const is15MBear = signal15M.includes('BEARISH');

    if ((is5MBull && is15MBear) || (is5MBear && is15MBull)) {
      tfStatus = 'TIMEFRAME CONFLICT';
    }
  }

  // Conflict Detection
  const conflicts = [];
  // 1. Counter-trend conflict
  if (signal.includes('BULLISH') && marketRegime.regime && marketRegime.regime.includes('BEARISH')) {
    conflicts.push('COUNTER-TREND (Bullish stock in Bearish market regime)');
  }
  if (signal.includes('BEARISH') && marketRegime.regime && marketRegime.regime.includes('BULLISH')) {
    conflicts.push('COUNTER-TREND (Bearish stock in Bullish market regime)');
  }

  // 2. Timeframe Conflict
  if (tfStatus === 'TIMEFRAME CONFLICT') {
    conflicts.push(`TIMEFRAME CONFLICT (5M Signal: ${signal} vs 15M Signal: ${signal15M})`);
  }

  // 3. Market Divergence
  if (marketRegime.factors && marketRegime.factors.indexTrendScore > 70 && marketRegime.breadth && marketRegime.breadth.breadthLabel === 'Bearish') {
    conflicts.push('MARKET DIVERGENCE (Index is up but market breadth is declining)');
  }

  // Risk reference calculations based on ATR
  const latest5M = analysis5M.latest || {};
  const atr = latest5M.atr || (stock.ltp * 0.015);
  const ltp = stock.ltp;

  const riskReference = {
    entryRef: ltp,
    stopLossRef: signal.includes('BULLISH') ? Number((ltp - atr * 1.5).toFixed(2)) : Number((ltp + atr * 1.5).toFixed(2)),
    targetRef: signal.includes('BULLISH') ? Number((ltp + atr * 3.0).toFixed(2)) : Number((ltp - atr * 3.0).toFixed(2)),
    atrVal: Number(atr.toFixed(2)),
    disclaimer: 'Illustrative educational reference only — not investment advice or trade recommendation.'
  };

  return {
    symbol: stock.symbol,
    signal,
    score: primaryScore,
    bullishScore,
    bearishScore,
    confidence: bullConfirmations >= 4 || bearConfirmations >= 4 ? 'High' : 'Moderate',
    timeframeStatus: tfStatus,
    signal5M: signal,
    signal15M,
    conflicts,
    reasons: activeFactors.map((f) => f.name),
    factorBreakdown: {
      bullish: bull.factors,
      bearish: bear.factors
    },
    riskReference
  };
}

module.exports = { synthesizeSignal };
