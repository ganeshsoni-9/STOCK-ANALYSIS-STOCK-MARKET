const { getMarketDataProvider } = require('../providers');
const marketService = require('../services/marketService');

function initMarketSocket(io) {
  const provider = getMarketDataProvider();

  console.log('[Socket.IO] Market real-time gateway initialized');

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Send initial snapshot immediately
    marketService.getMarketOverview().then((overview) => {
      socket.emit('market:update', overview);
      socket.emit('market:regime', overview.marketRegime);
      socket.emit('index:update', overview.indices);
      socket.emit('sector:update', overview.sectors);
      socket.emit('stock:update', overview.topBullish.concat(overview.topBearish));
    }).catch((e) => console.error('Error serving initial socket snapshot:', e.message));

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
  });
}

module.exports = { initMarketSocket };
