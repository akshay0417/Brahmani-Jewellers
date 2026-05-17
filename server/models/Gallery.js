const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  targetPage: { type: String, enum: ['shop', 'collection', 'both'], default: 'both' },
  category: { type: String, enum: ['gold', 'silver', 'rudraksha', 'antique'], required: true },
  subCategory: { type: String }, // e.g., 'Ring', 'Chain', 'Bracelet'
  name: { type: String }, // e.g., 'Royal Heritage Necklace'
  description: { type: String }, // Optional description
  weight: { type: Number }, // numeric weight in grams
  purity: { type: String }, // e.g., '24K', '22K', '18K', '90%'
  makingCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  price: { type: Number }, // Fallback fixed price if not calculated
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', GallerySchema);
