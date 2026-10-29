const express = require('express');
const { getPosts, createPost, upvotePost, addComment } = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { idParam, community } = require('../validation/schemas');

const router = express.Router();
router.use(protect);

router.route('/')
  .get(validate({ query: community.query }), getPosts)
  .post(validate({ body: community.post }), createPost);
router.put('/:id/upvote', validate({ params: idParam }), upvotePost);
router.post('/:id/comments', validate({ params: idParam, body: community.comment }), addComment);

module.exports = router;
