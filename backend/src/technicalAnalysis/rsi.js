/**
 * Calculates Relative Strength Index (RSI) using Wilder's Smoothing
 * @param {number[]} values - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} Array of RSI values
 */
function calculateRSI(values, period = 14) {
  if (!Array.isArray(values) || values.length <= period) {
    return values.map(() => null);
  }

  const result = new Array(values.length).fill(null);
  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      gainSum += diff;
    } else {
      lossSum += Math.abs(diff);
    }
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = Number((100 - (100 / (1 + rs))).toFixed(2));
  }

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = Number((100 - (100 / (1 + rs))).toFixed(2));
    }
  }

  return result;
}

module.exports = { calculateRSI };
