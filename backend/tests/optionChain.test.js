const test = require('node:test');
const assert = require('node:assert/strict');
const optionChainService = require('../src/services/optionChainService');
const { OptionChainProvider } = require('../src/providers/optionChainProvider');
const { getMarketDataProvider } = require('../src/providers');


const provider = getMarketDataProvider();
if (provider && provider.timer) {
  clearInterval(provider.timer);
}


test('Option Chain Capability Check', () => {
  assert.equal(optionChainService.isOptionChainSupported('RELIANCE'), true);
  assert.equal(optionChainService.isOptionChainSupported('CIPLA'), true);
  assert.equal(optionChainService.isOptionChainSupported('NON_EXISTENT_XYZ_STOCK'), false);
});

test('Mandatory Strike Preservation Test (Rule 41)', () => {
  const provider = new OptionChainProvider();
  const mockNseData = {
    records: {
      underlyingValue: 1160.00,
      expiryDates: ['2026-09-24'],
      data: [
        { strikePrice: 1125, expiryDate: '2026-09-24', CE: { lastPrice: 45.0, openInterest: 1000 } },
        { strikePrice: 1150, expiryDate: '2026-09-24', CE: { lastPrice: 28.0, openInterest: 2000 }, PE: { lastPrice: 15.0, openInterest: 1500 } },
        { strikePrice: 1180, expiryDate: '2026-09-24', PE: { lastPrice: 32.0, openInterest: 1800 } },
        { strikePrice: 1205, expiryDate: '2026-09-24', CE: { lastPrice: 8.0, openInterest: 500 }, PE: { lastPrice: 48.0, openInterest: 2200 } }
      ]
    }
  };

  const parsed = provider.parseNseOptionChain('CIPLA', mockNseData, '2026-09-24');
  assert.equal(parsed.success, true);
  assert.equal(parsed.symbol, 'CIPLA');
  assert.equal(parsed.chain.length, 4);

  const extractedStrikes = parsed.chain.map(r => r.strike);
  assert.deepEqual(extractedStrikes, [1125, 1150, 1180, 1205]);

  // Check missing PE on 1125 strike -> PE should be null
  assert.equal(parsed.chain[0].strike, 1125);
  assert.ok(parsed.chain[0].CE !== null);
  assert.equal(parsed.chain[0].PE, null);

  // Check missing CE on 1180 strike -> CE should be null
  assert.equal(parsed.chain[2].strike, 1180);
  assert.equal(parsed.chain[2].CE, null);
  assert.ok(parsed.chain[2].PE !== null);
});

test('Stock & Expiry Isolation Test', async () => {
  const ciplaExp = await optionChainService.getOptionExpiries('CIPLA');
  assert.equal(ciplaExp.success, true);
  assert.equal(ciplaExp.symbol, 'CIPLA');

  const relianceExp = await optionChainService.getOptionExpiries('RELIANCE');
  assert.equal(relianceExp.success, true);
  assert.equal(relianceExp.symbol, 'RELIANCE');
});

test('Unsupported Expiry Date Test', async () => {
  const res = await optionChainService.getOptionChain('CIPLA', '2099-12-31');
  assert.equal(res.success, false);
  assert.equal(res.status, 'UNAVAILABLE');
  assert.equal(res.message, 'No option chain available for this expiry.');
});

test('Option Chain Derived Metrics (ATM, PCR, Max Pain)', async () => {
  const chainRes = await optionChainService.getOptionChain('RELIANCE');
  assert.equal(chainRes.success, true);
  assert.equal(chainRes.symbol, 'RELIANCE');
  assert.ok(chainRes.underlying.ltp > 0);
  assert.ok(chainRes.atmStrike > 0);
  assert.ok(chainRes.pcr !== undefined);
  assert.ok(chainRes.maxPain > 0);
});
