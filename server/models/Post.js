const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  communityId: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: String }
});

module.exports = mongoose.model('Post', postSchema);