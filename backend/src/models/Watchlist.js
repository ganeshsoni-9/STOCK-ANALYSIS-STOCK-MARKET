const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, default: 'default_guest' },
    symbols: [{ type: String, uppercase: true, trim: true }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Watchlist', watchlistSchema);
