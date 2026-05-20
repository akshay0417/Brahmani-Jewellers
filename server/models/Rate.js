const mongoose = require('mongoose');

const RateSchema = new mongoose.Schema({
  // Final calculated/manual rates to be displayed
  gold24K: { type: Number, required: true, default: 0 },
  gold22K: { type: Number, required: true, default: 0 },
  gold18K: { type: Number, required: true, default: 0 },
  silver90: { type: Number, required: true, default: 0 }, // Hidden from UI but calculated
  
  // Base raw rates from Arham Bullion or Manual Entry
  goldImpFine: { type: Number, default: 0 },
  silverFine: { type: Number, default: 0 },
  
  // Settings
  isManual: { type: Boolean, default: true },
  freeDeliveryKmLimit: { type: Number, default: 10 },
  deliveryChargePerKm: { type: Number, default: 15 },
  
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rate', RateSchema);
