const express = require('express');
const c = require('../controllers/inventoryController');
const { protect, farmerOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam, inventory } = require('../validation/schemas');

const router = express.Router();
router.use(protect, farmerOnly);

router.route('/')
  .get(c.getInventory)
  .post(validate({ body: inventory.create }), c.addInventoryItem);
router.post('/bulk', validate({ body: inventory.bulk }), c.bulkAddInventoryItems);
router.route('/:id')
  .put(validate({ params: idParam, body: inventory.update }), c.updateInventoryItem)
  .delete(validate({ params: idParam }), c.deleteInventoryItem);

module.exports = router;
