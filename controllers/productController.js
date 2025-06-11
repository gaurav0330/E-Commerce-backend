const fsPromises = require('fs').promises;
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const _ = require('lodash');
const cloudinary = require('../config/cloudinaryConfig');
const Product = require('../models/Product');

// Ensure uploads directory exists with consistent naming
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads'); // lowercase 'uploads'
  try {
    await fsPromises.access(uploadsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Creating uploads directory:', uploadsDir);
      await fsPromises.mkdir(uploadsDir, { recursive: true });
    } else {
      throw error;
    }
  }
  return uploadsDir;
};

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
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
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

const appendDummyDataToProduct = async (productId, user) => {
  let tempFilePath = null;
  let updatedFilePath = null;

  try {
    const uploadsDir = await ensureUploadsDir();

    const product = await Product.findOne({ _id: productId, user });
    if (!product) {
      console.log(`Product not found for ID: ${productId}`);
      throw new Error('Product not found');
    }

    if (!product.datasetUrl) {
      console.log(`No dataset URL found for product: ${productId}, skipping...`);
      return { success: false, message: 'No dataset found, skipping product' };
    }

    console.log(`Downloading dataset from: ${product.datasetUrl}`);
    
    // Read dummy data from data.csv
    const dummyData = await new Promise((resolve, reject) => {
      const data = [];
      const csvPath = path.join(__dirname, '..', 'data.csv');
      fs.createReadStream(csvPath)
        .pipe(parse({ columns: true }))
        .on('data', (row) => data.push(row))
        .on('end', () => {
          console.log(`Read ${data.length} rows from data.csv`);
          resolve(_.sampleSize(data, 10));
        })
        .on('error', (err) => {
          console.error(`Error reading ${csvPath}:`, err.message);
          reject(err);
        });
    });

    // Download existing dataset from Cloudinary
    const response = await axios.get(product.datasetUrl, { responseType: 'stream' });
    if (response.status !== 200) {
      throw new Error(`Cloudinary download failed: ${response.statusText}`);
    }

    // Use consistent lowercase 'uploads' directory
    tempFilePath = path.join(uploadsDir, `temp-${Date.now()}.csv`);
    const writer = fs.createWriteStream(tempFilePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`File downloaded to: ${tempFilePath}`);
        resolve();
      });
      writer.on('error', (err) => {
        console.error(`Error writing file to ${tempFilePath}:`, err.message);
        reject(err);
      });
      response.data.on('error', (err) => {
        console.error(`Error streaming data from Cloudinary:`, err.message);
        reject(err);
      });
    });

    // Verify file exists
    try {
      await fsPromises.access(tempFilePath);
      console.log(`Verified file exists: ${tempFilePath}`);
    } catch (err) {
      throw new Error(`Downloaded file not accessible: ${err.message}`);
    }

    // Parse existing data
    const existingData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(tempFilePath)
        .pipe(parse({ columns: true }))
        .on('data', (row) => existingData.push(row))
        .on('end', () => {
          console.log(`Parsed ${existingData.length} rows from existing dataset`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error parsing ${tempFilePath}:`, err.message);
          reject(err);
        });
    });

    // Check column compatibility
    const dummyColumns = Object.keys(dummyData[0] || {});
    const existingColumns = Object.keys(existingData[0] || {});
    if (!dummyColumns.every(col => existingColumns.includes(col))) {
      throw new Error('Column mismatch between dummy data and existing dataset');
    }

    // Combine data and write updated file
    const updatedData = [...existingData, ...dummyData];
    updatedFilePath = path.join(uploadsDir, `updated-${Date.now()}.csv`);
    
    await new Promise((resolve, reject) => {
      stringify(updatedData, { header: true }, (err, output) => {
        if (err) return reject(err);
        fsPromises.writeFile(updatedFilePath, output)
          .then(() => {
            console.log(`Updated CSV written to: ${updatedFilePath}`);
            resolve();
          })
          .catch((err) => {
            console.error(`Error writing ${updatedFilePath}:`, err.message);
            reject(err);
          });
      });
    });

    // Upload updated file to Cloudinary
    console.log('Uploading updated CSV to Cloudinary...');
    const result = await cloudinary.uploader.upload(updatedFilePath, {
      resource_type: 'raw',
      folder: 'ecommerce-datasets',
      timeout: 120000,
      public_id: `ecommerce-datasets/updated-${Date.now()}`
    });

    // Update product with new dataset URL
    product.datasetUrl = result.secure_url;
    await product.save();

    return { success: true, datasetUrl: result.secure_url, product };
  } catch (error) {
    console.error(`Error appending dummy data to product ${productId}:`, error.message);
    throw error;
  } finally {
    // Clean up temporary files
    if (tempFilePath) {
      try {
        if (fs.existsSync(tempFilePath)) {
          await fsPromises.unlink(tempFilePath);
          console.log(`Cleaned up temp file: ${tempFilePath}`);
        }
      } catch (cleanupError) {
        console.error('Cleanup error for temp file:', cleanupError.message);
      }
    }
    
    if (updatedFilePath) {
      try {
        if (fs.existsSync(updatedFilePath)) {
          await fsPromises.unlink(updatedFilePath);
          console.log(`Cleaned up updated file: ${updatedFilePath}`);
        }
      } catch (cleanupError) {
        console.error('Cleanup error for updated file:', cleanupError.message);
      }
    }
  }
};

const appendDummyData = async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await appendDummyDataToProduct(productId, req.user);
    
    if (!result.success) {
      return res.status(200).json({
        message: result.message,
        skipped: true
      });
    }

    res.status(200).json({
      message: 'Dummy data appended successfully',
      datasetUrl: result.datasetUrl,
      product: result.product,
    });
  } catch (error) {
    console.error(`Error in appendDummyData for product ${productId}:`, error.message);
    res.status(error.message.includes('Product not found') ? 404 : 500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = { 
  getProducts, 
  addProduct, 
  updateProduct, 
  uploadDataset, 
  deleteProduct, 
  getProductById,
  appendDummyData,
  appendDummyDataToProduct
};