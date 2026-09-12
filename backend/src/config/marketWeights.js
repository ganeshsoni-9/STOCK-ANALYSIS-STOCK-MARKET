module.exports = {
  weights: {
    indexTrend: 0.20,
    marketBreadth: 0.20,
    sectorStrength: 0.15,
    volumeConfirmation: 0.15,
    momentum: 0.10,
    vwapPosition: 0.10,
    rsi: 0.05,
    maStructure: 0.05
  },
  thresholds: {
    strongBearish: { min: 0, max: 30, label: 'STRONG BEARISH' },
    bearish: { min: 31, max: 45, label: 'BEARISH' },
    neutral: { min: 46, max: 54, label: 'NEUTRAL' },
    bullish: { min: 55, max: 69, label: 'BULLISH' },
    strongBullish: { min: 70, max: 100, label: 'STRONG BULLISH' }
  }
};
