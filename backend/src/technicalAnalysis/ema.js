/**
 * Calculates Exponential Moving Average (EMA)
 * @param {number[]} values - Array of prices
 * @param {number} period - EMA period (e.g. 9, 20, 50)
 * @returns {number[]} Array of EMA values
 */
function calculateEMA(values, period = 20) {
  if (!Array.isArray(values) || values.length < period || period <= 0) {
    return values.map(() => null);
  }

  const result = new Array(values.length).fill(null);
  const k = 2 / (period + 1);

  // Initial SMA as baseline
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = Number(prevEMA.toFixed(2));

  for (let i = period; i < values.length; i++) {
    const currentEMA = (values[i] - prevEMA) * k + prevEMA;
    result[i] = Number(currentEMA.toFixed(2));
    prevEMA = currentEMA;
  }

  return result;
}

module.exports = { calculateEMA };
