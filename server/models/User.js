const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  country: { type: String },
  state: { type: String },
  city: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },
  lastLogin: { type: Date },
  termsAccepted: { type: Boolean, default: false },
  kycStatus: { type: String, enum: ['not_submitted', 'pending', 'approved', 'rejected'], default: 'not_submitted' },
  kycName: { type: String },
  panCard: { type: String },
  aadhaarCard: { type: String },
  kycRejectionReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

