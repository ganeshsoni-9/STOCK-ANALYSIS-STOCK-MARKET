const mongoose = require('mongoose');
const { getMarketStatus } = require('../utils/marketHours');

exports.getHealth = async (req, res) => {
  try {
    const mongoState = mongoose.connection.readyState;
    const mongoStatusMap = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    const marketStatus = getMarketStatus();

    res.json({
      success: true,
      status: 'ONLINE',
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage()
      },
      services: {
        marketDataMode: process.env.MARKET_DATA_MODE || 'mock',
        brokerProvider: process.env.BROKER_PROVIDER || 'mock',
        mongoDB: mongoStatusMap[mongoState] || 'Unknown',
        marketTiming: marketStatus.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
