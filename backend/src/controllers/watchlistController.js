const Watchlist = require('../models/Watchlist');
const stockScannerService = require('../services/stockScannerService');

const DEFAULT_USER_ID = 'default_guest';

exports.getWatchlist = async (req, res) => {
  try {
    let list = await Watchlist.findOne({ userId: DEFAULT_USER_ID });
    if (!list) {
      list = await Watchlist.create({ userId: DEFAULT_USER_ID, symbols: ['RELIANCE', 'HDFCBANK', 'TCS', 'SBIN'] });
    }

    const allScanned = await stockScannerService.scanAllStocks('5m');
    const stockMap = new Map(allScanned.stocks.map((s) => [s.symbol, s]));

    const watchlistItems = list.symbols
      .map((sym) => stockMap.get(sym.toUpperCase()))
      .filter(Boolean);

    res.json({ success: true, symbols: list.symbols, items: watchlistItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addSymbol = async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ success: false, message: 'Symbol is required' });

    const symUpper = symbol.toUpperCase().trim();
    let list = await Watchlist.findOne({ userId: DEFAULT_USER_ID });
    if (!list) {
      list = new Watchlist({ userId: DEFAULT_USER_ID, symbols: [] });
    }

    if (!list.symbols.includes(symUpper)) {
      list.symbols.push(symUpper);
      await list.save();
    }

    res.json({ success: true, message: `Added ${symUpper} to watchlist`, symbols: list.symbols });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeSymbol = async (req, res) => {
  try {
    const { symbol } = req.params;
    const symUpper = symbol.toUpperCase().trim();

    let list = await Watchlist.findOne({ userId: DEFAULT_USER_ID });
    if (list) {
      list.symbols = list.symbols.filter((s) => s !== symUpper);
      await list.save();
    }

    res.json({ success: true, message: `Removed ${symUpper} from watchlist`, symbols: list ? list.symbols : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
