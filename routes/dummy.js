const express = require('express');
const router = express.Router();
const { getRandomData } = require('../controllers/dataController');

router.get('/data', getRandomData);

module.exports = router;