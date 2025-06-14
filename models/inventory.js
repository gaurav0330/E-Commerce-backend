const mongoose = require('mongoose');

const inventoryInputSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product', // assuming you have a Product model
    unique: true // only one inventory input per product
  },
  stockQuantity: {
    type: Number,
    required: true
  },
  reorderThreshold: {
    type: Number,
    default: 20
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InventoryInput', inventoryInputSchema);
