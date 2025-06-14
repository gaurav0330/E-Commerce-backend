const mongoose = require('mongoose');

const inventoryForecastSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
    unique: true
  },
  predictionData: {
    type: [Number], // 365-day prediction
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  stockStatus: {
    type: String,
    enum: ['Sufficient', 'Low Stock', 'Out of Stock'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InventoryForecast', inventoryForecastSchema);
