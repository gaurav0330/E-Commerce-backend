const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subCategory: {
    type: String,
    required: false,
  },
  promotion: [
    {
      date: {
        type: Date,
        required: true,
      },
      duration: {
        type: Number, // e.g., duration in days or hours
        required: true,
      },
      area: {
        type: String, // e.g., geographic area
        required: true,
      },
      platform: {
        type: String, // e.g., Amazon, eBay
        required: true,
      },
    },
  ],
  competitors: [
    {
      price: {
        type: Number,
        required: true,
      },
      discount: {
        type: Number, // e.g., percentage or amount
        required: true,
      },
      sales: {
        type: Number, // e.g., units sold
        required: true,
      },
      marketShare: {
        type: Number, // e.g., percentage
        required: true,
      },
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  description: {
    type: String,
    required: false,
  },
  imageUrl: {
    type: String,
    required: false,
    default: '',
  },
  brand: {
    type: String,
    required: false,
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  datasetUrl: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Product', productSchema);