const mongoose = require('mongoose');

const supplyOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeName: {
    type: String,
    required: true
  },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      category: { type: String, required: true }, // Add category for inventory mapping
      image: { type: String }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Ordered', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Ordered'
  },
  deliveryEstimate: {
    type: Date,
    default: () => new Date(+new Date() + 3*24*60*60*1000) // 3 days from now
  }
}, { timestamps: true });

module.exports = mongoose.model('SupplyOrder', supplyOrderSchema);
