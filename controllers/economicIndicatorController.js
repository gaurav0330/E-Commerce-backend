const EconomicIndicator = require('../models/economicIndicatorModel');

// POST: Add new economic indicator
exports.addEconomicIndicator = async (req, res) => {
  try {
    const existing = await EconomicIndicator.findOne();
    if (existing) {
      return res.status(400).json({ error: 'Economic indicator already exists. Use PATCH to update.' });
    }

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
      economic_indicators: {}
    };

    data.forEach(entry => {
      Object.keys(entry._doc).forEach(key => {
        if (key === '_id' || key === 'createdAt' || key === '__v') return;

        // Initialize the outer object
        if (!result.economic_indicators[key]) {
          result.economic_indicators[key] = {};
        }

        const map = entry[key];
        if (map instanceof Map || typeof map === 'object') {
          for (const [year, values] of map.entries?.() || Object.entries(map)) {
            if (!result.economic_indicators[key][year]) {
              result.economic_indicators[key][year] = [];
            }
            result.economic_indicators[key][year].push(...values);
          }
        }
      });
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH: Update values inside the single EconomicIndicator document
exports.updateEconomicIndicator = async (req, res) => {
  try {
    const updates = req.body;

    const indicator = await EconomicIndicator.findOne();

    if (!indicator) {
      return res.status(404).json({ error: 'Economic indicator document not found' });
    }

    for (const key in updates) {
      if (indicator[key]) {
        for (const year in updates[key]) {
          const yearData = updates[key][year];

          // If the Map doesn't contain the year, set it
          if (!indicator[key].has(year)) {
            indicator[key].set(year, []);
          }

          // Merge new values
          const existingValues = indicator[key].get(year);
          indicator[key].set(year, [...existingValues, ...yearData]);
        }
      }
    }

    const saved = await indicator.save();
    res.status(200).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE all economic indicators
exports.deleteAllIndicators = async (req, res) => {
  try {
    await EconomicIndicator.deleteMany({});
    res.status(200).json({ message: 'All indicators deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




