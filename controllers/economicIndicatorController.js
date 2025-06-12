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
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
