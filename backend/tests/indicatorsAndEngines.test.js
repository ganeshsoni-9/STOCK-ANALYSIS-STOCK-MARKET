const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateEMA } = require('../src/technicalAnalysis/ema');
const { calculateRSI } = require('../src/technicalAnalysis/rsi');
const { calculateVWAP } = require('../src/technicalAnalysis/vwap');
const { calculateMACD } = require('../src/technicalAnalysis/macd');
const { calculateATR } = require('../src/technicalAnalysis/atr');

const { computeMarketRegime, calculateMarketBreadth } = require('../src/engines/marketRegimeEngine');
const { calculateBullishScore } = require('../src/engines/bullishScoreEngine');
const { calculateBearishScore } = require('../src/engines/bearishScoreEngine');

test('EMA Calculation Test', () => {
  const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
  const ema = calculateEMA(prices, 9);
  assert.equal(ema.length, 30);
  assert.equal(ema[0], null);
  assert.notEqual(ema[29], null);
  assert.ok(ema[29] > 100);
});

test('RSI Calculation Test', () => {
  const prices = [10, 12, 11, 13, 15, 14, 16, 18, 17, 19, 21, 20, 22, 24, 26, 25, 27];
  const rsi = calculateRSI(prices, 14);
  assert.equal(rsi.length, prices.length);
  assert.notEqual(rsi[14], null);
  assert.ok(rsi[16] >= 0 && rsi[16] <= 100);
});

test('VWAP Calculation Test', () => {
  const candles = [
    { high: 105, low: 95, close: 100, volume: 1000 },
    { high: 110, low: 100, close: 108, volume: 2000 }
  ];
  const vwap = calculateVWAP(candles);
  assert.equal(vwap.length, 2);
  assert.ok(vwap[1] > 100);
});

test('MACD Calculation Test', () => {
  const prices = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 10);
  const macd = calculateMACD(prices, 12, 26, 9);
  assert.equal(macd.length, 40);
  assert.notEqual(macd[39].macd, null);
});

test('Market Breadth Test', () => {
  const stocks = [
    { changePercent: 1.5 },
    { changePercent: 2.0 },
    { changePercent: 0.8 },
    { changePercent: -1.2 }
  ];
  const breadth = calculateMarketBreadth(stocks);
  assert.equal(breadth.advances, 3);
  assert.equal(breadth.declines, 1);
  assert.equal(breadth.breadthLabel, 'Bullish');
});

test('Market Regime Engine Test', () => {
  const indices = [
    { symbol: 'NIFTY 50', changePercent: 1.2, ltp: 25450, vwap: 25300 },
    { symbol: 'BANK NIFTY', changePercent: 1.8, ltp: 53200, vwap: 52800 }
  ];
  const stocks = Array.from({ length: 20 }, () => ({ changePercent: 1.0 }));
  const sectors = [{ name: 'NIFTY BANK', changePercent: 1.5 }];

  const regime = computeMarketRegime({ indices, stocks, sectors });
  assert.ok(regime.score >= 70, `Expected score >= 70, got ${regime.score}`);
  assert.equal(regime.regime, 'STRONG BULLISH');
});

test('Bullish Score Engine Test', () => {
  const stock = { symbol: 'RELIANCE', ltp: 1420, changePercent: 1.8, vwap: 1400 };
  const analysis = {
    latest: {
      vwap: 1400,
      ema9: 1410,
      ema20: 1400,
      ema50: 1380,
      rsi: 64,
      macd: 5.2,
      macdSignal: 2.1,
      macdHistogram: 3.1,
      rvol: 2.1
    }
  };
  const marketRegime = { regime: 'BULLISH' };
  const sector = { name: 'NIFTY ENERGY', changePercent: 1.2 };

  const bull = calculateBullishScore({ stock, analysis, marketRegime, sector });
  assert.ok(bull.score >= 80, `Expected bullish score >= 80, got ${bull.score}`);
});
