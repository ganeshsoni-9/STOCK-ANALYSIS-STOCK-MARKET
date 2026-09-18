require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const TARGET_IDENTIFIER = process.argv[2] || 'test@tradesense.ai'; // Email or mobile passed via CLI or default
const NEW_PASSWORD = process.argv[3] || 'TradeSense@123';

async function resetPassword() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tradesense';
    await mongoose.connect(mongoUri);
    console.log('[PasswordReset] Connected to MongoDB');

    const clean = TARGET_IDENTIFIER.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: clean }, { mobile: TARGET_IDENTIFIER.trim() }]
    });

    if (!user) {
      console.error(`[PasswordReset] No user found for: ${TARGET_IDENTIFIER}`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, salt);

    user.passwordHash = passwordHash;
    await user.save();

    console.log(`[PasswordReset] SUCCESS: Password successfully updated for user ${user._id}`);
    console.log(`[PasswordReset] Account Identifier: ${user.email || user.mobile}`);
    process.exit(0);
  } catch (err) {
    console.error('[PasswordReset] ERROR:', err.message);
    process.exit(1);
  }
}

resetPassword();
