const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Farm = require('../models/Farm');
const Inventory = require('../models/Inventory');
const EggProductionLog = require('../models/EggProductionLog');

// GET /api/smart/schemes  - government schemes for poultry farmers in India (reference list)
const getSchemes = async (req, res) => {
  res.json([
    { id: 1, title: 'National Livestock Mission (NLM)', description: 'Central scheme that supports poultry entrepreneurship, including capital subsidy for eligible poultry units.', region: 'India', benefits: ['Capital Subsidy', 'Training'], url: 'https://www.dahd.gov.in/' },
    { id: 2, title: 'Poultry Venture Capital Fund', description: 'Financial assistance through banks to individuals and groups setting up poultry units.', region: 'India', benefits: ['Bank Loan Support', 'Operational Support'], url: 'https://www.dahd.gov.in/' },
    { id: 3, title: 'Rural Backyard Poultry Development', description: 'Support for backyard poultry, including distribution of chicks to eligible rural families.', region: 'India', benefits: ['Chicks', 'Starter Support'], url: 'https://www.dahd.gov.in/' },
  ]);
};

/**
 * GET /api/smart/buyer-matches
 * Real matches: buyers on the platform who have ordered the kinds of products this farmer sells,
 * ranked by how much and how recently they bought. (No invented buyers.)
 */
const getBuyerMatches = async (req, res, next) => {
  try {
    const myCategories = await Listing.distinct('category', { farmer: req.user._id });
    if (!myCategories.length) return res.json([]);
    const listingIds = await Listing.find({ category: { $in: myCategories } }).distinct('_id');
    const rows = await Order.aggregate([
      { $match: { listing: { $in: listingIds }, buyer: { $ne: req.user._id }, status: { $ne: 'Rejected' } } },
      { $group: {
        _id: '$buyer',
        orders: { $sum: 1 },
        totalQty: { $sum: '$quantityOrdered' },
        totalSpent: { $sum: '$totalPrice' },
        boughtFromMe: { $max: { $cond: [{ $eq: ['$farmer', req.user._id] }, 1, 0] } },
        lastOrder: { $max: '$createdAt' },
      } },
      { $sort: { boughtFromMe: -1, orders: -1, lastOrder: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ]);
    const maxOrders = Math.max(1, ...rows.map((r) => r.orders));
    res.json(rows.map((r) => ({
      id: r._id,
      name: r.user.name,
      neededQuantity: Math.round(r.totalQty / r.orders),
      offeredPrice: r.totalQty ? Math.round((r.totalSpent / r.totalQty) * 100) / 100 : 0,
      orders: r.orders,
      boughtFromYou: Boolean(r.boughtFromMe),
      matchScore: Math.min(100, Math.round(50 + 40 * (r.orders / maxOrders) + (r.boughtFromMe ? 10 : 0))),
      lastOrder: r.lastOrder,
    })));
  } catch (error) {
    next(error);
  }
};

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** GET /api/smart/daily-report - computed from the farmer's own logs, stock and orders. */
const getDailyReport = async (req, res, next) => {
  try {
    const me = req.user._id;
    const since = new Date(Date.now() - 14 * 86_400_000);
    const [farms, logs, stock, pendingOrders] = await Promise.all([
      Farm.find({ farmer: me }).lean(),
      EggProductionLog.find({ farmer: me, date: { $gte: since } }).sort({ date: -1 }).lean(),
      Inventory.find({ farmer: me }).lean(),
      Order.countDocuments({ farmer: me, status: 'Pending' }),
    ]);

    const rate = (l) => (l.currentChickenCount > 0 ? (l.totalEggs / l.currentChickenCount) * 100 : null);
    const weekAgo = Date.now() - 7 * 86_400_000;
    const thisWeek = logs.filter((l) => new Date(l.date) >= weekAgo).map(rate).filter((x) => x !== null);
    const lastWeek = logs.filter((l) => new Date(l.date) < weekAgo).map(rate).filter((x) => x !== null);
    const efficiencyScore = thisWeek.length ? Math.round(avg(thisWeek)) : null;

    let summary;
    if (!farms.length) summary = 'Add your first farm to start getting a daily report.';
    else if (!thisWeek.length) summary = 'No egg records in the last 7 days. Record today\'s eggs to see your laying rate.';
    else {
      const diff = lastWeek.length ? avg(thisWeek) - avg(lastWeek) : 0;
      summary = `Average laying rate this week is ${avg(thisWeek).toFixed(1)}% (eggs per bird per day).` +
        (lastWeek.length ? ` That is ${Math.abs(diff).toFixed(1)} points ${diff >= 0 ? 'higher' : 'lower'} than the week before.` : '');
    }

    const actionItems = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (farms.length && !logs.some((l) => new Date(l.date) >= today)) actionItems.push('Record today\'s egg count.');
    for (const item of stock) {
      if (item.dailyConsumptionRate > 0) {
        const days = Math.floor(item.quantity / item.dailyConsumptionRate);
        if (days <= 7) actionItems.push(`${item.itemName} will run out in about ${days} day${days === 1 ? '' : 's'}. Reorder soon.`);
      } else if (item.quantity <= item.lowStockThreshold) {
        actionItems.push(`${item.itemName} is low (${item.quantity} ${item.unit} left).`);
      }
    }
    if (pendingOrders) actionItems.push(`${pendingOrders} marketplace order${pendingOrders === 1 ? ' is' : 's are'} waiting for your reply.`);
    const recentDeaths = logs.filter((l) => new Date(l.date) >= weekAgo).reduce((s, l) => s + (l.mortalityCount || 0), 0);
    if (recentDeaths > 0) actionItems.push(`${recentDeaths} bird${recentDeaths === 1 ? '' : 's'} died in the last 7 days. Check the Health tool if this is rising.`);
    if (!actionItems.length) actionItems.push('Nothing urgent today.');

    res.json({ date: new Date().toLocaleDateString('en-IN'), efficiencyScore, summary, actionItems });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSchemes, getBuyerMatches, getDailyReport };
