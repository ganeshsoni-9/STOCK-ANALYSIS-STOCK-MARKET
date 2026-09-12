const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default_guest' },
    symbol: { type: String, required: true, uppercase: true },
    conditionType: {
      type: String,
      enum: ['BULLISH_SCORE_GREATER', 'BEARISH_SCORE_GREATER', 'PRICE_ABOVE_VWAP', 'ORH_BREAKOUT', 'ORL_BREAKDOWN'],
      required: true
    },
    targetValue: { type: Number, default: 80 },
    active: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
