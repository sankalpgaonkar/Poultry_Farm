const express = require('express');
const { getLogs, createLog } = require('../controllers/logController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { log } = require('../validation/schemas');

const router = express.Router();
router.use(protect, farmerOnly);
router.route('/')
  .get(getLogs)
  .post(validate({ body: log.create }), createLog);

module.exports = router;
