const Product = require('../models/Product');
const cloudinary = require('../config/cloudinaryConfig');
const fs = require('fs').promises; // For file system operations

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user }).sort({ dateAdded: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addProduct = async (req, res) => {
  const { name, category, subCategory, price, stock, description, brand } = req.body;

  try {
    // Validate required fields
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

    // Handle image upload to Cloudinary if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'image',
        folder: 'ecommerce-products',
      });
      productData.imageUrl = result.secure_url;

      // Delete the temporary file from uploads/
      await fs.unlink(req.file.path);
    }

    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    // If there's an error, attempt to delete the file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file:', cleanupError);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists and belongs to user
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, category, subCategory, promotion, competitors, price, stock, description, imageUrl, brand, ratings } = req.body;

  try {
    // Check if product exists and belongs to user
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    // Update fields
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
    // Check if product exists and belongs to user
    const product = await Product.findOne({ _id: id, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    // Delete the product
    await Product.deleteOne({ _id: id });

    res.status(200).json({ message: 'Product deleted successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadDataset = async (req, res) => {
  const { productId } = req.body;

  try {
    // Check if product exists and belongs to user
    const product = await Product.findOne({ _id: productId, user: req.user });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorized' });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw',
      folder: 'ecommerce-datasets',
    });

    // Update product with dataset URL
    product.datasetUrl = result.secure_url;
    await product.save();

    // Delete the temporary file from uploads/
    await fs.unlink(req.file.path);

    res.status(200).json({
      message: 'Dataset uploaded successfully',
      datasetUrl: result.secure_url,
      product,
    });
  } catch (error) {
    // If there's an error, attempt to delete the file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Failed to delete temporary file:', cleanupError);
      }
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProducts, addProduct, updateProduct, uploadDataset ,deleteProduct,getProductById};