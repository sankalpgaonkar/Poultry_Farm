const express = require('express');
const router = express.Router();
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { getSchemes, getBuyerMatches, getDailyReport } = require('../controllers/smartController');

router.get('/schemes', protect, getSchemes);
router.get('/buyer-matches', protect, farmerOnly, getBuyerMatches);
router.get('/daily-report', protect, farmerOnly, getDailyReport);

module.exports = router;
