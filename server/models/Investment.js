const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  goldGrams: { type: Number, default: 0 },
  silverGrams: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String, enum: ['BUY', 'SELL', 'REDEEM'], required: true },
      metal: { type: String, enum: ['GOLD', 'SILVER'], required: true },
      grams: { type: Number, required: true },
      amount: { type: Number, required: true }, // total paid or offline settled
      ratePerGram: { type: Number, required: true },
      gstAmount: { type: Number, required: true }, // 3% GST
      paymentMethod: { type: String },
      paymentReference: { type: String },
      status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Investment', InvestmentSchema);
