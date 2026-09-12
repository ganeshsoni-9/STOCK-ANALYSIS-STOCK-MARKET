const marketService = require('../services/marketService');
const { getMarketStatus } = require('../utils/marketHours');

exports.getStatus = async (req, res) => {
  try {
    const status = getMarketStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRegime = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    res.json({ success: true, data: overview.marketRegime });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getIndices = async (req, res) => {
  try {
    const indices = await marketService.getIndices();
    res.json({ success: true, data: indices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBreadth = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    res.json({ success: true, data: overview.breadth });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSectors = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    res.json({ success: true, data: overview.sectors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const overview = await marketService.getMarketOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
