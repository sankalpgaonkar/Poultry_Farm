const express = require('express');
const { getFarms, createFarm, updateFarm, deleteFarm } = require('../controllers/farmController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam, farm } = require('../validation/schemas');

const router = express.Router();
router.use(protect, farmerOnly);
router.route('/')
  .get(getFarms)
  .post(validate({ body: farm.create }), createFarm);
router.route('/:id')
  .put(validate({ params: idParam, body: farm.update }), updateFarm)
  .delete(validate({ params: idParam }), deleteFarm);

module.exports = router;
