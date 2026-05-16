const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallery', required: true },
      quantity: { type: Number, default: 1 },
      priceAtPurchase: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    name: String,
    mobile: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Unpaid', 'Paid'], 
    default: 'Unpaid' 
  },
  paymentMethod: { type: String, default: 'COD' } // Cash on Delivery or UPI
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
