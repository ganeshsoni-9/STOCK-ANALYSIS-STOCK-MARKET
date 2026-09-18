const jwt = require('jsonwebtoken');
const { getMarketDataProvider } = require('../providers');
const marketService = require('../services/marketService');
const alertService = require('../services/alertService');

function initMarketSocket(io) {
  const provider = getMarketDataProvider();
  let lastAlertCheckTime = 0;

  console.log('[Socket.IO] Market real-time gateway initialized');

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room if token is provided in handshake auth or headers
    const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (rawToken) {
      try {
        const token = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;
        const secret = process.env.JWT_SECRET || 'tradesense_super_secret_jwt_key_2026_change_in_production';
        const decoded = jwt.verify(token, secret);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`[Socket.IO] Socket ${socket.id} joined user room: user_${userId}`);
        }
      } catch (err) {
        console.warn(`[Socket.IO] Auth token verification failed for socket ${socket.id}:`, err.message);
      }
    }

    // Allow post-connection authentication / room join via socket event
    socket.on('authenticate', (data) => {
      try {
        const token = typeof data === 'string' ? data : (data?.token || data?.authorization);
        if (!token) return;
        const cleanToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        const secret = process.env.JWT_SECRET || 'tradesense_super_secret_jwt_key_2026_change_in_production';
        const decoded = jwt.verify(cleanToken, secret);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`[Socket.IO] Socket ${socket.id} authenticated & joined room: user_${userId}`);
          socket.emit('authenticated', { success: true, userId });
        }
      } catch (err) {
        socket.emit('authenticated', { success: false, message: 'Invalid token' });
      }
    });

    // Send initial snapshot immediately
    marketService.getMarketOverview().then((overview) => {
      socket.emit('market:update', overview);
      socket.emit('market:regime', overview.marketRegime);
      socket.emit('index:update', overview.indices);
      socket.emit('sector:update', overview.sectors);
      socket.emit('stock:update', overview.topBullish.concat(overview.topBearish));
    }).catch((e) => console.error('Error serving initial socket snapshot:', e.message));

    // Option Chain Real-time Subscriptions
    socket.on('subscribeOptionChain', async (data) => {
      try {
        const symbol = typeof data === 'string' ? data : data?.symbol;
        const expiry = data?.expiry || null;
        if (!symbol) return;
        const roomName = `optionchain_${symbol.toUpperCase()}_${expiry || 'default'}`;
        socket.join(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} subscribed to option chain room: ${roomName}`);

        const optionChainService = require('../services/optionChainService');
        const chainData = await optionChainService.getOptionChain(symbol, expiry);
        socket.emit('optionChain:update', chainData);
      } catch (err) {
        console.error(`[Socket.IO] Error in subscribeOptionChain:`, err.message);
      }
    });

    socket.on('unsubscribeOptionChain', (data) => {
      try {
        const symbol = typeof data === 'string' ? data : data?.symbol;
        const expiry = data?.expiry || null;
        if (!symbol) return;
        const roomName = `optionchain_${symbol.toUpperCase()}_${expiry || 'default'}`;
        socket.leave(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} unsubscribed from option chain room: ${roomName}`);
      } catch (err) {
        console.error(`[Socket.IO] Error in unsubscribeOptionChain:`, err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Subscribe to live tick updates from provider
  provider.subscribeToMarketData([], async (ticks) => {
    try {
      const overview = await marketService.getMarketOverview();
      io.emit('market:update', overview);
      io.emit('market:regime', overview.marketRegime);
      io.emit('index:update', overview.indices);
      io.emit('sector:update', overview.sectors);
      io.emit('signal:update', {
        topBullish: overview.topBullish,
        topBearish: overview.topBearish,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('[Socket.IO] Error broadcasting market updates:', e.message);
    }

    // Throttled alert monitoring check (every 10-15 seconds)
    const now = Date.now();
    if (now - lastAlertCheckTime >= 10000) {
      lastAlertCheckTime = now;
      alertService.checkAndTriggerAlerts().then((triggeredAlerts) => {
        if (Array.isArray(triggeredAlerts) && triggeredAlerts.length > 0) {
          triggeredAlerts.forEach((alert) => {
            io.to(`user_${alert.userId}`).emit('alert:triggered', alert);
          });
        }
      }).catch((err) => {
        console.error('[Socket.IO] Error checking alerts:', err.message);
      });
    }
  });
}

module.exports = { initMarketSocket };
