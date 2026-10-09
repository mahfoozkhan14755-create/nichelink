const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  communityId: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: String, required: true }
});

module.exports = mongoose.model('Post', PostSchema);