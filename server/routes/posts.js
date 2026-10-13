const router = require('express').Router();
const Post = require('../models/Post');

// Get posts for a specific community
router.get('/:communityId', async (req, res) => {
  try {
    const { communityId } = req.params;
    const posts = await Post.find({ communityId }).sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new post in a community
router.post('/', async (req, res) => {
  try {
    const { communityId, author, content, createdAt } = req.body;
    
    if (!communityId || !content) {
      return res.status(400).json({ error: 'Community ID and content are required' });
    }

    const newPost = new Post({
      communityId,
      author: author || 'Member',
      content,
      createdAt: createdAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error saving post:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;