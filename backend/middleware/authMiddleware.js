const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Please log in to continue.' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret);
    const userId = decoded.id || decoded._id;
    req.user = userId ? await User.findById(userId).select('-password') : null;
    if (!req.user) return res.status(401).json({ success: false, message: 'Your session has ended. Please log in again.' });
    return next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({ success: false, message: expired ? 'Your session has expired. Please log in again.' : 'Please log in again.' });
  }
};

const farmerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Farmer') return next();
  return res.status(403).json({ success: false, message: 'This section is only for farmer accounts.' });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') return next();
  return res.status(403).json({ success: false, message: 'This section is only for administrators.' });
};

module.exports = { protect, farmerOnly, adminOnly };
