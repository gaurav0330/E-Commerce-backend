const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProducts } = require('../controllers/productController');

router.get('/', protect, getProducts);

module.exports = router;