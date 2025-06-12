const express = require('express');
const router = express.Router();
const {
  addEconomicIndicator,
  getEconomicIndicators,
} = require('../controllers/economicIndicatorController');

// POST /api/economic-indicators
router.post('/', addEconomicIndicator);

// GET /api/economic-indicators
router.get('/', getEconomicIndicators);

module.exports = router;
