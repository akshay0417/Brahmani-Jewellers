import React, { useState, useEffect } from 'react';
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
  const [deliveryRates, setDeliveryRates] = useState({ freeDeliveryKmLimit: 10, deliveryChargePerKm: 15 });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchDeliveryRates = async () => {
      try {
        const res = await api.get('/rates');
        if (res.data) {
          setDeliveryRates({
            freeDeliveryKmLimit: res.data.freeDeliveryKmLimit ?? 10,
            deliveryChargePerKm: res.data.deliveryChargePerKm ?? 15
          });
        }
      } catch (err) {
        console.error("Error fetching rates for delivery", err);
      }
    };
    fetchDeliveryRates();

    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Retrieve logged-in user details to pre-fill name/mobile
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData(prev => ({
        ...prev,
        name: prev.name || parsedUser.name || '',
        mobile: prev.mobile || parsedUser.mobile || ''
      }));
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const calculateDistance = (pincode) => {
    const pin = parseInt(pincode);
    if (!pin || isNaN(pin) || pincode.length < 6) return 0;
    
    // If it's the shop's pincode (Amraiwadi)
    if (pin === 380026) return 1;
    
    // If it's in Ahmedabad (starts with 380...)
    if (pincode.startsWith('380')) {
      const lastThree = pin % 1000;
      return 2 + (lastThree % 23);
    }
    
    // If it's in Gujarat but outside Ahmedabad (starts with 37... or 38... or 39...)
    if (pincode.startsWith('37') || pincode.startsWith('38') || pincode.startsWith('39')) {
      const lastThree = pin % 1000;
      return 30 + (lastThree % 170);
    }
    
    // Outside Gujarat
    return 500;
  };

  const distance = calculateDistance(formData.pincode);
  
  // Calculate delivery charge:
  let deliveryCharge = 0;
  if (distance > 0) {
    if (distance <= deliveryRates.freeDeliveryKmLimit) {
      deliveryCharge = 0;
    } else {
      deliveryCharge = Math.round((distance - deliveryRates.freeDeliveryKmLimit) * deliveryRates.deliveryChargePerKm);
    }
  }
  
  const grandTotal = cartTotal + deliveryCharge;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = sessionStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const orderData = {
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price
      })),
      totalAmount: grandTotal,
      shippingAddress: {
        name: formData.name,
        mobile: formData.mobile,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      },
      paymentMethod: formData.paymentMethod,
      shippingCharge: deliveryCharge,
      distanceKm: distance
    };

    try {
      if (formData.paymentMethod === 'COD') {
        // Direct COD checkout
        await api.post('/orders', orderData, config);
        setOrderSuccess(true);
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        // Razorpay flow: first create a Razorpay Order in backend
        const rzpOrderRes = await api.post('/orders/razorpay-order', { totalAmount: grandTotal }, config);
        const rzpOrderId = rzpOrderRes.data.id;

        if (rzpOrderRes.data.isMock) {
          // Simulation mode
          const confirmPayment = window.confirm(`[RAZORPAY SIMULATION]\nSimulate payment of ₹${grandTotal.toLocaleString('en-IN')}?`);
          if (confirmPayment) {
            const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 15);
            const mockSignature = 'sig_mock_' + Math.random().toString(36).substring(2, 15);

            await api.post('/orders/verify-payment', {
              orderData,
              razorpay_payment_id: mockPaymentId,
              razorpay_order_id: rzpOrderId,
              razorpay_signature: mockSignature
            }, config);

            setOrderSuccess(true);
            setTimeout(() => navigate('/dashboard'), 3000);
          } else {
            setLoading(false);
          }
        } else {
          // Live Razorpay Mode
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockKeyId123',
            amount: rzpOrderRes.data.amount,
            currency: rzpOrderRes.data.currency,
            name: "Brahmani Jewellers",
            description: "Luxury Jewellery Purchase",
            order_id: rzpOrderId,
            handler: async function (response) {
              try {
                setLoading(true);
                await api.post('/orders/verify-payment', {
                  orderData,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                }, config);

                setOrderSuccess(true);
                setTimeout(() => navigate('/dashboard'), 3000);
              } catch (verifyErr) {
                alert(verifyErr.response?.data?.message || 'Payment verification failed');
              } finally {
                setLoading(false);
              }
            },
            prefill: {
              name: formData.name,
              contact: formData.mobile,
              email: user?.email || ''
            },
            theme: {
              color: "#b08968"
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing checkout');
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'COD' ? 'border-ochre bg-ochre/10' : 'border-ochre/30 bg-cream hover:bg-ochre/5'}`}>
                  <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="accent-ochre" />
                  <span className="text-coffee font-medium text-sm">Cash on Delivery</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'Card' ? 'border-ochre bg-ochre/10' : 'border-ochre/30 bg-cream hover:bg-ochre/5'}`}>
                  <input type="radio" name="paymentMethod" value="Card" checked={formData.paymentMethod === 'Card'} onChange={handleChange} className="accent-ochre" />
                  <span className="text-coffee font-medium text-sm">Credit/Debit Card</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'UPI' ? 'border-ochre bg-ochre/10' : 'border-ochre/30 bg-cream hover:bg-ochre/5'}`}>
                  <input type="radio" name="paymentMethod" value="UPI" checked={formData.paymentMethod === 'UPI'} onChange={handleChange} className="accent-ochre" />
                  <span className="text-coffee font-medium text-sm">UPI Payment</span>
                </label>
              </div>

              {/* Conditional Payment Forms / Info */}
              {formData.paymentMethod !== 'COD' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-cream border border-ochre/25 rounded-lg space-y-2 mt-4 shadow-inner">
                  <div className="flex items-center gap-2 text-ochre">
                    <CreditCard size={18} />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-coffee/80">Secure Checkout via Razorpay</h4>
                  </div>
                  <p className="text-xs text-coffee/60">
                    You will be redirected to Razorpay to complete your payment securely using UPI, Cards, Netbanking, or Wallet.
                  </p>
                </motion.div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-coffee text-cream py-4 rounded-lg font-bold uppercase tracking-[0.2em] hover:bg-coffee/90 transition-all mt-8 shadow-xl disabled:opacity-50">
                {loading ? 'Processing Order...' : `Confirm Order (₹${grandTotal.toLocaleString('en-IN')})`}
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
                    <span className="text-coffee/80">{(item.product.name || item.product.category) + (item.product.weight ? ` (${item.product.weight}g)` : '')} x {item.quantity}</span>
                    <span className="font-medium">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-ochre/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-coffee/60">Subtotal</span>
                  <span className="font-medium text-coffee">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                {distance > 0 && (
                  <div className="flex justify-between items-center mb-2 text-xs text-coffee/70">
                    <span>Estimated Distance</span>
                    <span>{distance} km</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-coffee/60">Delivery</span>
                  {deliveryCharge > 0 ? (
                    <span className="font-medium text-coffee">₹{deliveryCharge.toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="text-green-600 font-medium uppercase text-xs tracking-widest">
                      {distance > 0 ? 'Free (Within Limit)' : 'Free'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-serif text-coffee font-bold">Grand Total</span>
                  <span className="text-2xl font-serif text-ochre font-bold">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                {distance > 0 && deliveryRates.freeDeliveryKmLimit > 0 && (
                  <div className="text-[10px] text-coffee/50 text-right mt-3">
                    * Free delivery up to {deliveryRates.freeDeliveryKmLimit} km. ₹{deliveryRates.deliveryChargePerKm}/km above it.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
