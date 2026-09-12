const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    settings: {
      theme: { type: String, default: 'dark' },
      refreshInterval: { type: Number, default: 2000 },
      defaultTimeframe: { type: String, default: '5m' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
