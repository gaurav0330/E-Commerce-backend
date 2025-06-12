const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema({
  gdp: {
    '2018': [Number],
    '2019': [Number],
  },
  unemployment_rate: {
    '2018': [Number],
    '2019': [Number],
  },
  inflation_rate: {
    '2018': [Number],
    '2019': [Number],
  },
  consumer_confidence_index: {
    '2018': [Number],
    '2019': [Number],
  },
  interest_rate: {
    '2018': [Number],
    '2019': [Number],
  },
  exchange_rate: {
    '2018': [Number],
    '2019': [Number],
  },
  stock_market_index: {
    '2018': [Number],
    '2019': [Number],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('EconomicIndicator', indicatorSchema);
