const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema({
  gdp: {
    type: Map,
    of: [Number],
    default: {},
  },
  unemployment_rate: {
    type: Map,
    of: [Number],
    default: {},
  },
  inflation_rate: {
    type: Map,
    of: [Number],
    default: {},
  },
  consumer_confidence_index: {
    type: Map,
    of: [Number],
    default: {},
  },
  interest_rate: {
    type: Map,
    of: [Number],
    default: {},
  },
  exchange_rate: {
    type: Map,
    of: [Number],
    default: {},
  },
  stock_market_index: {
    type: Map,
    of: [Number],
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model('EconomicIndicator', indicatorSchema);
