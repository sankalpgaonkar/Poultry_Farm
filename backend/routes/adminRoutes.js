const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const CommunityPost = require('../models/CommunityPost');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/schemas');
const { httpError } = require('../middleware/errorMiddleware');

const router = express.Router();
router.use(protect, adminOnly);

// GET /api/admin/overview  - platform totals, order pipeline, open problems and newest users
router.get('/overview', async (req, res, next) => {
  try {
    const [farmers, buyers, listings, posts, byStatus, gmv, openIssues, recentUsers] = await Promise.all([
      User.countDocuments({ role: 'Farmer' }),
      User.countDocuments({ role: 'Buyer' }),
      Listing.countDocuments({ isAvailable: true }),
      CommunityPost.countDocuments(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { status: 'Completed' } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
      Order.find({ 'issue.status': 'Open' }).sort({ 'issue.createdAt': -1 }).limit(20)
        .populate('listing', 'productName image').populate('buyer', 'name').populate('farmer', 'name').populate('issue.reportedBy', 'name role').lean(),
      User.find({ role: { $ne: 'Admin' } }).sort({ createdAt: -1 }).limit(8).select('name role createdAt').lean(),
    ]);
    res.json({
      totals: { farmers, buyers, listings, posts, completedValue: gmv[0]?.total || 0 },
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
      openIssues,
      recentUsers,
    });
  } catch (error) { next(error); }
});

// PUT /api/admin/orders/:id/resolve  - an admin closes a reported problem
router.put('/orders/:id/resolve', validate({ params: idParam }), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found');
    if (!order.issue || order.issue.status !== 'Open') throw httpError(400, 'There is no open problem on this order.');
    order.issue.status = 'Resolved';
    order.issue.resolvedAt = new Date();
    res.json(await order.save());
  } catch (error) { next(error); }
});

module.exports = router;
