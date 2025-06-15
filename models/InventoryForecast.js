const mongoose = require('mongoose');

const inventoryForecastSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
    unique: true
  },
  predictionData: {
    type: [Number], 
    required: true
  },
  analysis: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  stockStatus: {
    type: String,
    enum: ['Sufficient', 'Low Stock', 'Out of Stock'],
    required: true
  },
  monthlyAggregates: {
    type: [Number], // 12 months
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


module.exports = mongoose.model('InventoryForecast', inventoryForecastSchema);
