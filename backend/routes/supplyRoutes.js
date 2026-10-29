const express = require('express');
const { placeSupplyOrder, getMySupplyOrders, receiveSupplyOrder } = require('../controllers/supplyController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam, supply } = require('../validation/schemas');

const router = express.Router();
router.use(protect);
router.post('/order', validate({ body: supply.order }), placeSupplyOrder);
router.get('/my-orders', getMySupplyOrders);
router.put('/:id/receive', validate({ params: idParam }), receiveSupplyOrder);

module.exports = router;
