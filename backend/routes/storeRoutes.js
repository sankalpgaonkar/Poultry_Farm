const express = require('express');
const Store = require('../models/Store');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { store: schemas } = require('../validation/schemas');
const { httpError } = require('../middleware/errorMiddleware');

const router = express.Router();

// GET /api/stores  - public list of stores (owner name only; no emails or phone numbers)
router.get('/', async (req, res, next) => {
  try {
    res.json(await Store.find({}).sort({ updatedAt: -1 }).limit(200).populate('user', 'name'));
  } catch (error) {
    next(error);
  }
});

// GET /api/stores/my-store
router.get('/my-store', protect, async (req, res, next) => {
  try {
    const store = await Store.findOne({ user: req.user._id });
    // null = this farmer has not set up a store yet (not an error).
    res.json(store || null);
  } catch (error) {
    next(error);
  }
});

// POST /api/stores  - create or update my store profile
router.post('/', protect, validate({ body: schemas.profile }), async (req, res, next) => {
  try {
    const { name, description, location, image } = req.body;
    let store = await Store.findOne({ user: req.user._id });
    if (store) {
      store.name = name;
      if (description !== undefined) store.description = description;
      if (location !== undefined) store.location = location;
      if (image) store.image = image;
      return res.json(await store.save());
    }
    store = await Store.create({ user: req.user._id, name, description, location, image });
    res.status(201).json(store);
  } catch (error) {
    next(error);
  }
});

// POST /api/stores/products
router.post('/products', protect, validate({ body: schemas.product }), async (req, res, next) => {
  try {
    const store = await Store.findOne({ user: req.user._id });
    if (!store) throw httpError(404, 'Store not found. Please create your store first.');
    if (store.products.length >= 200) throw httpError(400, 'A store can have at most 200 products.');
    store.products.push(req.body);
    const saved = await store.save();
    res.status(201).json(saved.products[saved.products.length - 1]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/stores/products/:productId
router.delete('/products/:productId', protect, validate({ params: schemas.productParam }), async (req, res, next) => {
  try {
    const updated = await Store.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { products: { _id: req.params.productId } } },
      { new: true }
    );
    if (!updated) throw httpError(404, 'Store not found.');
    res.json({ message: 'Product removed successfully', products: updated.products });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
