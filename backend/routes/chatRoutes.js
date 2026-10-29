const express = require('express');
const { getContacts, getMessages, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { chat } = require('../validation/schemas');

const router = express.Router();
router.get('/contacts', protect, getContacts);
router.get('/:userId', protect, validate({ params: chat.userParam }), getMessages);
router.post('/:userId', protect, validate({ params: chat.userParam, body: chat.send }), sendMessage);

module.exports = router;
