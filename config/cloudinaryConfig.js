// cloudinaryConfig.js
require('dotenv').config(); // Make sure this is at the top
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Debug: Log environment variables (remove in production)
console.log('Environment variables check:');
console.log('CLOUDINARY_CLOUD_NAME:', cloudName ? 'Set' : 'Missing');
console.log('CLOUDINARY_API_KEY:', apiKey ? 'Set' : 'Missing');
console.log('CLOUDINARY_API_SECRET:', apiSecret ? 'Set' : 'Missing');

// Validate credentials
if (!cloudName || !apiKey || !apiSecret) {
  const missing = [];
  if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
  
  console.error(`Missing Cloudinary configuration: ${missing.join(', ')}`);
  throw new Error(`Missing Cloudinary configuration: ${missing.join(', ')}`);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true, // Force HTTPS URLs
});

console.log('Cloudinary configured successfully');

// Test the configuration
const testCloudinaryConfig = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection test successful:', result);
  } catch (error) {
    console.error('Cloudinary connection test failed:', error.message);
  }
};

// Run test in development
if (process.env.NODE_ENV !== 'production') {
  testCloudinaryConfig();
}

module.exports = cloudinary;