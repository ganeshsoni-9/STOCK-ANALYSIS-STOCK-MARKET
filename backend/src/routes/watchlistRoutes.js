const express = require('express');
const router = express.Router();
const watchlistController = require('../controllers/watchlistController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, watchlistController.getWatchlist);
router.post('/', authMiddleware.verifyToken, watchlistController.addSymbol);
router.delete('/:symbol', authMiddleware.verifyToken, watchlistController.removeSymbol);

module.exports = router;
