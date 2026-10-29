const express = require('express');
const { analyzeHealth } = require('../controllers/healthController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { health } = require('../validation/schemas');

const router = express.Router();
router.post('/analyze', protect, farmerOnly, validate({ body: health.analyze }), analyzeHealth);

module.exports = router;
