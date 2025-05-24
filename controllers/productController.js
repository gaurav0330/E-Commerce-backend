const Product = require('../models/Product');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs').promises; // For file system operations
const path = require('path');

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user }).sort({ dateAdded: -1 });
    res.json(products);
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addProduct = async (req, res) => {
  const { name, category, subCategory, price, stock, description, brand } = req.body;

  try {
    if (!name || !category || !price || stock === undefined) {
      return res.status(400).json({ message: 'Name, category, price, and stock are required' });
    }

    const productData = {
      name,
      category,
      subCategory,
      price,
      stock,
      description,
      brand,
      user: req.user,
    };

    if (req.file) {
      console.log('File saved to:', req.file.path);
      // Verify file exists before uploading
      try {
        await fs.access(req.file.path);
      } catch (error) {
        console.error('File access error:', error.message);
        throw new Error('Uploaded file not found on server');
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'image',
        folder: 'ecommerce-products',
      });
      productData.imageUrl = result.secure_url;

      // Delete the temporary file
      try {
        await fs.unlink(req.file.path);
        console.log('Temporary file deleted:', req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete temporary file:', unlinkError.message);
      }
    }

    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file:', cleanupError.message);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, subCategory, promotion, competitors, price, stock, description, imageUrl, brand, ratings } = req.body;

  try {
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (subCategory) product.subCategory = subCategory;
    if (promotion) product.promotion = promotion;
    if (competitors) product.competitors = competitors;
    if (price) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (description) product.description = description;
    if (imageUrl) product.imageUrl = imageUrl;
    if (brand) product.brand = brand;
    if (ratings) product.ratings = ratings;

    await product.save();
    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadDataset = async (req, res) => {
  const { productId } = req.body;

  try {
    console.log('Upload Dataset Request:', { productId, file: req.file });

    const product = await Product.findOne({ _id: productId, user: req.user });
    if (!product) {
      console.log('Product not found or not authorized:', { productId, user: req.user });
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File saved to:', req.file.path);
    // Verify file exists before uploading
    try {
      await fs.access(req.file.path);
    } catch (error) {
      console.error('File access error:', error.message);
      throw new Error('Uploaded file not found on server');
    }

    console.log('Uploading file to Cloudinary:', req.file.path);
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw',
      folder: 'ecommerce-datasets',
    });

    product.datasetUrl = result.secure_url;
    await product.save();

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
  } catch (error) {
    console.error('Upload Dataset Error:', error.message, error.stack);
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file:', cleanupError.message);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProducts, addProduct, updateProduct, uploadDataset, deleteProduct, getProductById };
