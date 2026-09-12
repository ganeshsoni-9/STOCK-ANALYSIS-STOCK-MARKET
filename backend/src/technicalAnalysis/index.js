const { calculateSMA } = require('./sma');
const { calculateEMA } = require('./ema');
const { calculateRSI } = require('./rsi');
const { calculateMACD } = require('./macd');
const { calculateVWAP } = require('./vwap');
const { calculateATR } = require('./atr');
const { calculateBollingerBands } = require('./bollinger');
const { calculateVolumeMetrics } = require('./volume');

/**
 * Runs a full technical analysis suite on candle data
 * @param {Array<{ timestamp: string|number, open: number, high: number, low: number, close: number, volume: number }>} candles
 */
function analyzeCandles(candles) {
  if (!Array.isArray(candles) || candles.length === 0) {
    return {
      latest: null,
      series: []
    };
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume || 1);

  const ema9Series = calculateEMA(closes, 9);
  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const rsiSeries = calculateRSI(closes, 14);
  const macdSeries = calculateMACD(closes, 12, 26, 9);
  const vwapSeries = calculateVWAP(candles);
  const atrSeries = calculateATR(candles, 14);
  const bollingerSeries = calculateBollingerBands(closes, 20, 2);
  const volumeMetrics = calculateVolumeMetrics(volumes, 20);

  const series = candles.map((c, i) => {
    return {
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      ema9: ema9Series[i],
      ema20: ema20Series[i],
      ema50: ema50Series[i],
      rsi: rsiSeries[i],
      macd: macdSeries[i].macd,
      macdSignal: macdSeries[i].signal,
      macdHistogram: macdSeries[i].histogram,
      vwap: vwapSeries[i],
      atr: atrSeries[i],
      bollinger: bollingerSeries[i],
      volumeSMA: volumeMetrics[i]?.volumeSMA,
      rvol: volumeMetrics[i]?.rvol
    };
  });

  const lastIdx = series.length - 1;
  const latest = series[lastIdx];

  return {
    latest,
    series
  };
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  calculateATR,
  calculateBollingerBands,
  calculateVolumeMetrics,
  analyzeCandles
};
