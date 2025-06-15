const InventoryInput = require('../models/inventory');
const InventoryForecast = require('../models/InventoryForecast');

// 1️⃣ Submit Inventory
const submitInventoryInput = async (req, res) => {
  try {
    const { productId, stockQuantity, reorderThreshold = 20 } = req.body;

    const existing = await InventoryInput.findOne({ productId });

    if (existing) {
      existing.stockQuantity = stockQuantity;
      existing.reorderThreshold = reorderThreshold;
      await existing.save();
      return res.status(200).json({ message: 'Inventory updated' });
    }

    const newInput = new InventoryInput({ productId, stockQuantity, reorderThreshold });
    await newInput.save();

    res.status(201).json({ message: 'Inventory input saved' });
  } catch (error) {
    console.error('Error saving inventory input:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2️⃣ Save Prediction
const saveForecast = async (req, res) => {
  try {
    const { productId, prediction } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    // Validate prediction data
    if (!prediction || !Array.isArray(prediction.prediction) || prediction.prediction.length !== 365) {
      return res.status(400).json({ message: 'Prediction data must be an array of 365 numbers' });
    }

    // Validate startDate
    if (!prediction.startDate || isNaN(new Date(prediction.startDate))) {
      return res.status(400).json({ message: 'Invalid startDate' });
    }

    const input = await InventoryInput.findOne({ productId });
    if (!input) {
      return res.status(400).json({ message: 'No inventory input found for this product' });
    }

    const predicted30Days = prediction.prediction.slice(0, 30);
    const predictedSalesSum = predicted30Days.reduce((sum, val) => sum + val, 0);

    let stockStatus = 'Sufficient';
    if (input.stockQuantity < predictedSalesSum) {
      stockStatus = input.stockQuantity >= input.reorderThreshold ? 'Low Stock' : 'Out of Stock';
    }

    const existing = await InventoryForecast.findOne({ productId });
    if (existing) {
      existing.predictionData = prediction.prediction;
      existing.startDate = new Date(prediction.startDate);
      existing.stockStatus = stockStatus;
      await existing.save();
      return res.status(200).json({ message: 'Forecast updated', stockStatus });
    }

    const forecast = new InventoryForecast({
      productId,
      predictionData: prediction.prediction,
      startDate: new Date(prediction.startDate),
      stockStatus,
    });

    await forecast.save();
    res.status(201).json({ message: 'Forecast saved', stockStatus });
  } catch (error) {
    console.error('Error saving forecast:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getInventoryReport = async (req, res) => {
  try {
    const { productId } = req.params;

    const inventory = await InventoryInput.findOne({ productId });
    const forecast = await InventoryForecast.findOne({ productId });

    if (!inventory || !forecast) {
      return res.status(404).json({ message: 'Data not found for this product' });
    }

    const predicted30Days = forecast.predictionData.slice(0, 30);
    const predictedSalesSum = predicted30Days.reduce((sum, val) => sum + val, 0);

    const shortage = Math.max(predictedSalesSum - inventory.stockQuantity, 0);

    res.json({
      productId,
      stockQuantity: inventory.stockQuantity,
      reorderThreshold: inventory.reorderThreshold,
      startDate: forecast.startDate,
      prediction: predicted30Days,
      stockStatus: forecast.stockStatus,
      predicted30DayDemand: predictedSalesSum,
      shortage: shortage > 0 ? shortage : 0,
      message: shortage > 0
        ? `You are short by ${shortage} units to meet 30 days demand.`
        : 'Current stock is sufficient for the next 30 days.'
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  submitInventoryInput,
  saveForecast,
  getInventoryReport
};
