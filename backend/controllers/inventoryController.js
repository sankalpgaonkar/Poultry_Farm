const Inventory = require('../models/Inventory');
const { updateOrCreateStock } = require('../utils/inventorySync');
const { httpError } = require('../middleware/errorMiddleware');

const getInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find({ farmer: req.user._id }).sort({ itemName: 1 });
    const alerts = items
      .filter((item) => item.quantity <= item.lowStockThreshold)
      .map((item) => `Low stock alert: ${item.itemName} (${item.quantity} ${item.unit} remaining).`);
    res.json({ items, alerts });
  } catch (error) {
    next(error);
  }
};

const addInventoryItem = async (req, res, next) => {
  try {
    const item = await Inventory.create({ ...req.body, farmer: req.user._id });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const loadOwnItem = async (req) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  if (!item.farmer.equals(req.user._id)) throw httpError(403, 'This item belongs to another account.');
  return item;
};

const updateInventoryItem = async (req, res, next) => {
  try {
    const item = await loadOwnItem(req);
    // req.body only contains whitelisted fields (see validation/schemas.js), so the owner cannot be changed.
    item.set(req.body);
    res.json(await item.save());
  } catch (error) {
    next(error);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    const item = await loadOwnItem(req);
    await item.deleteOne();
    res.json({ message: 'Item removed' });
  } catch (error) {
    next(error);
  }
};

const bulkAddInventoryItems = async (req, res, next) => {
  try {
    const createdItems = [];
    for (const itemData of req.body.items) {
      createdItems.push(await updateOrCreateStock(req.user._id, itemData));
    }
    res.status(201).json(createdItems);
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, bulkAddInventoryItems };
