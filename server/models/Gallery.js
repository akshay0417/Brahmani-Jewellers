const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  targetPage: { type: String, enum: ['shop', 'collection', 'both'], default: 'both' },
  category: { type: String, enum: ['gold', 'silver', 'rudraksha', 'antique', 'best-seller', 'offers'], required: true },
  subCategory: { type: String }, // e.g., 'Ring', 'Chain', 'Bracelet'
  name: { type: String }, // e.g., 'Royal Heritage Necklace'
  description: { type: String }, // Optional description
  weight: { type: Number }, // numeric weight in grams
  purity: { type: String }, // e.g., '24K', '22K', '18K', '90%'
  makingCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  price: { type: Number }, // Fallback fixed price if not calculated
  isFeatured: { type: Boolean, default: false }, // Highlight on home page
  showOnHomepage: { type: Boolean, default: false }, // Show on home page
  tagNumber: { type: String }, // e.g., 'ERG00003' or 'LRG00002'
  size: { type: String }, // e.g., '18', '2.4'
  netWeight: { type: Number }, // numeric net weight in grams
  additionalImages: [{ type: String }], // Supplementary images
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Gallery', GallerySchema);
