const multer = require('multer');
const path = require('path');

// Configure storage for both datasets and images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File filter for datasets (CSV, JSON, Excel)
const datasetFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV, JSON, and Excel are allowed.'), false);
  }
};

// File filter for images (PNG, JPEG, JPG)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPEG, and JPG are allowed.'), false);
  }
};

// Multer middleware for datasets
const uploadDatasetM = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit for datasets
  fileFilter: datasetFileFilter,
});

// Multer middleware for images
const uploadImageM = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for images
  fileFilter: imageFileFilter,
});

module.exports = { uploadDatasetM, uploadImageM };