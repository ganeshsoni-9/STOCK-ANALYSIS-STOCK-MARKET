/**
 * Calculates Intraday Volume Weighted Average Price (VWAP)
 * VWAP = Sum(Typical Price * Volume) / Sum(Volume)
 * Typical Price = (High + Low + Close) / 3
 * @param {Array<{ high: number, low: number, close: number, volume: number }>} candles
 * @returns {number[]} Array of VWAP values for each candle
 */
function calculateVWAP(candles) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return [];
  }

  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  const vwapArray = [];

  for (let i = 0; i < candles.length; i++) {
    const { high, low, close, volume } = candles[i];
    const typicalPrice = (high + low + close) / 3;
    const tpv = typicalPrice * (volume || 1);

    cumulativeTPV += tpv;
    cumulativeVolume += (volume || 1);

    const currentVWAP = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
    vwapArray.push(Number(currentVWAP.toFixed(2)));
  }

  return vwapArray;
}

module.exports = { calculateVWAP };
