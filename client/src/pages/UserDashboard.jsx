import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Shield, Clock, ExternalLink, ShoppingBag } from 'lucide-react';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setEditForm({ name: parsed.name || '', email: parsed.email || '', mobile: parsed.mobile || '' });
    } else {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await api.get('/orders/my', config);
        setOrders(res.data || []);
      } catch (err) {
        console.error("Error fetching my orders", err);
      }
    };
    fetchOrders();
  }, [navigate]);

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleSave = async () => {
    setStatus({ type: '', message: '' });

    if (!editForm.email || !editForm.mobile) {
      setStatus({ type: 'error', message: 'Please enter both email address and mobile number' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address format' });
      return;
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(editForm.mobile)) {
      setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number' });
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const res = await api.put('/auth/profile', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      sessionStorage.setItem('token', res.data.token);
      setIsEditing(false);
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error updating profile' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    try {
      const token = sessionStorage.getItem('token');
      await api.delete('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      logout();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error deleting account' });
    }
  };

  return (
    <div className="min-h-screen bg-cream pt-12 pb-24 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-coffee uppercase tracking-wider transition-colors duration-300">My Account</h1>
            <p className="text-ochre/80 tracking-[0.2em] text-xs mt-1">
              WELCOME BACK, {user?.name?.toUpperCase() || 'USER'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex items-center justify-center gap-2 px-4 py-2 bg-coffee/5 text-coffee border border-coffee/20 hover:bg-coffee hover:text-cream transition-all rounded-sm text-sm font-medium">
              Home
            </Link>
            <button onClick={handleDeleteAccount} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/90 text-white hover:bg-red-600 transition-all rounded-sm text-sm font-bold uppercase tracking-wider shadow-sm">
              Delete Account
            </button>
            <button onClick={logout} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all rounded-sm font-medium">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 bg-cream-alt border border-ochre/10 p-8 rounded-lg shadow-sm transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6 border-b border-ochre/10 pb-4 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <UserIcon className="text-ochre" size={24} />
                <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest transition-colors duration-300">Profile Details</h2>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-ochre uppercase hover:underline">
                  Edit
                </button>
              )}
            </div>

            {status.message && (
              <div className={`mb-6 p-3 rounded text-sm ${status.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                {status.message}
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <p className="text-xs text-coffee/60 uppercase tracking-widest mb-1 transition-colors duration-300">Full Name</p>
                {isEditing ? (
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-cream border border-ochre/30 rounded px-3 py-2 text-coffee focus:outline-none focus:border-ochre" />
                ) : (
                  <p className="text-lg text-coffee font-medium transition-colors duration-300">{user?.name}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-coffee/60 uppercase tracking-widest mb-1 transition-colors duration-300">Email Address</p>
                {isEditing ? (
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full bg-cream border border-ochre/30 rounded px-3 py-2 text-coffee focus:outline-none focus:border-ochre" />
                ) : (
                  <p className="text-lg text-coffee font-medium transition-colors duration-300">{user?.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-coffee/60 uppercase tracking-widest mb-1 transition-colors duration-300">Mobile Number</p>
                {isEditing ? (
                  <input type="text" value={editForm.mobile} onChange={(e) => setEditForm({...editForm, mobile: e.target.value})} className="w-full bg-cream border border-ochre/30 rounded px-3 py-2 text-coffee focus:outline-none focus:border-ochre" />
                ) : (
                  <p className="text-lg text-coffee font-medium transition-colors duration-300">{user?.mobile}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-coffee/60 uppercase tracking-widest mb-1 transition-colors duration-300">Account Role</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream text-coffee text-sm font-medium border border-ochre/20 transition-colors duration-300">
                  <Shield size={14} />
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex gap-4">
                <button onClick={handleSave} className="px-6 py-2 bg-ochre text-coffee font-bold uppercase text-sm rounded shadow hover:bg-ochre/90 transition-colors">
                  Save
                </button>
                <button onClick={() => {
                  setIsEditing(false);
                  setEditForm({ name: user?.name || '', email: user?.email || '', mobile: user?.mobile || '' });
                }} className="px-6 py-2 bg-cream text-coffee border border-coffee/20 font-bold uppercase text-sm rounded hover:bg-coffee/5 transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-cream-alt border border-ochre/10 p-8 rounded-lg shadow-sm flex flex-col transition-colors duration-300"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-ochre/10 pb-4">
              <Clock className="text-ochre" size={24} />
              <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Order History</h2>
            </div>

            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="text-ochre/40 mb-4" size={48} />
                <p className="text-sm text-coffee/70 mb-4">You have not placed any orders yet.</p>
                <Link to="/shop" className="px-6 py-2.5 bg-coffee text-cream text-xs font-bold uppercase tracking-wider hover:bg-coffee/90 transition-all rounded shadow-md">
                  Explore Shop
                </Link>
              </div>
            ) : (
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {orders.map((order) => (
                  <div key={order._id} className="bg-cream border border-ochre/20 p-5 rounded-lg space-y-4 shadow-sm">
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-ochre/10 pb-3">
                      <div>
                        <p className="text-[10px] text-coffee/50 font-bold uppercase">Order ID</p>
                        <p className="text-xs font-mono text-coffee font-semibold">{order._id}</p>
                        <p className="text-[10px] text-coffee/40 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-700 border border-red-200' :
                          'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}>
                          {order.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'} ({order.paymentMethod})
                        </span>
                      </div>
                    </div>

                    {/* Status Stepper (Amazon/Flipkart Style) */}
                    {order.status !== 'Cancelled' ? (
                      <div className="py-4 px-3 bg-cream-alt/40 rounded-lg border border-ochre/15 my-4 select-none">
                        <div className="flex justify-between items-center relative max-w-md mx-auto py-2">
                          {/* Stepper Progress Line */}
                          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-coffee/10 z-0">
                            <div 
                              className="h-full bg-ochre transition-all duration-500" 
                              style={{ 
                                width: `${
                                  order.status === 'Pending' ? '0%' :
                                  order.status === 'Processing' ? '33.33%' :
                                  order.status === 'Shipped' ? '66.66%' :
                                  order.status === 'Delivered' ? '100%' : '0%'
                                }` 
                              }}
                            />
                          </div>

                          {/* Steps */}
                          {[
                            { label: 'Ordered', statusKey: 'Pending', stepIndex: 0 },
                            { label: 'Packed', statusKey: 'Processing', stepIndex: 1 },
                            { label: 'Shipped', statusKey: 'Shipped', stepIndex: 2 },
                            { label: 'Delivered', statusKey: 'Delivered', stepIndex: 3 }
                          ].map((step, idx) => {
                            const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered'];
                            const orderIndex = statusOrder.indexOf(order.status);
                            const isCompleted = orderIndex >= step.stepIndex;
                            const isActive = orderIndex === step.stepIndex;

                            return (
                              <div key={idx} className="flex flex-col items-center z-10 relative">
                                <div 
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                                    isCompleted 
                                      ? 'bg-ochre text-coffee border-ochre scale-110 shadow-md shadow-ochre/20' 
                                      : 'bg-cream text-coffee/30 border-coffee/10'
                                  } ${isActive ? 'ring-2 ring-ochre ring-offset-2 ring-offset-cream' : ''}`}
                                >
                                  {isCompleted ? '✓' : idx + 1}
                                </div>
                                <span className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${
                                  isCompleted ? 'text-coffee' : 'text-coffee/40'
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Expected Delivery or Pickup */}
                        {(order.expectedDelivery || order.deliveryMode === 'Pickup') && (
                          <div className="mt-3 pt-2.5 border-t border-ochre/10 text-center text-xs text-coffee/80 font-medium">
                            {order.deliveryMode === 'Pickup' ? (
                              <p>
                                🏪 Ready for In-Store Pickup. Secure Code: <span className="text-ochre font-bold font-mono">{order.pickupCode || 'N/A'}</span>
                              </p>
                            ) : (
                              order.expectedDelivery && (
                                <p>
                                  📅 Expected Delivery: <span className="text-ochre font-bold">{order.expectedDelivery}</span>
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-center font-bold text-[10px] uppercase tracking-wider rounded-lg my-4">
                        ❌ This Order Has Been Cancelled
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-cream-alt/50 p-2.5 rounded border border-ochre/5">
                          {item.product?.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name || item.product.category} className="w-10 h-10 object-cover rounded border border-ochre/20" />
                          ) : (
                            <div className="w-10 h-10 bg-ochre/10 rounded flex items-center justify-center text-ochre text-xs font-bold">
                              Jewel
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-serif text-coffee font-bold truncate">
                              {item.product?.name || item.product?.category}
                              {item.product?.weight ? ` (${item.product.weight}g)` : ''}
                            </p>
                            <p className="text-[10px] text-coffee/60">
                              Qty: {item.quantity} | ₹{(item.priceAtPurchase || item.product?.price || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping and Actions */}
                    <div className="flex flex-wrap justify-between items-center gap-4 pt-3 border-t border-ochre/10">
                      <div>
                        {order.trackingId && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-coffee/50">Tracking:</span>
                            {order.deliveryPartner === 'Delhivery' ? (
                              <a
                                href={`https://www.delhivery.com/track/package/${order.trackingId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-ochre font-bold hover:underline"
                              >
                                {order.trackingId} <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-[10px] text-coffee font-semibold">
                                {order.trackingId} ({order.deliveryPartner || 'Self-Delivery'})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {order.couponCode && (
                          <p className="text-xs text-green-600 font-bold mb-0.5">
                            Coupon Applied ({order.couponCode}): -₹{(order.discountAmount || 0).toLocaleString('en-IN')}
                          </p>
                        )}
                        <p className="text-xs text-coffee/60">
                          Shipping: {order.shippingCharge > 0 ? `₹${order.shippingCharge.toLocaleString('en-IN')}` : 'Free'}
                        </p>
                        <p className="text-sm font-serif text-coffee font-bold">
                          Grand Total: <span className="text-ochre">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
