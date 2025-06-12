const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  datetime: Date,
  type: String,
}, { _id: false });

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  subCategory: {
    type: String,
    required: false,
  },
  start_date: {
    type: String,
    required: false,
  },
  end_date: {
    type: String,
    required: false,
  },
  discount: {
    type: Number,
    required: false,
  },
  price: {
    type: Number,
    required: false,
  },
  stock: {
    type: Number,
    required: false,
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
  Dataset: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {},
  },
  market_demand: {
    market_share: {
      own: Number,
      competitor: [
        {
          name: String,
          share: Number,
        },
      ],
    },
    product_demand: {
      '2018': [Number],
      '2019': [Number],
    },
  },
  promotion: {
    Competitor_promotion_effect: {
      type: Map,
      of: Number,
    },
    Old_promotion: [ promotionSchema],
    Upcoming_promotion: [promotionSchema],
  },
  historical_data: {
    Ecommerce_platform_rating: [
      {
        month: String,
        rating: Number,
      },
    ],
    Price_changes: {
      initial: Number,
      old: [
        {
          datetime: Date,
          price: Number,
          discount: Number,
        },
      ],
      upcoming: [
        {
          datetime: Date,
          price: Number,
          discount: Number,
        },
      ],
    },
    Old_dataset_url: [
      {
        Start: String,
        End: String,
        url: String,
      },
    ],
  },
  seasonal_trends: {
    highest_demand_months: {
      '2018': [Number],
      '2019': [Number],
    },
  },
  competitor_analysis: {
    competitors: [
      {
        name: String,
        market_share: Number,
        price: Number,
        product_demand: {
          '2018': [Number],
          '2019': [Number],
        },
      },
    ],
  },
  predictions: {
    accuracy: {
      '2018': Number,
      '2019': Number,
    },
    promotion_effect: {
      '2018': Number,
      '2019': Number,
    },
  },
});

module.exports = mongoose.model('Product', productSchema);