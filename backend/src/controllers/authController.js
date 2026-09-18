const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

exports.signup = async (req, res) => {
  try {
    const { identifierType, email, mobile, password } = req.body;

    if (!identifierType || !['email', 'mobile'].includes(identifierType)) {
      return res.status(400).json({
        success: false,
        message: 'identifierType must be either "email" or "mobile"'
      });
    }

    let cleanEmail = null;
    let cleanMobile = null;

    if (identifierType === 'email') {
      if (!email || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required'
        });
      }
      cleanEmail = email.trim().toLowerCase();
    } else if (identifierType === 'mobile') {
      if (!mobile || !MOBILE_REGEX.test(mobile.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Valid 10-digit Indian mobile number is required'
        });
      }
      cleanMobile = mobile.trim();
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    let existingUser = null;
    if (identifierType === 'email') {
      existingUser = await User.findOne({ email: cleanEmail });
    } else {
      existingUser = await User.findOne({ mobile: cleanMobile });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      identifierType,
      email: cleanEmail,
      mobile: cleanMobile,
      passwordHash
    });

    const secret = process.env.JWT_SECRET || 'tradesense_super_secret_jwt_key_2026_change_in_production';
    const token = jwt.sign({ userId: newUser._id.toString() }, secret, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        identifierType: newUser.identifierType,
        email: newUser.email,
        mobile: newUser.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifierType, email, mobile, password } = req.body;

    if (!password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let query = null;
    if (identifierType === 'email' || (email && !identifierType)) {
      if (!email) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      query = { email: email.trim().toLowerCase() };
    } else if (identifierType === 'mobile' || (mobile && !identifierType)) {
      if (!mobile) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      query = { mobile: mobile.trim() };
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'tradesense_super_secret_jwt_key_2026_change_in_production';
    const token = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        identifierType: user.identifierType,
        email: user.email,
        mobile: user.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        identifierType: user.identifierType,
        email: user.email,
        mobile: user.mobile,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
