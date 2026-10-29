const express = require('express');
const { calculateProfit } = require('../controllers/financeController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { finance } = require('../validation/schemas');

const router = express.Router();
router.post('/calculate', protect, farmerOnly, validate({ body: finance.calculate }), calculateProfit);

module.exports = router;
