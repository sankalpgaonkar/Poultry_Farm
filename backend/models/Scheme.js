const mongoose = require('mongoose');

// Note: In a production system, this could be populated globally by admins.
const schemeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  region: {
    type: String, // e.g. "USA", "India", "Global"
    default: 'Global'
  },
  benefits: [String],
  link: String 
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);
