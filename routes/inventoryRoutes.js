const express = require('express');
const router = express.Router();
const {
  submitInventoryInput,
  saveForecast,
  getInventoryReport
} = require('../controllers/inventoryController');

// Route 1: Admin inputs stock
router.post('/input', submitInventoryInput);

// Route 2: Store prediction data
router.post('/predict', saveForecast);

// Route 3: Get merged report
router.get('/report/:productId', getInventoryReport);

module.exports = router;
