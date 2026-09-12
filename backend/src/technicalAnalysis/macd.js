const { calculateEMA } = require('./ema');

/**
 * Calculates MACD (Moving Average Convergence Divergence)
 * @param {number[]} values - Closing prices
 * @param {number} fastPeriod - Fast EMA period (12)
 * @param {number} slowPeriod - Slow EMA period (26)
 * @param {number} signalPeriod - Signal line period (9)
 * @returns {Array<{ macd: number|null, signal: number|null, histogram: number|null }>}
 */
function calculateMACD(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!Array.isArray(values) || values.length < slowPeriod) {
    return values.map(() => ({ macd: null, signal: null, histogram: null }));
  }

  const fastEMA = calculateEMA(values, fastPeriod);
  const slowEMA = calculateEMA(values, slowPeriod);

  const macdLine = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine[i] = Number((fastEMA[i] - slowEMA[i]).toFixed(2));
    }
  }

  const validMACDValues = macdLine.filter((v) => v !== null);
  const signalValues = calculateEMA(validMACDValues, signalPeriod);

  const result = new Array(values.length).fill(null).map(() => ({
    macd: null,
    signal: null,
    histogram: null
  }));

  let validIndex = 0;
  for (let i = 0; i < values.length; i++) {
    if (macdLine[i] !== null) {
      const macdVal = macdLine[i];
      const signalVal = signalValues[validIndex] !== undefined ? signalValues[validIndex] : null;
      const histVal = (macdVal !== null && signalVal !== null) ? Number((macdVal - signalVal).toFixed(2)) : null;

      result[i] = {
        macd: macdVal,
        signal: signalVal,
        histogram: histVal
      };
      validIndex++;
    }
  }

  return result;
}

module.exports = { calculateMACD };
