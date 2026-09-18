const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    identifierType: {
      type: String,
      enum: ['email', 'mobile'],
      required: true
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
