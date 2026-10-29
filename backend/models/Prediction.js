const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inputData: {
    chickens: Number,
    age: Number,
    feedQuality: String,
    feedQty: Number,
    temperature: Number,
    humidity: Number,
    lighting: Number,
    breed: String
  },
  predictedEggs: {
    type: Number,
    required: true
  },
  confidence: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
