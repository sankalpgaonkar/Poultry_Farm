const CommunityPost = require('../models/CommunityPost');
const { httpError } = require('../middleware/errorMiddleware');

// GET /api/community?tag=Weather
const getPosts = async (req, res, next) => {
  try {
    const filter = req.validatedQuery?.tag ? { tags: req.validatedQuery.tag } : {};
    const posts = await CommunityPost.find(filter)
      .select('+upvotedBy')
      .populate('author', 'name role')
      .populate('comments.author', 'name role')
      .sort('-createdAt')
      .limit(200)
      .lean();
    const me = String(req.user._id);
    res.json(posts.map(({ upvotedBy = [], ...p }) => ({ ...p, hasUpvoted: upvotedBy.some((id) => String(id) === me) })));
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const post = await CommunityPost.create({ author: req.user._id, title, content, tags: tags || [] });
    await post.populate('author', 'name role');
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// PUT /api/community/:id/upvote  - one upvote per user; calling again removes it.
const upvotePost = async (req, res, next) => {
  try {
    const me = req.user._id;
    let post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.id, upvotedBy: { $ne: me } },
      { $addToSet: { upvotedBy: me }, $inc: { upvotes: 1 } },
      { new: true }
    );
    let hasUpvoted = true;
    if (!post) {
      post = await CommunityPost.findOneAndUpdate(
        { _id: req.params.id, upvotedBy: me },
        { $pull: { upvotedBy: me }, $inc: { upvotes: -1 } },
        { new: true }
      );
      hasUpvoted = false;
    }
    if (!post) throw httpError(404, 'Post not found');
    res.json({ upvotes: post.upvotes, hasUpvoted });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) throw httpError(404, 'Post not found');
    post.comments.push({ author: req.user._id, content: req.body.content });
    await post.save();
    await post.populate('comments.author', 'name role');
    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPosts, createPost, upvotePost, addComment };
