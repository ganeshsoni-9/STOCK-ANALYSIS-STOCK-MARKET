const { calculateSMA } = require('./sma');

/**
 * Calculates Bollinger Bands
 * @param {number[]} values - Price array
 * @param {number} period - SMA period (20)
 * @param {number} stdDevMult - Standard deviation multiplier (2)
 * @returns {Array<{ middle: number|null, upper: number|null, lower: number|null }>}
 */
function calculateBollingerBands(values, period = 20, stdDevMult = 2) {
  if (!Array.isArray(values) || values.length < period) {
    return values.map(() => ({ middle: null, upper: null, lower: null }));
  }

  const sma = calculateSMA(values, period);
  const result = new Array(values.length).fill(null).map(() => ({ middle: null, upper: null, lower: null }));

  for (let i = period - 1; i < values.length; i++) {
    const mean = sma[i];
    if (mean === null) continue;

    let sumSqDiff = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSqDiff += Math.pow(values[j] - mean, 2);
    }
    const stdDev = Math.sqrt(sumSqDiff / period);

    const upper = Number((mean + stdDevMult * stdDev).toFixed(2));
    const lower = Number((mean - stdDevMult * stdDev).toFixed(2));

    result[i] = {
      middle: mean,
      upper,
      lower
    };
  }

  return result;
}

module.exports = { calculateBollingerBands };
