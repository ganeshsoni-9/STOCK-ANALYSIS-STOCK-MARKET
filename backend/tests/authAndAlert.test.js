const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

// Prevent background setInterval timers during unit test suite execution
const FreeLiveProvider = require('../src/providers/freeLiveProvider');
const MockProvider = require('../src/providers/mockProvider');
FreeLiveProvider.prototype.startLiveFeed = function () {};
MockProvider.prototype.startTickSimulator = function () {};

const authMiddleware = require('../src/middleware/authMiddleware');
const authController = require('../src/controllers/authController');
const User = require('../src/models/User');
const Alert = require('../src/models/Alert');
const alertService = require('../src/services/alertService');
const stockScannerService = require('../src/services/stockScannerService');

const SECRET = process.env.JWT_SECRET || 'tradesense_super_secret_jwt_key_2026_change_in_production';

// Helper mock res object
function createMockRes() {
  const res = {};
  res.statusCode = 200;
  res.data = null;
  res.status = function (code) {
    res.statusCode = code;
    return res;
  };
  res.json = function (obj) {
    res.data = obj;
    return res;
  };
  return res;
}

test('authMiddleware verifyToken - missing or invalid header returns 401', () => {
  const req1 = { headers: {} };
  const res1 = createMockRes();
  let nextCalled = false;

  authMiddleware.verifyToken(req1, res1, () => { nextCalled = true; });
  assert.equal(res1.statusCode, 401);
  assert.equal(res1.data.success, false);
  assert.equal(res1.data.message, 'No token provided');
  assert.equal(nextCalled, false);

  const req2 = { headers: { authorization: 'Bearer invalid_token_xyz' } };
  const res2 = createMockRes();
  authMiddleware.verifyToken(req2, res2, () => { nextCalled = true; });
  assert.equal(res2.statusCode, 401);
  assert.equal(res2.data.success, false);
  assert.equal(res2.data.message, 'Invalid or expired token');
  assert.equal(nextCalled, false);
});

test('authMiddleware verifyToken - valid token sets req.user and calls next', () => {
  const token = jwt.sign({ userId: 'user_12345' }, SECRET, { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockRes();
  let nextCalled = false;

  authMiddleware.verifyToken(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'user_12345');
});

test('authController signup - validation tests', async () => {
  // Missing/invalid identifierType
  const res1 = createMockRes();
  await authController.signup({ body: { identifierType: 'invalid' } }, res1);
  assert.equal(res1.statusCode, 400);
  assert.equal(res1.data.success, false);

  // Invalid email format
  const res2 = createMockRes();
  await authController.signup({ body: { identifierType: 'email', email: 'not-an-email' } }, res2);
  assert.equal(res2.statusCode, 400);
  assert.equal(res2.data.message, 'Valid email address is required');

  // Invalid mobile format
  const res3 = createMockRes();
  await authController.signup({ body: { identifierType: 'mobile', mobile: '12345' } }, res3);
  assert.equal(res3.statusCode, 400);
  assert.equal(res3.data.message, 'Valid 10-digit Indian mobile number is required');

  // Short password (< 8 chars)
  const res4 = createMockRes();
  await authController.signup({ body: { identifierType: 'email', email: 'test@example.com', password: 'short' } }, res4);
  assert.equal(res4.statusCode, 400);
  assert.equal(res4.data.message, 'Password must be at least 8 characters long');
});

test('authController signup & login - success flow with stubs', async (t) => {
  const origFindOne = User.findOne;
  const origCreate = User.create;

  t.after(() => {
    User.findOne = origFindOne;
    User.create = origCreate;
  });

  const mockDb = new Map();

  User.findOne = async (query) => {
    if (query.email) return mockDb.get(`email:${query.email}`) || null;
    if (query.mobile) return mockDb.get(`mobile:${query.mobile}`) || null;
    return null;
  };

  User.create = async (doc) => {
    const fakeId = '507f1f77bcf86cd799439011';
    const created = {
      _id: fakeId,
      ...doc,
      createdAt: new Date()
    };
    if (doc.email) mockDb.set(`email:${doc.email}`, created);
    if (doc.mobile) mockDb.set(`mobile:${doc.mobile}`, created);
    return created;
  };

  // Test Email Signup
  const resSignup = createMockRes();
  await authController.signup({
    body: {
      identifierType: 'email',
      email: 'trader@tradesense.ai',
      password: 'SuperSecretPassword123'
    }
  }, resSignup);

  assert.equal(resSignup.statusCode, 201);
  assert.equal(resSignup.data.success, true);
  assert.ok(resSignup.data.token);
  assert.equal(resSignup.data.user.email, 'trader@tradesense.ai');
  assert.equal(resSignup.data.user.password, undefined);

  // Test Duplicate Signup
  const resDup = createMockRes();
  await authController.signup({
    body: {
      identifierType: 'email',
      email: 'trader@tradesense.ai',
      password: 'SuperSecretPassword123'
    }
  }, resDup);
  assert.equal(resDup.statusCode, 409);
  assert.equal(resDup.data.message, 'User already exists');

  // Test Successful Login
  const resLogin = createMockRes();
  await authController.login({
    body: {
      identifierType: 'email',
      email: 'trader@tradesense.ai',
      password: 'SuperSecretPassword123'
    }
  }, resLogin);

  assert.equal(resLogin.statusCode, 200);
  assert.equal(resLogin.data.success, true);
  assert.ok(resLogin.data.token);

  // Test Failed Login (Wrong password)
  const resWrongPw = createMockRes();
  await authController.login({
    body: {
      identifierType: 'email',
      email: 'trader@tradesense.ai',
      password: 'WrongPassword'
    }
  }, resWrongPw);

  assert.equal(resWrongPw.statusCode, 401);
  assert.equal(resWrongPw.data.message, 'Invalid credentials');
});

test('alertService checkAndTriggerAlerts test', async (t) => {
  const origFind = Alert.find;
  const origScan = stockScannerService.scanAllStocks;

  t.after(() => {
    Alert.find = origFind;
    stockScannerService.scanAllStocks = origScan;
  });

  const fakeAlerts = [
    {
      _id: 'alert_1',
      userId: 'user_abc',
      symbol: 'RELIANCE',
      conditionType: 'BULLISH_SCORE_GREATER',
      targetValue: 80,
      active: true,
      lastTriggeredAt: null,
      save: async function () {}
    },
    {
      _id: 'alert_2',
      userId: 'user_abc',
      symbol: 'TCS',
      conditionType: 'PRICE_ABOVE_VWAP',
      targetValue: 0,
      active: true,
      lastTriggeredAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      save: async function () {}
    }
  ];

  Alert.find = async () => fakeAlerts;

  stockScannerService.scanAllStocks = async () => ({
    stocks: [
      {
        symbol: 'RELIANCE',
        ltp: 1450,
        vwap: 1440,
        bullishScore: 85,
        bearishScore: 15,
        openingRange: { orh: 1430, orl: 1400 }
      },
      {
        symbol: 'TCS',
        ltp: 4200,
        vwap: 4150,
        bullishScore: 60,
        bearishScore: 40,
        openingRange: { orh: 4180, orl: 4100 }
      }
    ]
  });

  const triggered = await alertService.checkAndTriggerAlerts();
  assert.equal(triggered.length, 2);

  assert.equal(triggered[0].alertId, 'alert_1');
  assert.equal(triggered[0].symbol, 'RELIANCE');
  assert.equal(triggered[0].currentValue, 85);

  assert.equal(triggered[1].alertId, 'alert_2');
  assert.equal(triggered[1].symbol, 'TCS');
  assert.equal(triggered[1].currentValue, 4200);
});
