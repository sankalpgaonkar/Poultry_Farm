const mongoose = require('mongoose');
const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');
const User = require('../models/User');
const { httpError } = require('../middleware/errorMiddleware');

/**
 * Buyer <-> farmer messaging. Two people can message each other once there is
 * at least one marketplace order between them (keeps the inbox free of spam).
 */
const hasOrderBetween = (a, b) =>
  Order.exists({ $or: [{ buyer: a, farmer: b }, { buyer: b, farmer: a }] });

// GET /api/chat/contacts
const getContacts = async (req, res, next) => {
  try {
    const me = req.user._id;
    const orders = await Order.find({ $or: [{ buyer: me }, { farmer: me }] }).select('buyer farmer createdAt').lean();
    const ids = [...new Set(orders.map((o) => String(o.buyer) === String(me) ? String(o.farmer) : String(o.buyer)).filter((id) => id && id !== 'undefined'))];
    if (!ids.length) return res.json([]);

    const users = await User.find({ _id: { $in: ids } }).select('name role').lean();
    const objIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const last = await ChatMessage.aggregate([
      { $match: { $or: [{ sender: me, receiver: { $in: objIds } }, { receiver: me, sender: { $in: objIds } }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: { $cond: [{ $eq: ['$sender', me] }, '$receiver', '$sender'] },
        message: { $first: '$message' },
        createdAt: { $first: '$createdAt' },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', me] }, { $eq: ['$isRead', false] }] }, 1, 0] } },
      } },
    ]);
    const byId = Object.fromEntries(last.map((l) => [String(l._id), l]));
    const contacts = users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      lastMessage: byId[String(u._id)]?.message || '',
      lastAt: byId[String(u._id)]?.createdAt || null,
      unread: byId[String(u._id)]?.unread || 0,
    })).sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
    res.json(contacts);
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/:userId   (marks their messages to me as read)
const getMessages = async (req, res, next) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;
    if (!(await hasOrderBetween(me, other))) throw httpError(403, 'You can message someone after placing or receiving an order with them.');
    const messages = await ChatMessage.find({ $or: [{ sender: me, receiver: other }, { sender: other, receiver: me }] })
      .sort({ createdAt: 1 }).limit(500).lean();
    await ChatMessage.updateMany({ sender: other, receiver: me, isRead: false }, { isRead: true });
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// POST /api/chat/:userId
const sendMessage = async (req, res, next) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;
    if (String(me) === String(other)) throw httpError(400, 'You cannot message yourself.');
    if (!(await hasOrderBetween(me, other))) throw httpError(403, 'You can message someone after placing or receiving an order with them.');
    const msg = await ChatMessage.create({ sender: me, receiver: other, message: req.body.message });
    res.status(201).json(msg);
  } catch (error) {
    next(error);
  }
};

module.exports = { getContacts, getMessages, sendMessage };
