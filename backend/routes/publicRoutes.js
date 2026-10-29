const express = require('express');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const EggProductionLog = require('../models/EggProductionLog');

const router = express.Router();
let cached = null; // { at, data }

// GET /api/public/stats  - real counts from the database for the landing page (no login needed).
// `demo` is true when the demo seed's accounts exist, so the page can label the numbers as demo data.
router.get('/stats', async (req, res, next) => {
  try {
    if (cached && Date.now() - cached.at < 60_000) return res.json(cached.data);
    const [farmers, buyers, listings, delivered, eggs, demoUsers] = await Promise.all([
      User.countDocuments({ role: 'Farmer' }),
      User.countDocuments({ role: 'Buyer' }),
      Listing.countDocuments({ isAvailable: true }),
      Order.countDocuments({ status: 'Completed' }),
      EggProductionLog.aggregate([{ $group: { _id: null, total: { $sum: '$totalEggs' } } }]),
      User.countDocuments({ email: /@demo\.poultrysmart$/ }),
    ]);
    const data = { farmers, buyers, listings, delivered, eggsLogged: eggs[0]?.total || 0, demo: demoUsers > 0 };
    cached = { at: Date.now(), data };
    res.json(data);
  } catch (error) { next(error); }
});

module.exports = router;
