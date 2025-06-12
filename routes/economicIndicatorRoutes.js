const express = require('express');
const router = express.Router();
const {
  addEconomicIndicator,
  getEconomicIndicators,
  updateEconomicIndicator,
  deleteAllIndicators,
} = require('../controllers/economicIndicatorController');

// POST /api/economic-indicators
router.post('/', addEconomicIndicator);

// GET /api/economic-indicators
router.get('/', getEconomicIndicators);

// PATCH /api/economic-indicators
router.patch('/', updateEconomicIndicator);

router.delete('/reset', deleteAllIndicators);


module.exports = router;
