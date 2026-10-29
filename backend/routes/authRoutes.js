const express = require('express');
const { registerUser, authUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const schemas = require('../validation/schemas');

const router = express.Router();

router.post('/register', validate({ body: schemas.auth.register }), registerUser);
router.post('/login', validate({ body: schemas.auth.login }), authUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
