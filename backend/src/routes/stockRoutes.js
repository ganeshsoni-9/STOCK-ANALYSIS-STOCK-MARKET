const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

router.get('/', stockController.getAllStocks);
router.get('/gainers', stockController.getGainers);
router.get('/losers', stockController.getLosers);
router.get('/bullish', stockController.getBullish);
router.get('/bearish', stockController.getBearish);
router.get('/:symbol', stockController.getStockDetails);
router.get('/:symbol/candles', stockController.getCandles);
router.get('/:symbol/analysis', stockController.getAnalysis);

module.exports = router;
