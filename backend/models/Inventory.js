const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Feed', 'Medicine', 'Equipment', 'Other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true // e.g., kg, liters, units
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  dailyConsumptionRate: {
    type: Number, // Estimated consumption per day, useful to predict when stock depletes
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
