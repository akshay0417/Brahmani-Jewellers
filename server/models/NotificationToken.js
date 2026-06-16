const mongoose = require('mongoose');

const NotificationTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deviceType: { type: String, default: 'unknown' }
}, { timestamps: true });

module.exports = mongoose.model('NotificationToken', NotificationTokenSchema);
