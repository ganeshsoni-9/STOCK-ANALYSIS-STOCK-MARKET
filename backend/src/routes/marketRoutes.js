const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

router.get('/status', marketController.getStatus);
router.get('/regime', marketController.getRegime);
router.get('/indices', marketController.getIndices);
router.get('/breadth', marketController.getBreadth);
router.get('/sectors', marketController.getSectors);
router.get('/overview', marketController.getOverview);

router.get('/trade-plan', marketController.getTradePlan);
router.get('/trade-plan/:symbol', marketController.getTradePlan);
router.get('/index/:symbol/trade-plan', marketController.getTradePlan);

module.exports = router;

