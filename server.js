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
const { appendDummyData } = require('./controllers/productController');

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

// Schedule task to append dummy data every 5 minutes
cron.schedule('*/2 * * * *', async () => {
  console.log('Running dummy data append task every 5 minutes...');
  try {
    const userId = '6830bc44f93ca72fcf59ad92';
    const products = await Product.find({ 
      user: userId,
      datasetUrl: { $exists: true, $ne: null, $ne: '' }
    });
    if (products.length === 0) {
      console.log('No valid products with datasetUrl found for user:', userId);
      return;
    }

    const token = generateCronToken();

    for (const product of products) {
      console.log(`Appending dummy data for product: ${product._id}`);
      const req = {
        params: { productId: product._id.toString() },
        user: jwt.verify(token, process.env.JWT_SECRET).id,
      };
      const res = {
        status: (code) => ({
          json: (data) => {
            console.log(`Response for product ${product._id}:`, data);
          },
        }),
      };

      try {
        await appendDummyData(req, res);
      } catch (err) {
        console.error(`Failed to append dummy data for product ${product._id}:`, err.message);
      }
    }
    console.log('Dummy data append task completed.');
  } catch (error) {
    console.error('Error in dummy data append task:', error.message, error.stack);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));