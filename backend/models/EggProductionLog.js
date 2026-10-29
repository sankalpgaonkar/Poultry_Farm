const mongoose = require('mongoose');

const eggProductionLogSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalEggs: {
    type: Number,
    required: true
  },
  temperature: {
    type: Number,
    required: true // for ML correlations
  },
  humidity: {
    type: Number
  },
  currentChickenCount: {
    type: Number,
    required: true
  },
  feedConsumed: {
    type: Number, // kg
    required: true
  },
  mortalityCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('EggProductionLog', eggProductionLogSchema);
