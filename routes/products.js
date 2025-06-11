const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProducts, addProduct, uploadDataset, updateProduct,deleteProduct,getProductById,appendDummyData } = require('../controllers/productController');
const { uploadDatasetM, uploadImageM } = require('../middleware/multerConfig');


router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);
router.post('/', protect, uploadImageM.single('image'), addProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/upload-dataset', protect, uploadDatasetM.single('dataset'), uploadDataset);
router.post('/api/dummydata/append/:productId', protect, appendDummyData);


module.exports = router;