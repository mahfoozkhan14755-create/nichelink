const router = require('express').Router();
const Post = require('../models/Post');

// Get posts for a specific community
router.get('/:communityId', async (req, res) => {
  try {
    const posts = await Post.find({ communityId: req.params.communityId }).sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new post
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

// Dedicated endpoint to clear all community posts instantly
router.delete('/clear-all', async (req, res) => {
  try {
    await Post.deleteMany({});
    res.status(200).json({ message: 'All community posts and chats wiped successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;