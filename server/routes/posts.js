const router = require('express').Router();
const mongoose = require('mongoose');

// Define Post Schema directly or use your existing model file
const PostSchema = new mongoose.Schema({
  communityId: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// GET ALL POSTS BY COMMUNITY
router.get('/:communityId', async (req, res) => {
  try {
    const posts = await Post.find({ communityId: req.params.communityId }).sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE POST
router.post('/', async (req, res) => {
  try {
    const { communityId, author, content, createdAt } = req.body;
    
    if (!communityId || !content) {
      return res.status(400).json({ message: 'Community ID and content are required' });
    }

    const newPost = new Post({ 
      communityId, 
      author: author || 'Member', 
      content, 
      createdAt: createdAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ALL POSTS (PURANI CHATS CLEAR KARNE KE LIYE)
router.delete('/clear', async (req, res) => {
  try {
    await Post.deleteMany({});
    res.json({ message: 'All community chats and posts cleared successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;