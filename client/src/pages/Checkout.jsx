import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { MapPin, Phone, User, CreditCard, CheckCircle } from 'lucide-react';

const Checkout = () => {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'COD'
  });
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        items: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          priceAtPurchase: item.product.price
        })),
        totalAmount: cartTotal,
        shippingAddress: {
          name: formData.name,
          mobile: formData.mobile,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        paymentMethod: formData.paymentMethod
      };

      const token = sessionStorage.getItem('token');
      await api.post('/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrderSuccess(true);
      // Wait and navigate to home or orders page
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="pt-48 pb-24 min-h-screen flex flex-col items-center justify-center bg-cream px-4 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-500 mb-6">
          <CheckCircle size={100} />
        </motion.div>
        <h2 className="text-4xl font-serif text-coffee mb-4">Order Placed Successfully!</h2>
        <p className="text-coffee/60 mb-8 max-w-md">Thank you for choosing Brahmani Jewellers. We have received your order and will contact you shortly for confirmation.</p>
        <div className="animate-pulse text-ochre font-medium">Redirecting to your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="pt-48 pb-24 min-h-screen bg-cream px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-12 text-coffee text-center">
          Complete Your <span className="text-ochre">Order</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Shipping Form */}
          <div className="bg-cream-alt p-8 rounded-lg border border-ochre/10 shadow-lg">
            <h3 className="text-2xl font-serif text-coffee mb-8 flex items-center gap-3">
              <MapPin className="text-ochre" /> Shipping Details
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-coffee/60 mb-2">Recipient Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/40" size={18} />
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-cream border border-ochre/20 p-3 pl-10 rounded focus:outline-none focus:border-ochre text-coffee" placeholder="Full Name" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-coffee/60 mb-2">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/40" size={18} />
                    <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full bg-cream border border-ochre/20 p-3 pl-10 rounded focus:outline-none focus:border-ochre text-coffee" placeholder="10-digit number" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-coffee/60 mb-2">Full Address</label>
                <textarea name="address" required value={formData.address} onChange={handleChange} className="w-full bg-cream border border-ochre/20 p-3 rounded focus:outline-none focus:border-ochre text-coffee min-h-[100px]" placeholder="Street address, apartment, etc."></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-cream border border-ochre/20 p-3 rounded focus:outline-none focus:border-ochre text-coffee" placeholder="City" />
                <input type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full bg-cream border border-ochre/20 p-3 rounded focus:outline-none focus:border-ochre text-coffee" placeholder="State" />
                <input type="text" name="pincode" required value={formData.pincode} onChange={handleChange} className="w-full bg-cream border border-ochre/20 p-3 rounded focus:outline-none focus:border-ochre text-coffee" placeholder="Pincode" />
              </div>

              <h3 className="text-xl font-serif text-coffee mt-12 mb-6 flex items-center gap-3">
                <CreditCard className="text-ochre" /> Payment Method
              </h3>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 p-4 border border-ochre/30 rounded-lg cursor-pointer bg-cream hover:bg-ochre/10 transition-colors">
                  <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="accent-ochre" />
                  <span className="text-coffee font-medium">Cash on Delivery</span>
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-coffee text-cream py-4 rounded-lg font-bold uppercase tracking-[0.2em] hover:bg-coffee/90 transition-all mt-8 shadow-xl disabled:opacity-50">
                {loading ? 'Processing Order...' : `Confirm Order (₹${cartTotal.toLocaleString('en-IN')})`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="space-y-8">
            <div className="bg-cream-alt p-8 rounded-lg border border-ochre/10 shadow-lg">
              <h3 className="text-2xl font-serif text-coffee mb-8">Order Summary</h3>
              <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="flex justify-between items-center text-sm">
                    <span className="text-coffee/80">{item.product.category} x {item.quantity}</span>
                    <span className="font-medium">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-ochre/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-coffee/60">Subtotal</span>
                  <span className="font-medium text-coffee">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-coffee/60">Delivery</span>
                  <span className="text-green-600 font-medium uppercase text-xs tracking-widest">Free</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-serif text-coffee font-bold">Grand Total</span>
                  <span className="text-2xl font-serif text-ochre font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
