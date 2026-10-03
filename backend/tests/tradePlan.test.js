const test = require('node:test');
const assert = require('assert');
const marketService = require('../src/services/marketService');
const { generateIntradayTradePlan } = require('../src/engines/tradePlan/intradayTradePlanEngine');

test('Intraday Trade Plan - Symbol Normalization', () => {
  assert.strictEqual(marketService.normalizeSymbol('nifty'), 'NIFTY 50');
  assert.strictEqual(marketService.normalizeSymbol('NIFTY 50'), 'NIFTY 50');
  assert.strictEqual(marketService.normalizeSymbol('banknifty'), 'BANK NIFTY');
  assert.strictEqual(marketService.normalizeSymbol('BANK NIFTY'), 'BANK NIFTY');
});

test('Intraday Trade Plan - Output Structure Validation for NIFTY 50 & BANK NIFTY', async () => {
  const niftyPlan = await marketService.getIntradayTradePlan('NIFTY 50');
  assert.ok(niftyPlan);
  assert.strictEqual(niftyPlan.symbol, 'NIFTY 50');
  assert.ok(niftyPlan.marketStatus);
  assert.ok(niftyPlan.structure);
  assert.ok(niftyPlan.zones);
  assert.ok(niftyPlan.setup);
  assert.ok(niftyPlan.tradeManagement);
  assert.ok(niftyPlan.exitPlan);

  const bankNiftyPlan = await marketService.getIntradayTradePlan('BANK NIFTY');
  assert.ok(bankNiftyPlan);
  assert.strictEqual(bankNiftyPlan.symbol, 'BANK NIFTY');
});

test('Intraday Trade Plan - Unavailable Data Handling (No Fake Data)', () => {
  const emptyPlan = generateIntradayTradePlan('NIFTY 50', null, [], [], [], 'UNAVAILABLE', 'error');
  assert.strictEqual(emptyPlan.dataStatus, 'UNAVAILABLE');
  assert.strictEqual(emptyPlan.setup.status, 'LIVE_DATA_UNAVAILABLE');
  assert.strictEqual(emptyPlan.setup.direction, 'NONE');
  assert.strictEqual(emptyPlan.setup.isTradeValid, false);
});
