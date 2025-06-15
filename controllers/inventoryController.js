const mongoose = require("mongoose");
const InventoryInput = require("../models/inventory");
const InventoryForecast = require("../models/InventoryForecast");
const { sendEmail } = require("../services/emailServices");
const User = require("../models/User");

const submitInventoryInput = async (req, res) => {
  try {
    const { productId, stockQuantity, reorderThreshold = 20 } = req.body;

    const existing = await InventoryInput.findOne({ productId });

    if (existing) {
      existing.stockQuantity = stockQuantity;
      existing.reorderThreshold = reorderThreshold;
      await existing.save();
      return res.status(200).json({ message: "Inventory updated" });
    }

    const newInput = new InventoryInput({
      productId,
      stockQuantity,
      reorderThreshold,
    });
    await newInput.save();

    res.status(201).json({ message: "Inventory input saved" });
  } catch (error) {
    console.error("Error saving inventory input:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const saveForecast = async (req, res) => {
  try {
    const { productId, prediction } = req.body;

    // Validate product and get inventory input
    const input = await InventoryInput.findOne({ productId });
    if (!input) {
      return res
        .status(400)
        .json({ message: "No inventory input found for this product" });
    }

    // Compute 30-day predicted sales sum
    const predicted30Days = prediction.predictions.slice(0, 30);
    const predictedSalesSum = predicted30Days.reduce(
      (sum, val) => sum + val,
      0
    );

    // Determine stock status
    let stockStatus = "Sufficient";
    if (input.stockQuantity < predictedSalesSum) {
      stockStatus =
        input.stockQuantity >= input.reorderThreshold
          ? "Low Stock"
          : "Out of Stock";
    }

    // Send notification to admins if stock is low or out
    if (stockStatus === "Low Stock" || stockStatus === "Out of Stock") {
      const admins = await User.find({ role: "Admin" }).select(
        "email username"
      );
      for (const admin of admins) {
        const message =
          `Dear ${admin.username || admin.email},\n\n` +
          `The inventory for product ID ${productId} is ${
            stockStatus === "Low Stock" ? "running low" : "out of stock"
          }.\n` +
          `Current stock: ${
            input.stockQuantity
          }, Predicted 30-day demand: ${predictedSalesSum.toFixed(2)}.\n\n` +
          `Please restock soon to avoid disruptions.\n\nBest,\nE-Commerce Team`;

        await sendEmail(
          admin.email,
          `Inventory Alert: Product ${stockStatus}`,
          message
        );
      }
    }

    // Calculate monthly aggregates (approx. 30 days per month)
    const monthlyAggregates = [];
    for (let i = 0; i < 12; i++) {
      const monthSum = prediction.predictions
        .slice(i * 30, (i + 1) * 30)
        .reduce((sum, val) => sum + val, 0);
      monthlyAggregates.push(monthSum);
    }

    // Update or create forecast
    const existing = await InventoryForecast.findOne({ productId });
    if (existing) {
      existing.predictionData = prediction.predictions;
      existing.analysis = prediction.analysis;
      existing.startDate = new Date(prediction.start_date);
      existing.endDate = new Date(prediction.end_date);
      existing.stockStatus = stockStatus;
      existing.monthlyAggregates = monthlyAggregates;
      await existing.save();
      return res.status(200).json({ message: "Forecast updated", stockStatus });
    }

    const forecast = new InventoryForecast({
      productId,
      predictionData: prediction.predictions,
      analysis: prediction.analysis,
      startDate: new Date(prediction.start_date),
      endDate: new Date(prediction.end_date),
      stockStatus,
      monthlyAggregates,
    });

    await forecast.save();
    res.status(201).json({ message: "Forecast saved", stockStatus });
  } catch (error) {
    console.error("Error saving forecast:", error.message, error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getInventoryInput = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const inventoryInput = await InventoryInput.findOne({ productId }).lean();
    if (!inventoryInput) {
      return res
        .status(404)
        .json({ message: "Inventory input not found for this product" });
    }

    res.status(200).json({
      message: "Inventory input retrieved",
      data: {
        productId: inventoryInput.productId,
        stockQuantity: inventoryInput.stockQuantity,
        reorderThreshold: inventoryInput.reorderThreshold,
      },
    });
  } catch (error) {
    console.error(
      "Error retrieving inventory input:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getForecast = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const forecast = await InventoryForecast.findOne({ productId }).lean();
    if (!forecast) {
      return res
        .status(404)
        .json({ message: "Forecast not found for this product" });
    }

    res.status(200).json({
      message: "Forecast retrieved",
      forecast : forecast
    });
  } catch (error) {
    console.error("Error retrieving forecast:", error.message, error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    // Fetch both InventoryInput and InventoryForecast
    const [inventoryInput, forecast] = await Promise.all([
      InventoryInput.findOne({ productId }).lean(),
      InventoryForecast.findOne({ productId }).lean(),
    ]);

    // Check if at least one document exists
    if (!inventoryInput && !forecast) {
      return res
        .status(404)
        .json({
          message: "No inventory input or forecast found for this product",
        });
    }

    // Build the response
    const report = {
      productId,
      inventory: inventoryInput
        ? {
            stockQuantity: inventoryInput.stockQuantity,
            reorderThreshold: inventoryInput.reorderThreshold,
          }
        : null,
      forecast: forecast
        ? {
            predictionData: forecast.predictionData.slice(0, 30),
            startDate: forecast.startDate,
            stockStatus: forecast.stockStatus,
            createdAt: forecast.createdAt,
          }
        : null,
    };

    res.status(200).json({
      message: "Inventory report retrieved",
      data: report,
    });
  } catch (error) {
    console.error(
      "Error retrieving inventory report:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  submitInventoryInput,
  saveForecast,
  getInventoryInput,
  getForecast,
  getInventoryReport,
};
