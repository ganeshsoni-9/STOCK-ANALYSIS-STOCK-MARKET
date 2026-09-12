/**
 * Calculates Average True Range (ATR)
 * @param {Array<{ high: number, low: number, close: number }>} candles
 * @param {number} period - ATR period (14)
 * @returns {number[]} Array of ATR values
 */
function calculateATR(candles, period = 14) {
  if (!Array.isArray(candles) || candles.length <= period) {
    return candles.map(() => null);
  }

  const trs = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }

  const result = new Array(candles.length).fill(null);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trs[i];
  }
  let prevATR = sum / period;
  result[period - 1] = Number(prevATR.toFixed(2));

  for (let i = period; i < candles.length; i++) {
    const currentATR = (prevATR * (period - 1) + trs[i]) / period;
    result[i] = Number(currentATR.toFixed(2));
    prevATR = currentATR;
  }

  return result;
}

module.exports = { calculateATR };
