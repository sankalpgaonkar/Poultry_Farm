const express = require('express');
const { getMarketRates, getWeather, getRateHistory } = require('../controllers/marketController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/rates', protect, getMarketRates);
router.get('/rates/history', protect, getRateHistory);
router.get('/weather', protect, getWeather);

module.exports = router;
