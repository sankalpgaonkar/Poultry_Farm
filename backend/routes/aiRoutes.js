const express = require('express');
const multer = require('multer');
const { predictProduction, chatWithAssistant, getSmartAlerts, processPhoto } = require('../controllers/aiController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { ai } = require('../validation/schemas');

// Photos stay in memory (never written to disk) and are limited to 5 MB images.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|heic|heif)$/.test(file.mimetype)) return cb(null, true);
    const err = new Error('Please upload a photo (JPG, PNG or WebP).');
    err.status = 400;
    return cb(err);
  },
});

const router = express.Router();
router.post('/predict', protect, farmerOnly, validate({ body: ai.predict }), predictProduction);
router.post('/chat', protect, validate({ body: ai.chat }), chatWithAssistant);
router.get('/alerts', protect, farmerOnly, getSmartAlerts);
router.post('/process-photo', protect, farmerOnly, upload.single('photo'), processPhoto);

module.exports = router;
