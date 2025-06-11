const fsPromises = require('fs').promises; // For promise-based file operations
const fs = require('fs'); // For stream-based operations
const path = require('path');
const axios = require('axios');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const _ = require('lodash');
const cloudinary = require('../config/cloudinaryConfig');
const Product = require('../models/Product');

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
        await fsPromises.access(req.file.path);
        console.log('File verification successful');

        console.log('Starting Cloudinary upload...');
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'image',
          folder: 'ecommerce-products',
          timeout: 60000,
        });
        
        console.log('Cloudinary upload successful:', result.secure_url);
        productData.imageUrl = result.secure_url;

        try {
          await fsPromises.unlink(req.file.path);
          console.log('Temporary file deleted:', req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete temporary file:', unlinkError.message);
        }
      } catch (fileError) {
        console.error('File processing error:', fileError);
        try {
          await fsPromises.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError.message);
        }
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
    if (req.file) {
      try {
        await fsPromises.unlink(req.file.path);
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

    console.log('Received promotion:', JSON.stringify(req.body.promotion, null, 2));

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
      await fsPromises.access(req.file.path);
      console.log('File verification successful');

      console.log('Starting Cloudinary upload for dataset...');
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'raw',
        folder: 'ecommerce-datasets',
        timeout: 120000,
      });

      console.log('Dataset upload successful:', result.secure_url);
      product.datasetUrl = result.secure_url;
      await product.save();

      try {
        await fsPromises.unlink(req.file.path);
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
      try {
        await fsPromises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
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
    if (req.file) {
      try {
        await fsPromises.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file during error cleanup:', cleanupError.message);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const appendDummyData = async (req, res) => {
  const { productId } = req.params;

  try {
    // Find the product
    const product = await Product.findOne({ _id: productId, user: req.user });
    if (!product || !product.datasetUrl) {
      return res.status(404).json({ message: 'Product or dataset not found' });
    }

    // Get 10 random records from dummy data
    const dummyData = await new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream('./data.csv') // Use standard fs module
        .pipe(parse({ columns: true }))
        .on('data', (row) => data.push(row))
        .on('end', () => resolve(_.sampleSize(data, 10)))
        .on('error', (err) => reject(err));
    });

    // Download existing dataset from Cloudinary
    const response = await axios.get(product.datasetUrl, { responseType: 'stream' });
    const tempFilePath = path.join('uploads', `temp-${Date.now()}.csv`);
    const writer = fs.createWriteStream(tempFilePath); // Use standard fs module
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Parse existing dataset
    const existingData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(tempFilePath) // Use standard fs module
        .pipe(parse({ columns: true }))
        .on('data', (row) => existingData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // Verify column compatibility
    const dummyColumns = Object.keys(dummyData[0] || {});
    const existingColumns = Object.keys(existingData[0] || {});
    if (!dummyColumns.every(col => existingColumns.includes(col))) {
      await fsPromises.unlink(tempFilePath);
      return res.status(400).json({ message: 'Column mismatch between dummy data and existing dataset' });
    }

    // Append dummy data
    const updatedData = [...existingData, ...dummyData];

    // Write updated CSV
    const updatedFilePath = path.join('uploads', `updated-${Date.now()}.csv`);
    await new Promise((resolve, reject) => {
      stringify(updatedData, { header: true }, (err, output) => {
        if (err) return reject(err);
        fsPromises.writeFile(updatedFilePath, output)
          .then(resolve)
          .catch(reject);
      });
    });

    // Upload updated CSV to Cloudinary
    const result = await cloudinary.uploader.upload(updatedFilePath, {
      resource_type: 'raw',
      folder: 'ecommerce-datasets',
      timeout: 120000,
      public_id: `ecommerce-datasets/updated-${Date.now()}`
    });

    // Update product with new dataset URL
    product.datasetUrl = result.secure_url;
    await product.save();

    // Clean up temporary files
    await fsPromises.unlink(tempFilePath);
    await fsPromises.unlink(updatedFilePath);

    res.status(200).json({
      message: 'Dummy data appended successfully',
      datasetUrl: result.secure_url,
      product,
    });
  } catch (error) {
    console.error('Append Dummy Data Error:', error.message, error.stack);
    if (fsPromises.existsSync(tempFilePath)) {
      await fsPromises.unlink(tempFilePath).catch(err => console.error('Cleanup error:', err.message));
    }
    if (fsPromises.existsSync(updatedFilePath)) {
      await fsPromises.unlink(updatedFilePath).catch(err => console.error('Cleanup error:', err.message));
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
  getProductById,
  appendDummyData
};