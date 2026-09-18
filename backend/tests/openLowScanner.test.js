const test = require('node:test');
const assert = require('node:assert/strict');
const stockScannerService = require('../src/services/stockScannerService');
const { isOpenLowStock } = stockScannerService;

if (stockScannerService.provider && stockScannerService.provider.timer) {
  clearInterval(stockScannerService.provider.timer);
}


test('TEST 1: Open = 100, Low = 100 should match', () => {
  const stock = { symbol: 'TEST1', open: 100, low: 100 };
  assert.equal(isOpenLowStock(stock), true);
});

test('TEST 2: Open = 100, Low = 99.99 should NOT match', () => {
  const stock = { symbol: 'TEST2', open: 100, low: 99.99 };
  assert.equal(isOpenLowStock(stock), false);
});

test('TEST 3: Open = null, Low = 100 should NOT match', () => {
  const stock = { symbol: 'TEST3', open: null, low: 100 };
  assert.equal(isOpenLowStock(stock), false);
});

test('TEST 4: Open = 100, Low = null should NOT match', () => {
  const stock = { symbol: 'TEST4', open: 100, low: null };
  assert.equal(isOpenLowStock(stock), false);
});

test('TEST 5: Open = "100", Low = "100" should match', () => {
  const stock = { symbol: 'TEST5', open: "100", low: "100" };
  assert.equal(isOpenLowStock(stock), true);
});

test('TEST 6: Open = 100, Low = 101 should NOT match', () => {
  const stock = { symbol: 'TEST6', open: 100, low: 101 };
  assert.equal(isOpenLowStock(stock), false);
});

test('TEST 7: Multiple stocks list filtering should return only valid Open = Low matches', () => {
  const stockUniverse = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', open: 1425.00, low: 1425.00, ltp: 1432.50, changePercent: 0.53, volume: 1240000 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', open: 3560.00, low: 3560.00, ltp: 3560.00, changePercent: 0.51, volume: 820000 },
    { symbol: 'INFY', name: 'Infosys', open: 1880.00, low: 1870.00, ltp: 1895.00, changePercent: 0.80, volume: 950000 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', open: null, low: 1680.00, ltp: 1685.00, changePercent: 0.30, volume: 1100000 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', open: 1245.00, low: undefined, ltp: 1250.00, changePercent: 0.40, volume: 750000 }
  ];

  const matched = stockUniverse.filter(isOpenLowStock);

  assert.equal(matched.length, 2);
  assert.equal(matched[0].symbol, 'RELIANCE');
  assert.equal(matched[1].symbol, 'TCS');
});
