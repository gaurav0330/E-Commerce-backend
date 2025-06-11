const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getRandomData } = require('../controllers/dataController');
const { appendDummyData } = require('../controllers/productController');

router.get('/data', getRandomData);
router.post('/append/:productId', protect, appendDummyData);

module.exports = router;