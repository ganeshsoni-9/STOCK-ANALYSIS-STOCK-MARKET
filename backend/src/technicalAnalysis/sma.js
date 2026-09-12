/**
 * Calculates Simple Moving Average (SMA)
 * @param {number[]} values - Array of prices or numbers
 * @param {number} period - SMA period
 * @returns {number[]} Array of SMA values aligned with input array length (null for initial indices)
 */
function calculateSMA(values, period = 20) {
  if (!Array.isArray(values) || values.length < period || period <= 0) {
    return values.map(() => null);
  }

  const result = new Array(values.length).fill(null);
  let sum = 0;

  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      result[i] = Number((sum / period).toFixed(2));
    }
  }

  return result;
}

module.exports = { calculateSMA };
