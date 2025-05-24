const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Function to ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads'); // Match controller path
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Creating uploads directory...');
      await fs.mkdir(uploadsDir, { recursive: true });
    } else {
      throw error;
    }
  }
};

// Initialize the uploads directory when this module is loaded
ensureUploadsDir().catch(err => {
  console.error('Failed to create uploads directory:', err);
});

// Storage configuration for datasets
const datasetStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureUploadsDir();
      cb(null, 'uploads/');
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const datasetFileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.json', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, JSON, and Excel files are allowed'), false);
  }
};

const uploadDatasetM = multer({
  storage: datasetStorage,
  fileFilter: datasetFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

// Storage configuration for images
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await ensureUploadsDir();
      cb(null, 'uploads/');
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPEG, and JPG files are allowed'), false);
  }
};

const uploadImageM = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

module.exports = { uploadDatasetM, uploadImageM };