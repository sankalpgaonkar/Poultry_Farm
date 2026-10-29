const mongoose = require('mongoose');

// Daily price points behind the market-rates card. `rateId` matches an id in backend/data/marketRates.json.
// The demo seed writes sample history with isSample: true; real deployments can import mandi/NECC rates here.
const marketRateHistorySchema = new mongoose.Schema({
  rateId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  region: { type: String },
  isSample: { type: Boolean, default: false },
}, { timestamps: true });

marketRateHistorySchema.index({ rateId: 1, date: 1 });

module.exports = mongoose.model('MarketRateHistory', marketRateHistorySchema);
