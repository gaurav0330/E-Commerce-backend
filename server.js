const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const dataRoutes = require('./routes/dummy');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const Product = require('./models/Product');
const { appendDummyDataToProduct } = require('./controllers/productController'); // Import the direct function

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dummydata', dataRoutes);

const generateCronToken = () => {
  const payload = { id: '6830bc44f93ca72fcf59ad92' };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Schedule task to append dummy data every 2 minutes
cron.schedule('*/24 * * * *', async () => {
  console.log('Running dummy data append task every 2 minutes...');
  try {
    const userId = '6830bc44f93ca72fcf59ad92';
    
    // Find products with datasetUrl - if no datasetUrl, skip entirely
    const products = await Product.find({ 
      user: userId,
      datasetUrl: { $exists: true, $ne: null, $ne: '' }
    });
    
    if (products.length === 0) {
      console.log('No valid products with datasetUrl found for user:', userId);
      return;
    }

    console.log(`Found ${products.length} products with datasets to process`);

    for (const product of products) {
      console.log(`Processing product: ${product._id} (${product.product_name || 'Unnamed'})`);
      try {
        const result = await appendDummyDataToProduct(product._id.toString(), userId);
        
        if (result && result.success) {
          console.log(`✅ Success for product ${product._id}: Dataset updated`);
        } else if (result && !result.success) {
          console.log(`⏭️  Skipped product ${product._id}: ${result.message}`);
        } else {
          console.log(`⚠️  Unknown result for product ${product._id}`);
        }
      } catch (err) {
        console.error(`❌ Failed to process product ${product._id}:`, err.message);
        // Continue with next product instead of stopping the entire process
        continue;
      }
    }
    
    console.log('✅ Dummy data append task completed successfully.');
  } catch (error) {
    console.error('❌ Error in dummy data append task:', error.message);
    // Don't log the full stack trace in production to keep logs clean
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
});

// Add environment variable validation
const validateEnvironment = () => {
  const requiredVars = ['JWT_SECRET', 'MONGO_URI'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
};

// Validate environment on startup
validateEnvironment();

// Add graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.log('⚠️  Forcing shutdown...');
    process.exit(1);
  }, 30000);
};

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('📅 Cron job scheduled: Every 2 minutes');
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;