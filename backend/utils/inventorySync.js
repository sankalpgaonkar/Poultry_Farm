const Inventory = require('../models/Inventory');

/**
 * Standardized utility to update or create an inventory item for a farmer.
 * Handles case-insensitive item name matching and unit normalization.
 */
const updateOrCreateStock = async (farmerId, itemData) => {
  const { itemName, category, quantity, unit, lowStockThreshold, dailyConsumptionRate } = itemData;

  // Normalize unit if not provided
  let normalizedUnit = unit || 'units';
  if (!unit) {
    const nameLower = itemName.toLowerCase();
    if (nameLower.includes('kg') || nameLower.includes('kilogram')) normalizedUnit = 'kg';
    else if (nameLower.includes('ltr') || nameLower.includes('liter')) normalizedUnit = 'liters';
  }

  // Find item by name (case-insensitive)
  let item = await Inventory.findOne({
    farmer: farmerId,
    itemName: new RegExp(`^${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
  });

  if (item) {
    item.quantity += Number(quantity);
    if (category) item.category = category;
    if (unit) item.unit = unit; // Prefer explicitly provided unit
    return await item.save();
  } else {
    const newItem = new Inventory({
      farmer: farmerId,
      itemName,
      category: category || 'Other',
      quantity: Number(quantity),
      unit: normalizedUnit,
      lowStockThreshold: lowStockThreshold || 10,
      dailyConsumptionRate: dailyConsumptionRate || 0
    });
    return await newItem.save();
  }
};

module.exports = { updateOrCreateStock };
