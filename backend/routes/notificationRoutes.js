const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam } = require('../validation/schemas');

const router = express.Router();
router.use(protect);

// GET /api/notifications  - the latest 30 alerts for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ items, unread: items.filter((n) => !n.isRead).length });
  } catch (error) { next(error); }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) { next(error); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', validate({ params: idParam }), async (req, res, next) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
