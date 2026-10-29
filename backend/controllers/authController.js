const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { normalizePhone } = require('../validation/schemas');

const generateToken = (id) => jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

// POST /api/auth/register  (body validated by schemas.auth.register)
const registerUser = async (req, res, next) => {
  try {
    const { name, emailOrPhone, password, role } = req.body;
    const { email, phone } = emailOrPhone;

    const exists = await User.findOne(email ? { email } : { phone });
    if (exists) {
      return res.status(409).json({ success: false, message: `An account with this ${email ? 'email' : 'mobile number'} already exists. Try logging in.` });
    }

    const user = await User.create({ name, email, phone, password, role });
    res.status(201).json({ ...publicUser(user), token: generateToken(user._id) });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login  (accepts { identifier, password } or the older { email, password })
const authUser = async (req, res, next) => {
  try {
    const { raw, password } = req.body;
    let query;
    if (raw.includes('@')) {
      query = { email: raw.toLowerCase() };
    } else {
      // Match the normalised 10-digit number, and the number exactly as typed (older accounts).
      query = { phone: { $in: [...new Set([normalizePhone(raw), raw])] } };
    }

    const user = await User.findOne(query);
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email/phone or password.' });
    }
    res.json({ ...publicUser(user), token: generateToken(user._id) });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/profile
const getUserProfile = async (req, res) => {
  res.json(publicUser(req.user));
};

module.exports = { registerUser, authUser, getUserProfile };
