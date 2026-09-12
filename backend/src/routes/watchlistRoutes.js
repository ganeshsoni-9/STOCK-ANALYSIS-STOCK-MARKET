const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');

router.get('/', watchlistController.getWatchlist);
router.post('/', watchlistController.addSymbol);
router.delete('/:symbol', watchlistController.removeSymbol);

module.exports = router;
