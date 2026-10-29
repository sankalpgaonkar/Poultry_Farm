const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  totalChickens: {
    type: Number,
    required: true,
    default: 0
  },
  vaccinationSchedule: [{
    disease: String,
    date: Date,
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Farm', farmSchema);
