const EconomicIndicator = require('../models/economicIndicatorModel');

// POST: Add new economic indicator
exports.addEconomicIndicator = async (req, res) => {
  try {
    const newIndicator = new EconomicIndicator(req.body);
    const saved = await newIndicator.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET: Fetch all economic indicators
exports.getEconomicIndicators = async (req, res) => {
  try {
    const data = await EconomicIndicator.find();

    const result = {
      economic_indicators: {
        gdp: { '2018': [], '2019': [] },
        unemployment_rate: { '2018': [], '2019': [] },
        inflation_rate: { '2018': [], '2019': [] },
        consumer_confidence_index: { '2018': [], '2019': [] },
        interest_rate: { '2018': [], '2019': [] },
        exchange_rate: { '2018': [], '2019': [] },
        stock_market_index: { '2018': [], '2019': [] },
      }
    };

    // Aggregate all data into arrays by year
    data.forEach(entry => {
      Object.keys(result.economic_indicators).forEach(key => {
        result.economic_indicators[key]['2018'].push(...(entry[key]?.['2018'] || []));
        result.economic_indicators[key]['2019'].push(...(entry[key]?.['2019'] || []));
      });
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

