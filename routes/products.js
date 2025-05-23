const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProducts ,addProduct} = require('../controllers/productController');

router.get('/', protect, getProducts);
router.post('/', protect, addProduct);

module.exports = router;