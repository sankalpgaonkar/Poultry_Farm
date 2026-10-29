const Listing = require('../models/Listing');
const Order = require('../models/Order');
const { httpError } = require('../middleware/errorMiddleware');
const { checkFairPrice } = require('../utils/marketRates');

const inferCategory = (productName) => {
  const name = productName.toUpperCase();
  if (name.includes('EGG')) return 'EGG';
  if (['CHICK', 'HEN', 'BIRD', 'BROILER', 'LAYER', 'PULLET'].some((w) => name.includes(w))) return 'BIRD';
  if (['FEED', 'MASH', 'GRAIN', 'MAIZE'].some((w) => name.includes(w))) return 'FEED';
  if (['DRINKER', 'FEEDER', 'CAGE', 'EQUIPMENT', 'HEATER', 'LAMP'].some((w) => name.includes(w))) return 'EQUIPMENT';
  return 'OTHER';
};

// GET /api/marketplace  - active listings for everyone who is logged in
const getListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ isAvailable: true }).sort({ createdAt: -1 }).populate('farmer', 'name createdAt');
    res.json(listings);
  } catch (error) {
    next(error);
  }
};

// POST /api/marketplace  (farmer)
const createListing = async (req, res, next) => {
  try {
    const { productName, description, quantity, pricePerUnit, image, category } = req.body;
    const listing = await Listing.create({
      farmer: req.user._id,
      productName,
      description,
      quantity,
      pricePerUnit,
      image,
      category: category || inferCategory(productName),
    });
    // Fair Price Guard: tell the farmer (without blocking) when the price is far below the reference rate.
    const priceCheck = checkFairPrice({ productName, category: listing.category, pricePerUnit });
    res.status(201).json({ ...listing.toObject(), priceCheck });
  } catch (error) {
    next(error);
  }
};

// GET /api/marketplace/my-listings  (farmer)
const getFarmerListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ farmer: req.user._id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    next(error);
  }
};

// POST /api/marketplace/orders
// Stock is reserved with one atomic update, so two buyers can never oversell the same listing.
const placeOrder = async (req, res, next) => {
  try {
    const { listingId, quantityOrdered } = req.body;

    const listing = await Listing.findOneAndUpdate(
      { _id: listingId, isAvailable: true, quantity: { $gte: quantityOrdered }, farmer: { $ne: req.user._id } },
      { $inc: { quantity: -quantityOrdered } },
      { new: true }
    );

    if (!listing) {
      const existing = await Listing.findById(listingId);
      if (!existing || !existing.isAvailable) throw httpError(404, 'This listing is no longer available.');
      if (existing.farmer.equals(req.user._id)) throw httpError(400, 'You cannot order your own listing.');
      throw httpError(400, `Only ${existing.quantity} left in stock.`);
    }

    if (listing.quantity <= 0) {
      await Listing.updateOne({ _id: listing._id }, { isAvailable: false });
    }

    try {
      const order = await Order.create({
        buyer: req.user._id,
        listing: listing._id,
        farmer: listing.farmer,
        quantityOrdered,
        totalPrice: Math.round(listing.pricePerUnit * quantityOrdered * 100) / 100,
        status: 'Pending',
      });
      res.status(201).json(order);
    } catch (err) {
      // Give the stock back if the order could not be saved.
      await Listing.updateOne({ _id: listing._id }, { $inc: { quantity: quantityOrdered }, isAvailable: true });
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/marketplace/orders  (farmer: orders received)
const getFarmerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('listing')
      .populate('buyer', 'name email phone');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const ALLOWED_TRANSITIONS = {
  Pending: ['Accepted', 'Rejected'],
  Accepted: ['Completed', 'Rejected'],
  Rejected: [],
  Completed: [],
};

// PUT /api/marketplace/orders/:id/status  (farmer)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found');
    if (!order.farmer || !order.farmer.equals(req.user._id)) throw httpError(403, 'This order belongs to another farmer.');
    if (order.status === status) return res.json(order);
    if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
      throw httpError(400, `An order that is ${order.status} cannot be changed to ${status}.`);
    }

    // A rejected order returns its quantity to the listing.
    if (status === 'Rejected') {
      await Listing.updateOne({ _id: order.listing }, { $inc: { quantity: order.quantityOrdered }, isAvailable: true });
    }
    order.status = status;
    res.json(await order.save());
  } catch (error) {
    next(error);
  }
};

// DELETE /api/marketplace/:id  (farmer)
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw httpError(404, 'Listing not found');
    if (!listing.farmer.equals(req.user._id)) throw httpError(403, 'This listing belongs to another farmer.');
    await listing.deleteOne();
    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/marketplace/orders/me  (buyer: my purchases)
const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('listing')
      .populate('farmer', 'name email phone');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// GET /api/marketplace/total-listings
const getTotalListings = async (req, res, next) => {
  try {
    res.json({ total: await Listing.countDocuments({ isAvailable: true }) });
  } catch (error) {
    next(error);
  }
};

const loadOwnOrder = async (req) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw httpError(404, 'Order not found');
  const me = req.user._id;
  if (!order.buyer.equals(me) && !(order.farmer && order.farmer.equals(me))) throw httpError(403, 'This is not your order.');
  return order;
};

// POST /api/marketplace/orders/:id/report  (buyer or farmer of that order): "Report a problem"
const reportOrderIssue = async (req, res, next) => {
  try {
    const order = await loadOwnOrder(req);
    if (order.issue && order.issue.status === 'Open') throw httpError(400, 'A problem is already reported for this order.');
    order.issue = { reason: req.body.reason, details: req.body.details, reportedBy: req.user._id, status: 'Open' };
    res.status(201).json(await order.save());
  } catch (error) {
    next(error);
  }
};

// PUT /api/marketplace/orders/:id/report/resolve  (either party can mark it solved)
const resolveOrderIssue = async (req, res, next) => {
  try {
    const order = await loadOwnOrder(req);
    if (!order.issue || order.issue.status !== 'Open') throw httpError(400, 'There is no open problem on this order.');
    order.issue.status = 'Resolved';
    order.issue.resolvedAt = new Date();
    res.json(await order.save());
  } catch (error) {
    next(error);
  }
};

// GET /api/marketplace/stats  - sales (farmer) or spending (buyer) for the dashboard charts
const getMyStats = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 90, 7), 365);
    const since = new Date(Date.now() - days * 86_400_000);
    const who = req.user.role === 'Farmer' ? { farmer: req.user._id } : { buyer: req.user._id };
    const [byStatus, daily, top] = await Promise.all([
      Order.aggregate([{ $match: who }, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalPrice' } } }]),
      Order.aggregate([
        { $match: { ...who, createdAt: { $gte: since }, status: { $in: ['Accepted', 'Completed'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, value: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { ...who, status: { $in: ['Accepted', 'Completed'] } } },
        { $group: { _id: '$listing', value: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
        { $sort: { value: -1 } }, { $limit: 5 },
        { $lookup: { from: 'listings', localField: '_id', foreignField: '_id', as: 'listing' } },
        { $project: { value: 1, orders: 1, name: { $ifNull: [{ $first: '$listing.productName' }, 'Removed listing'] } } },
      ]),
    ]);
    const openIssues = await Order.countDocuments({ ...who, 'issue.status': 'Open' });
    res.json({ days, byStatus: Object.fromEntries(byStatus.map((s) => [s._id, { count: s.count, value: s.value }])), daily: daily.map((d) => ({ date: d._id, value: d.value, orders: d.orders })), top, openIssues });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyStats,
  getListings,
  createListing,
  getFarmerListings,
  placeOrder,
  getFarmerOrders,
  getBuyerOrders,
  updateOrderStatus,
  deleteListing,
  getTotalListings,
  reportOrderIssue,
  resolveOrderIssue,
};
