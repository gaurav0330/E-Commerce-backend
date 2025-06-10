const Product = require('../models/Product');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs').promises;
const path = require('path');

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user }).sort({ dateAdded: -1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addProduct = async (req, res) => {
  const { product_name, category, subCategory, price, stock, description, brand } = req.body;

  try {
    if (!product_name || !category || !price || stock === undefined) {
      return res.status(400).json({ message: 'Name, category, price, and stock are required' });
    }

    const productData = {
      product_name,
      category,
      subCategory,
      price,
      stock,
      description,
      brand,
      user: req.user,
    };

    if (req.file) {
      console.log('File received:', req.file.path);
      
      try {
        // Verify file exists
        await fs.access(req.file.path);
        console.log('File verification successful');

        // Upload to Cloudinary with error handling
        console.log('Starting Cloudinary upload...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'image',
          folder: 'ecommerce-products',
          timeout: 60000, // 60 second timeout
        });
        
        console.log('Cloudinary upload successful:', result.secure_url);
        productData.imageUrl = result.secure_url;

        // Clean up temporary file
        try {
          await fs.unlink(req.file.path);
          console.log('Temporary file deleted:', req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete temporary file:', unlinkError.message);
        }
        
      } catch (fileError) {
        console.error('File processing error:', fileError);
        
        // Clean up file if it exists
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError.message);
        }
        
        // Check if it's a Cloudinary-specific error
        if (fileError.message.includes('api_key') || fileError.message.includes('Must supply')) {
          return res.status(500).json({ 
            message: 'Cloudinary configuration error', 
            error: 'Image upload service is not properly configured. Please check server configuration.' 
          });
        }
        
        throw fileError;
      }
    }

    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
    
  } catch (error) {
    console.error('Add product error:', error);
    
    // Clean up file if upload failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file during error cleanup:', cleanupError.message);
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    product_name,
    category,
    subCategory,
    start_date,
    end_date,
    discount,
    price,
    stock,
    description,
    imageUrl,
    brand,
    ratings,
    Dataset,
    datasetUrl,
    market_demand,
    promotion,
    historical_data,
    seasonal_trends,
    economic_indicators,
    competitor_analysis,
    predictions,
  } = req.body;

  try {
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    // Log promotion to debug
    console.log('Received promotion:', JSON.stringify(req.body.promotion, null, 2));

    // Update fields only if provided
    if (product_name !== undefined) product.product_name = product_name;
    if (category !== undefined) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (start_date !== undefined) product.start_date = start_date;
    if (end_date !== undefined) product.end_date = end_date;
    if (discount !== undefined) product.discount = discount;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (description !== undefined) product.description = description;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (brand !== undefined) product.brand = brand;
    if (ratings !== undefined) product.ratings = ratings;
    if (Dataset !== undefined) {
      product.Dataset = Dataset;
      product.markModified('Dataset');
    }
    if (datasetUrl !== undefined) product.datasetUrl = datasetUrl;
    if (market_demand !== undefined) product.market_demand = market_demand;
    if (promotion !== undefined) product.promotion = promotion;
    if (historical_data !== undefined) product.historical_data = historical_data;
    if (seasonal_trends !== undefined) product.seasonal_trends = seasonal_trends;
    if (economic_indicators !== undefined) product.economic_indicators = economic_indicators;
    if (competitor_analysis !== undefined) product.competitor_analysis = competitor_analysis;
    if (predictions !== undefined) product.predictions = predictions;

    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }
    
    await Product.deleteOne({ _id: id });
    res.status(200).json({ message: 'Product deleted successfully', product });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadDataset = async (req, res) => {
  const { productId } = req.body;

  try {
    console.log('Upload Dataset Request:', { productId, file: req.file ? req.file.filename : 'No file' });

    const product = await Product.findOne({ _id: productId, user: req.user });
    if (!product) {
      console.log('Product not found or not authorized:', { productId, user: req.user });
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Processing file:', req.file.path);
    
    try {
      // Verify file exists
      await fs.access(req.file.path);
      console.log('File verification successful');

      // Upload to Cloudinary
      console.log('Starting Cloudinary upload for dataset...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'raw',
        folder: 'ecommerce-datasets',
        timeout: 120000, // 2 minute timeout for larger files
      });

      console.log('Dataset upload successful:', result.secure_url);
      product.datasetUrl = result.secure_url;
      await product.save();

      // Clean up temporary file
      try {
        await fs.unlink(req.file.path);
        console.log('Temporary file deleted:', req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete temporary file:', unlinkError.message);
      }

      res.status(200).json({
        message: 'Dataset uploaded successfully',
        datasetUrl: result.secure_url,
        product,
      });
      
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Clean up file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
      
      // Handle Cloudinary-specific errors
      if (uploadError.message.includes('api_key') || uploadError.message.includes('Must supply')) {
        return res.status(500).json({ 
          message: 'Cloudinary configuration error', 
          error: 'File upload service is not properly configured. Please check server configuration.' 
        });
      }
      
      throw uploadError;
    }
    
  } catch (error) {
    console.error('Upload Dataset Error:', error.message, error.stack);
    
    // Clean up file if something went wrong
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file during error cleanup:', cleanupError.message);
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  getProducts, 
  addProduct, 
  updateProduct, 
  uploadDataset, 
  deleteProduct, 
  getProductById 
};