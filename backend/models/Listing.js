const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  quantity: {
    type: Number,
    required: true
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  image: {
    type: String
  },
  category: {
    type: String,
    enum: ['EGG', 'BIRD', 'FEED', 'EQUIPMENT', 'OTHER'],
    default: 'EGG'
  }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
