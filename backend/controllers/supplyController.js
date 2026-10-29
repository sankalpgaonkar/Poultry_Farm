const SupplyOrder = require('../models/SupplyOrder');
const { updateOrCreateStock } = require('../utils/inventorySync');
const { httpError } = require('../middleware/errorMiddleware');

// POST /api/supplies/order  - the total is calculated on the server, never trusted from the browser.
const placeSupplyOrder = async (req, res, next) => {
  try {
    const { storeName, items } = req.body;
    const totalAmount = Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
    const order = await SupplyOrder.create({ user: req.user._id, storeName, items, totalAmount, status: 'Ordered' });
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const getMySupplyOrders = async (req, res, next) => {
  try {
    res.json(await SupplyOrder.find({ user: req.user._id }).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
};

// PUT /api/supplies/:id/receive  - mark delivered and add the items to inventory
const receiveSupplyOrder = async (req, res, next) => {
  try {
    const order = await SupplyOrder.findById(req.params.id);
    if (!order) throw httpError(404, 'Order not found');
    // 403 (not 401): a 401 would log the user out in the browser.
    if (!order.user.equals(req.user._id)) throw httpError(403, 'This order belongs to another account.');
    if (order.status === 'Delivered') throw httpError(400, 'Order already marked as delivered');
    if (order.status === 'Cancelled') throw httpError(400, 'This order was cancelled');

    // Mark first so a double click cannot add the stock twice.
    const updated = await SupplyOrder.findOneAndUpdate(
      { _id: order._id, status: { $nin: ['Delivered', 'Cancelled'] } },
      { status: 'Delivered' },
      { new: true }
    );
    if (!updated) throw httpError(400, 'Order already marked as delivered');

    for (const item of order.items) {
      await updateOrCreateStock(req.user._id, {
        itemName: item.name,
        category: ['Feed', 'Medicine', 'Equipment'].includes(item.category) ? item.category : 'Other',
        quantity: item.quantity,
      });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { placeSupplyOrder, getMySupplyOrders, receiveSupplyOrder };
