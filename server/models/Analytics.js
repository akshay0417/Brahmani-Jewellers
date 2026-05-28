const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'visitor_stats' },
  views: { type: Number, default: 0 }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
