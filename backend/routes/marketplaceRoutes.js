const express = require('express');
const c = require('../controllers/marketplaceController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam, marketplace } = require('../validation/schemas');

const router = express.Router();

// Everyone who is logged in
router.get('/', protect, c.getListings);
router.get('/total-listings', protect, c.getTotalListings);
router.get('/stats', protect, c.getMyStats);
router.post('/orders', protect, validate({ body: marketplace.order }), c.placeOrder);
router.get('/orders/me', protect, c.getBuyerOrders);
router.post('/orders/:id/report', protect, validate({ params: idParam, body: marketplace.report }), c.reportOrderIssue);
router.put('/orders/:id/report/resolve', protect, validate({ params: idParam }), c.resolveOrderIssue);

// Farmers only
router.post('/', protect, farmerOnly, validate({ body: marketplace.listing }), c.createListing);
router.get('/my-listings', protect, farmerOnly, c.getFarmerListings);
router.get('/orders', protect, farmerOnly, c.getFarmerOrders);
router.put('/orders/:id/status', protect, farmerOnly, validate({ params: idParam, body: marketplace.status }), c.updateOrderStatus);
router.delete('/:id', protect, farmerOnly, validate({ params: idParam }), c.deleteListing);

module.exports = router;
