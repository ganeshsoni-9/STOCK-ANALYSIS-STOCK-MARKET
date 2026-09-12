const { calculateSMA } = require('./sma');

/**
 * Calculates Volume Moving Average and Relative Volume (RVOL)
 * @param {number[]} volumes - Array of candle volumes
 * @param {number} period - SMA period (20)
 * @returns {Array<{ volumeSMA: number|null, rvol: number|null }>}
 */
function calculateVolumeMetrics(volumes, period = 20) {
  if (!Array.isArray(volumes) || volumes.length === 0) {
    return [];
  }

  const sma = calculateSMA(volumes, period);
  return volumes.map((vol, idx) => {
    const avgVol = sma[idx];
    const rvol = avgVol && avgVol > 0 ? Number((vol / avgVol).toFixed(2)) : 1.0;
    return {
      volumeSMA: avgVol,
      rvol
    };
  });
}

module.exports = { calculateVolumeMetrics };
