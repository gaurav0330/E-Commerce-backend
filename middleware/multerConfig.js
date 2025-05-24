const multer = require('multer');
const path = require('path');

// Storage configuration for datasets
const datasetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
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