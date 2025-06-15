const express = require('express');
const router = express.Router();
const {
  submitInventoryInput,
  saveForecast,
  getInventoryInput,
  getForecast,
  getInventoryReport
} = require('../controllers/inventoryController');

// Route 1: Admin inputs stock
router.post('/input', submitInventoryInput);

// Route 2: Store prediction data
router.post('/predict', saveForecast);

// Route 3: Get inventory input by productId
router.get('/input/:productId', getInventoryInput);

// Route 4: Get forecast by productId
router.get('/predict/:productId', getForecast);

// Route 5: Get merged report
router.get('/report/:productId', getInventoryReport);

module.exports = router;