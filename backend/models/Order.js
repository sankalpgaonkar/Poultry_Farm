const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  reason: { type: String, enum: ['Not delivered', 'Wrong quantity', 'Poor quality', 'Payment not received', 'Other'], required: true },
  details: { type: String, maxlength: 1000 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  resolvedAt: Date,
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  quantityOrdered: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected', 'Completed'], default: 'Pending' },
  // "Report a problem" (grievance) raised by the buyer or the farmer.
  issue: { type: issueSchema, default: undefined },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
