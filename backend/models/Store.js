const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: String },
  image: { type: String } // Base64 string
});

const storeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  image: { type: String }, // Base64 string for logo/image
  products: [productSchema]
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
