const stockScannerService = require('../services/stockScannerService');
const marketService = require('../services/marketService');

exports.getAllStocks = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '5m';
    const overview = await marketService.getMarketOverview();
    const scanned = await stockScannerService.scanAllStocks(timeframe, overview.marketRegime);
    res.json({ success: true, data: scanned.stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGainers = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    const scanned = await stockScannerService.scanAllStocks('5m', overview.marketRegime);
    res.json({ success: true, data: scanned.topGainers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLosers = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    const scanned = await stockScannerService.scanAllStocks('5m', overview.marketRegime);
    res.json({ success: true, data: scanned.topLosers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBullish = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    const scanned = await stockScannerService.scanAllStocks('5m', overview.marketRegime);
    res.json({ success: true, data: scanned.topBullish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBearish = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    const scanned = await stockScannerService.scanAllStocks('5m', overview.marketRegime);
    res.json({ success: true, data: scanned.topBearish });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStockDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe || '5m';
    const count = parseInt(req.query.count || '150', 10);
    const details = await stockScannerService.getStockDetails(symbol, timeframe, count);
    res.json({ success: true, data: details });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

exports.getCandles = async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe || '5m';
    const count = parseInt(req.query.count || '150', 10);
    const candles = await stockScannerService.provider.getHistoricalCandles(symbol, timeframe, count);
    res.json({ success: true, data: candles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnalysis = async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = req.query.timeframe || '5m';
    const count = parseInt(req.query.count || '150', 10);
    const details = await stockScannerService.getStockDetails(symbol, timeframe, count);
    res.json({ success: true, data: { signalData: details.signalData, analysis: details.analysis } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
