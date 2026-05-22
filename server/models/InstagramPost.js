const mongoose = require('mongoose');

const InstagramPostSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  postUrl: {
    type: String,
    required: true,
    trim: true
  },
  caption: {
    type: String,
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InstagramPost', InstagramPostSchema);
