const optionChainService = require('../services/optionChainService');

exports.getSupportedSymbols = (req, res, next) => {
  try {
    const symbols = optionChainService.getSupportedSymbols();
    res.json({
      success: true,
      count: symbols.length,
      symbols
    });
  } catch (err) {
    next(err);
  }
};

exports.checkSymbolSupported = (req, res, next) => {
  try {
    const { symbol } = req.params;
    const isSupported = optionChainService.isOptionChainSupported(symbol);
    res.json({
      success: true,
      symbol: symbol?.toUpperCase(),
      isSupported
    });
  } catch (err) {
    next(err);
  }
};

exports.getOptionExpiries = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const data = await optionChainService.getOptionExpiries(symbol);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOptionChain = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { expiry } = req.query;

    const data = await optionChainService.getOptionChain(symbol, expiry);
    if (!data.success) {
      return res.status(200).json(data);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};
