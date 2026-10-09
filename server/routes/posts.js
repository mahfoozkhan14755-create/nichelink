const router = require('express').Router();
const Post = require('../models/Post');

router.get('/:communityId', async (req, res) => {
  try {
    const posts = await Post.find({ communityId: req.params.communityId }).sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { communityId, author, content, createdAt } = req.body;
    const newPost = new Post({ communityId, author, content, createdAt });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;