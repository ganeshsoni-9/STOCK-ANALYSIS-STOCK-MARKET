const express = require('express');
const router = express.Router();
const optionChainController = require('../controllers/optionChainController');

// GET /api/options/supported
router.get('/supported', optionChainController.getSupportedSymbols);

// GET /api/options/:symbol/supported
router.get('/:symbol/supported', optionChainController.checkSymbolSupported);

// GET /api/options/:symbol/expiries
router.get('/:symbol/expiries', optionChainController.getOptionExpiries);

// GET /api/options/:symbol?expiry=2026-09-24
router.get('/:symbol', optionChainController.getOptionChain);

module.exports = router;
