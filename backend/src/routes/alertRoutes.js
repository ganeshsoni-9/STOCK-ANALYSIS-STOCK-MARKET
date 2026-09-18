const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.verifyToken, alertController.getAlerts);
router.post('/', authMiddleware.verifyToken, alertController.createAlert);
router.delete('/:id', authMiddleware.verifyToken, alertController.deleteAlert);

module.exports = router;
