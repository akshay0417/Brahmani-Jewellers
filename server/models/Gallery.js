const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  category: { type: String, enum: ['gold', 'silver', 'rudraksha', 'antique'], required: true },
  weight: { type: String },
  purity: { type: String },
  price: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', GallerySchema);
