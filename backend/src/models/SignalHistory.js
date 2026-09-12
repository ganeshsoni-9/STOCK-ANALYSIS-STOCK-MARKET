const mongoose = require('mongoose');

const signalHistorySchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    signal: { type: String, required: true },
    score: { type: Number, required: true },
    ltp: { type: Number, required: true },
    timeframe: { type: String, default: '5m' },
    reasons: [{ type: String }],
    timestamp: { type: Date, default: Date.now, expires: '7d' } // Auto-delete after 7 days
  },
  { timestamps: false }
);

module.exports = mongoose.model('SignalHistory', signalHistorySchema);
