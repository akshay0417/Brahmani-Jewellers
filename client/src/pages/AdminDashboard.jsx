import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Upload, Trash2, TrendingUp, Image as ImageIcon, CheckCircle, AlertCircle, User, MessageSquare, Lock, X, Mail, Star, Menu, ShoppingBag } from 'lucide-react';

const AdminDashboard = () => {
  const [rates, setRates] = useState({ isManual: true, goldImpFine: '', silverFine: '', manualGold24K: '', manualGold22K: '', manualGold18K: '', manualSilver90: '', freeDeliveryKmLimit: '', deliveryChargePerKm: '' });
  const [gallery, setGallery] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [visitorCount, setVisitorCount] = useState(0);
  
  // Instagram Showcase State
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [newInstaImage, setNewInstaImage] = useState(null);
  const [instaPostUrl, setInstaPostUrl] = useState('');
  const [instaCaption, setInstaCaption] = useState('');
  const [instaLikes, setInstaLikes] = useState('');
  const [instaComments, setInstaComments] = useState('');
  const [editingInstaItem, setEditingInstaItem] = useState(null);

  const [newImage, setNewImage] = useState(null);
  const [category, setCategory] = useState('gold');
  const [subCategory, setSubCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetPage, setTargetPage] = useState('both');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState('22K');
  const [makingCharges, setMakingCharges] = useState('');
  const [otherCharges, setOtherCharges] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('rates');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const token = sessionStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setUser(parsedUser);
    } else {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rateRes, galleryRes, usersRes, messagesRes, subscribersRes, ordersRes, instagramRes, analyticsRes] = await Promise.all([
        api.get('/rates'),
        api.get('/gallery'),
        api.get('/users', config),
        api.get('/messages', config),
        api.get('/subscribers', config),
        api.get('/admin/orders', config),
        api.get('/instagram'),
        api.get('/analytics', config).catch(() => ({ data: { views: 0 } }))
      ]);

      if (rateRes.data) setRates({ 
        isManual: rateRes.data.isManual ?? true,
        goldImpFine: rateRes.data.goldImpFine || '',
        silverFine: rateRes.data.silverFine || '',
        manualGold24K: rateRes.data.gold24K || '',
        manualGold22K: rateRes.data.gold22K || '',
        manualGold18K: rateRes.data.gold18K || '',
        manualSilver90: rateRes.data.silver90 || '',
        freeDeliveryKmLimit: rateRes.data.freeDeliveryKmLimit ?? 10,
        deliveryChargePerKm: rateRes.data.deliveryChargePerKm ?? 15
      });
      
      if (galleryRes.data) setGallery(galleryRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (messagesRes.data) setMessages(messagesRes.data);
      if (subscribersRes.data) setSubscribers(subscribersRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (instagramRes.data) setInstagramPosts(instagramRes.data);
      if (analyticsRes && analyticsRes.data) setVisitorCount(analyticsRes.data.views || 0);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    }
  };


  const handleRateUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/rates', rates, config);
      setStatus({ type: 'success', message: 'Rates updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to update rates.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, newPaymentStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus, paymentStatus: newPaymentStatus }, config);
      setStatus({ type: 'success', message: 'Order status updated successfully!' });
      fetchData();
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to update order status.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleShipDelhivery = async (orderId) => {
    setLoading(true);
    try {
      const res = await api.post(`/admin/orders/${orderId}/ship-delhivery`, {}, config);
      setStatus({ type: 'success', message: res.data.message || 'Shipment created successfully!' });
      fetchData();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create Delhivery shipment.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!newImage) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', newImage);
    formData.append('category', category);
    formData.append('subCategory', subCategory);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('targetPage', targetPage);
    formData.append('weight', weight);
    formData.append('purity', purity);
    formData.append('price', rates.price || '');
    formData.append('makingCharges', makingCharges);
    formData.append('otherCharges', otherCharges);
    formData.append('isFeatured', isFeatured);

    try {
      await api.post('/gallery', formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      setNewImage(null);
      setWeight('');
      setPurity('22K');
      setMakingCharges('');
      setOtherCharges('');
      setIsFeatured(false);
      setRates({ ...rates, price: '' });
      fetchData();
      setStatus({ type: 'success', message: 'Image uploaded successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleInstagramUpload = async (e) => {
    e.preventDefault();
    if (!newInstaImage || !instaPostUrl) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', newInstaImage);
    formData.append('postUrl', instaPostUrl);
    formData.append('caption', instaCaption);
    formData.append('likes', instaLikes);
    formData.append('comments', instaComments);

    try {
      await api.post('/instagram', formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      setNewInstaImage(null);
      setInstaPostUrl('');
      setInstaCaption('');
      setInstaLikes('');
      setInstaComments('');
      fetchData();
      setStatus({ type: 'success', message: 'Instagram post added successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Instagram upload failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const deleteInstagramPost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Instagram post?")) return;
    setLoading(true);
    try {
      await api.delete(`/instagram/${id}`, config);
      fetchData();
      setStatus({ type: 'success', message: 'Instagram post deleted successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to delete Instagram post.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleInstaEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/instagram/${editingInstaItem._id}`, editingInstaItem, config);
      setStatus({ type: 'success', message: 'Instagram post updated successfully!' });
      setEditingInstaItem(null);
      fetchData();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Update failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/gallery/${editingItem._id}`, editingItem, config);
      setStatus({ type: 'success', message: 'Item updated successfully!' });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Update failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const deleteImage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this design?")) return;
    try {
      await api.delete(`/gallery/${id}`, config);
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }
  };
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/messages/${id}`, config);
      setMessages(messages.filter((m) => m._id !== id));
      setStatus({ type: 'success', message: 'Message deleted' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error deleting message' });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`, config);
      setUsers(users.filter((u) => u._id !== id));
      setStatus({ type: 'success', message: 'User deleted successfully' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error deleting user' });
    }
  };

  const toggleUserApproval = async (id, currentStatus) => {
    try {
      const res = await api.put(`/users/${id}/approve`, { isApproved: !currentStatus }, config);
      setUsers(users.map((u) => u._id === id ? { ...u, isApproved: !currentStatus } : u));
      setStatus({ type: 'success', message: res.data.message });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error toggling approval' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const handleDeleteSubscriber = async (id) => {
    if (!window.confirm('Are you sure you want to remove this subscriber from the newsletter?')) return;
    try {
      await api.delete(`/subscribers/${id}`, config);
      setSubscribers(subscribers.filter((s) => s._id !== id));
      setStatus({ type: 'success', message: 'Subscriber removed successfully' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error deleting subscriber' });
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMessage) {
      alert("Please fill in both subject and message.");
      return;
    }
    if (!window.confirm(`Are you sure you want to send this broadcast email to all ${subscribers.length} subscribers?`)) return;
    
    setBroadcasting(true);
    setStatus({ type: 'success', message: 'Sending mass emails in the background... Please wait.' });
    try {
      const res = await api.post('/subscribers/broadcast', {
        subject: broadcastSubject,
        message: broadcastMessage
      }, config);
      setStatus({ type: 'success', message: res.data.message || 'Broadcast email sent successfully!' });
      setBroadcastSubject('');
      setBroadcastMessage('');
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send broadcast email.' });
    } finally {
      setBroadcasting(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 5000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) return;
    setLoading(true);
    try {
      await api.put('/auth/change-password', passwordData, config);
      setStatus({ type: 'success', message: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error updating password' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream pt-8 pb-16 px-4 md:px-8 transition-colors duration-300 relative">
      
      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-coffee/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-cream-alt border-r border-ochre/25 z-50 shadow-2xl p-6 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-8 border-b border-ochre/10 pb-4">
          <div>
            <h3 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest italic">Brahmani</h3>
            <p className="text-[10px] text-ochre/80 tracking-[0.3em] uppercase -mt-1 font-bold">Admin Portal</p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-coffee/5 text-coffee/60 hover:text-ochre transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'rates', label: 'Rates & Security', icon: TrendingUp },
            { id: 'upload', label: 'Upload Content', icon: Upload },
            { id: 'collection', label: 'Manage Collection', icon: ImageIcon },
            { id: 'instagram', label: 'Instagram Feed', icon: Star },
            { id: 'orders', label: 'Manage Orders', icon: ShoppingBag },
            { id: 'users', label: 'Registered Users', icon: User },
            { id: 'subscribers', label: 'Subscribers & Campaign', icon: Mail },
            { id: 'messages', label: 'Customer Messages', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsDrawerOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-all text-left ${
                  isActive 
                    ? 'bg-ochre text-coffee shadow-lg' 
                    : 'text-coffee/70 hover:bg-ochre/10 hover:text-coffee'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-coffee' : 'text-ochre'} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* Header Area */}
        <div className="flex justify-between items-center mb-8 bg-cream-alt p-6 border border-ochre/15 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-md hover:bg-coffee/5 text-coffee transition-colors shadow-sm border border-ochre/15"
              title="Open Navigation Menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-bold text-coffee uppercase tracking-wider transition-colors duration-300">
                {activeTab === 'rates' && 'Rates & Security'}
                {activeTab === 'upload' && 'Upload Content'}
                {activeTab === 'collection' && 'Manage Collection'}
                {activeTab === 'instagram' && 'Instagram Showcase'}
                {activeTab === 'orders' && 'Manage Orders'}
                {activeTab === 'users' && 'Registered Users'}
                {activeTab === 'subscribers' && 'VIP Subscribers & Campaign'}
                {activeTab === 'messages' && 'Direct Messages'}
              </h1>
              <p className="text-ochre/80 tracking-[0.2em] text-[10px] mt-0.5 uppercase font-semibold">
                Logged in as: {user?.name || 'Administrator'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/" className="flex items-center justify-center gap-2 px-4 py-2 bg-coffee/5 text-coffee border border-coffee/20 hover:bg-coffee hover:text-cream transition-all rounded-sm text-xs font-bold uppercase tracking-wider">
              Home
            </Link>
            <button onClick={logout} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all rounded-sm text-xs font-bold uppercase tracking-wider">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {status.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/30'}`}
          >
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </motion.div>
        )}

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            
            {activeTab === 'rates' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <section className="bg-cream-alt p-6 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="text-ochre" />
                    <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Rates Control Panel</h2>
                  </div>
                  
                  <div className="mb-6 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setRates({ ...rates, isManual: true })}
                      className={`flex-1 py-2 rounded font-bold uppercase tracking-widest text-xs transition-colors ${rates.isManual ? 'bg-ochre text-cream' : 'bg-cream border border-ochre/30 text-coffee'}`}
                    >
                      Manual Edit
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRates({ ...rates, isManual: false })}
                      className={`flex-1 py-2 rounded font-bold uppercase tracking-widest text-xs transition-colors ${!rates.isManual ? 'bg-ochre text-cream' : 'bg-cream border border-ochre/30 text-coffee'}`}
                    >
                      Auto (From Fine)
                    </button>
                  </div>

                  <form onSubmit={handleRateUpdate} className="space-y-6">
                    {!rates.isManual ? (
                      <div className="space-y-4 bg-cream p-4 rounded border border-ochre/20">
                        <p className="text-xs text-coffee/70 font-bold mb-2">AUTO CALCULATOR</p>
                        <div className="space-y-2">
                          <label className="text-xs text-coffee/70 uppercase tracking-widest">Gold Fine (IMP) Rate</label>
                          <input
                            type="number"
                            value={rates.goldImpFine}
                            onChange={(e) => setRates({ ...rates, goldImpFine: e.target.value })}
                            className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none"
                            placeholder="e.g. 75000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-coffee/70 uppercase tracking-widest">Silver Fine Rate</label>
                          <input
                            type="number"
                            value={rates.silverFine}
                            onChange={(e) => setRates({ ...rates, silverFine: e.target.value })}
                            className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none"
                            placeholder="e.g. 90000"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 bg-cream p-4 rounded border border-ochre/20">
                        <p className="text-xs text-coffee/70 font-bold mb-2">MANUAL OVERRIDE</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-coffee/70 uppercase tracking-widest">Gold 24K Rate</label>
                            <input
                              type="number"
                              value={rates.manualGold24K}
                              onChange={(e) => setRates({ ...rates, manualGold24K: e.target.value })}
                              className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-coffee/70 uppercase tracking-widest">Gold 22K Rate</label>
                            <input
                              type="number"
                              value={rates.manualGold22K}
                              onChange={(e) => setRates({ ...rates, manualGold22K: e.target.value })}
                              className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-coffee/70 uppercase tracking-widest">Gold 18K Rate</label>
                            <input
                              type="number"
                              value={rates.manualGold18K}
                              onChange={(e) => setRates({ ...rates, manualGold18K: e.target.value })}
                              className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-coffee/70 uppercase tracking-widest">Silver Rate (90%)</label>
                            <input
                              type="number"
                              value={rates.manualSilver90}
                              onChange={(e) => setRates({ ...rates, manualSilver90: e.target.value })}
                              className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 bg-cream p-4 rounded border border-ochre/20">
                      <p className="text-xs text-coffee/70 font-bold mb-2">DELIVERY CHARGES SETTINGS</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs text-coffee/70 uppercase tracking-widest">Free Delivery Limit (KM)</label>
                          <input
                            type="number"
                            value={rates.freeDeliveryKmLimit}
                            onChange={(e) => setRates({ ...rates, freeDeliveryKmLimit: e.target.value })}
                            className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-coffee/70 uppercase tracking-widest">Charge Per KM (₹)</label>
                          <input
                            type="number"
                            value={rates.deliveryChargePerKm}
                            onChange={(e) => setRates({ ...rates, deliveryChargePerKm: e.target.value })}
                            className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee focus:border-ochre outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <button disabled={loading} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 transition-all rounded-sm">
                      {loading ? 'Processing...' : 'Save Market Prices'}
                    </button>
                  </form>
                </section>

                <section className="bg-cream-alt p-6 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300 mb-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="text-ochre" size={24} />
                    <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Website Traffic</h2>
                  </div>
                  <div className="bg-cream p-6 rounded border border-ochre/20 text-center">
                    <p className="text-xs text-coffee/70 font-bold uppercase tracking-widest mb-1">Total Unique Visitors</p>
                    <h1 className="text-5xl font-serif font-bold text-ochre tracking-tight">{visitorCount}</h1>
                    <p className="text-[10px] text-coffee/50 mt-2">Calculated dynamically based on unique sessions</p>
                  </div>
                </section>

                <section className="bg-cream-alt p-6 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="text-ochre" size={24} />
                    <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Security Settings</h2>
                  </div>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <button disabled={loading} className="w-full py-3 bg-coffee text-cream font-bold uppercase tracking-widest hover:bg-ochre transition-all rounded-sm shadow-md">
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </section>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <section className="bg-cream-alt p-6 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <Upload className="text-ochre" />
                    <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Upload New Design</h2>
                  </div>
                  <form onSubmit={handleImageUpload} className="space-y-6">
                    <div 
                      className="border-2 border-dashed border-ochre/30 bg-cream rounded-lg p-8 text-center hover:border-ochre/60 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('imageInput').click()}
                    >
                      {newImage ? (
                        <div className="space-y-2">
                          <p className="text-ochre text-sm truncate font-medium">{newImage.name}</p>
                          <p className="text-coffee/50 text-xs transition-colors duration-300">Click to change selection</p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-coffee/50 transition-colors duration-300">
                          <ImageIcon className="mx-auto mb-2 opacity-60 text-ochre" size={40} />
                          <p className="text-sm">Click to select image (JPG/PNG)</p>
                        </div>
                      )}
                      <input
                        id="imageInput"
                        type="file"
                        hidden
                        accept="image/jpeg, image/png"
                        onChange={(e) => setNewImage(e.target.files[0])}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Select Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                        >
                          <option value="gold">Gold Jewellery</option>
                          <option value="silver">Silver Jewellery</option>
                          <option value="rudraksha">Rudraksha</option>
                          <option value="antique">Antique Items</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Item Type (e.g. Ring, Chain)</label>
                        <input
                          type="text"
                          list="subCatsList"
                          value={subCategory}
                          onChange={(e) => setSubCategory(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                          placeholder="Optional: Ring, Bracelet..."
                        />
                        <datalist id="subCatsList">
                          {[...new Set(gallery.filter(i => i.category === category && i.subCategory).map(i => i.subCategory))].map(sub => (
                            <option key={sub} value={sub} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Item Name (Optional)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                        placeholder="e.g. Royal Heritage Necklace"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Description (Optional)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="2"
                        className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee text-sm outline-none focus:border-ochre transition-colors resize-none"
                        placeholder="A timeless piece of heritage..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Target Page</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="both" checked={targetPage === 'both'} onChange={() => setTargetPage('both')} className="accent-ochre" />
                          <span className="text-sm text-coffee">Both</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="shop" checked={targetPage === 'shop'} onChange={() => setTargetPage('shop')} className="accent-ochre" />
                          <span className="text-sm text-coffee">Shop</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="collection" checked={targetPage === 'collection'} onChange={() => setTargetPage('collection')} className="accent-ochre" />
                          <span className="text-sm text-coffee">Collection</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Price (₹ - Optional)</label>
                        <input
                          type="number"
                          value={rates.price || ''}
                          onChange={(e) => setRates({ ...rates, price: e.target.value })}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                          placeholder="Enter price"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Weight (Grams)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                          placeholder="e.g. 10.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Purity</label>
                        <select
                          value={purity}
                          onChange={(e) => setPurity(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                        >
                          <option value="24K">24K Gold</option>
                          <option value="22K">22K Gold</option>
                          <option value="18K">18K Gold</option>
                          <option value="90%">90% Silver</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Making Charges (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={makingCharges}
                          onChange={(e) => setMakingCharges(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                          placeholder="e.g. 15 for 15%"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Other Charges (₹)</label>
                        <input
                          type="number"
                          value={otherCharges}
                          onChange={(e) => setOtherCharges(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <input 
                        type="checkbox" 
                        id="isFeatured" 
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-5 h-5 accent-ochre"
                      />
                      <label htmlFor="isFeatured" className="text-sm text-coffee font-bold cursor-pointer">
                        Highlight this photo on Home Page?
                      </label>
                    </div>
                    <button disabled={loading || !newImage} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 transition-all disabled:opacity-50 rounded-sm">
                      {loading ? 'Uploading...' : 'Add to Collection'}
                    </button>
                  </form>
                </section>

                <section className="bg-cream-alt p-6 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <Upload className="text-ochre" />
                    <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Upload Instagram Post</h2>
                  </div>
                  <form onSubmit={handleInstagramUpload} className="space-y-6">
                    <div 
                      className="border-2 border-dashed border-ochre/30 bg-cream rounded-lg p-8 text-center hover:border-ochre/60 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('instaImageInput').click()}
                    >
                      {newInstaImage ? (
                        <div className="space-y-2">
                          <p className="text-ochre text-sm truncate font-medium">{newInstaImage.name}</p>
                          <p className="text-coffee/50 text-xs">Click to change selection</p>
                        </div>
                      ) : (
                        <div className="space-y-2 text-coffee/50">
                          <ImageIcon className="mx-auto mb-2 opacity-60 text-ochre" size={40} />
                          <p className="text-sm">Click to select post image (JPG/PNG)</p>
                        </div>
                      )}
                      <input
                        id="instaImageInput"
                        type="file"
                        hidden
                        accept="image/jpeg, image/png"
                        onChange={(e) => setNewInstaImage(e.target.files[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Instagram Post URL</label>
                      <input
                        type="url"
                        value={instaPostUrl}
                        onChange={(e) => setInstaPostUrl(e.target.value)}
                        className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm"
                        placeholder="https://www.instagram.com/p/..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Caption / Description</label>
                      <input
                        type="text"
                        value={instaCaption}
                        onChange={(e) => setInstaCaption(e.target.value)}
                        className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm"
                        placeholder="e.g. Timeless gold necklace... ✨"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Likes Count</label>
                        <input
                          type="number"
                          value={instaLikes}
                          onChange={(e) => setInstaLikes(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm"
                          placeholder="e.g. 150"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Comments Count</label>
                        <input
                          type="number"
                          value={instaComments}
                          onChange={(e) => setInstaComments(e.target.value)}
                          className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm"
                          placeholder="e.g. 24"
                        />
                      </div>
                    </div>

                    <button disabled={loading || !newInstaImage || !instaPostUrl} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 transition-all disabled:opacity-50 rounded-sm">
                      {loading ? 'Uploading...' : 'Add to Showcase'}
                    </button>
                  </form>
                </section>
              </div>
            )}

            {activeTab === 'collection' && (
              <section className="bg-cream-alt p-6 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
                <h2 className="text-2xl font-serif font-bold text-coffee mb-6 border-b border-ochre/10 pb-3 transition-colors duration-300">
                  Manage <span className="text-ochre">Collection</span>
                </h2>
                {gallery.length === 0 ? (
                  <p className="text-coffee/50 text-center py-8 transition-colors duration-300">No images found in the collection.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {gallery.map((item) => (
                      <div key={item._id} className="relative group rounded-md overflow-hidden aspect-square border border-ochre/20 shadow-sm">
                        <img src={item.imageUrl} alt="Design" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-coffee/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <button onClick={() => setEditingItem({ ...item, targetPage: item.targetPage || 'both' })} className="p-3 bg-blue-600/90 rounded-full text-white hover:bg-blue-600 transform hover:scale-110 transition-all shadow-lg" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button onClick={() => deleteImage(item._id)} className="p-3 bg-red-600/90 rounded-full text-white hover:bg-red-600 transform hover:scale-110 transition-all shadow-lg" title="Delete">
                            <Trash2 size={20} />
                          </button>
                        </div>
                        {item.subCategory && (
                          <div className="absolute top-2 left-2 bg-cream/90 backdrop-blur-sm text-coffee text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm shadow-sm">
                            {item.subCategory}
                          </div>
                        )}
                        {item.isFeatured && (
                          <div className="absolute top-2 right-2 bg-ochre text-coffee p-1 rounded-full shadow-md" title="Highlighted on Home Page">
                            <Star size={12} className="fill-coffee" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-cream-alt/90 text-coffee text-[10px] uppercase font-bold tracking-wider rounded-sm shadow-sm backdrop-blur-sm">
                          {item.category} {item.weight && `| ${item.weight}`} {item.purity && `| ${item.purity}`} {item.price && `| ₹${item.price}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'instagram' && (
              <section className="bg-cream-alt p-6 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
                <h2 className="text-2xl font-serif font-bold text-coffee mb-6 border-b border-ochre/10 pb-3 transition-colors duration-300">
                  Manage <span className="text-ochre">Instagram Showcase</span>
                </h2>
                {instagramPosts.length === 0 ? (
                  <p className="text-coffee/50 text-center py-8 transition-colors duration-300">No Instagram posts found in the showcase.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {instagramPosts.map((post) => (
                      <div key={post._id} className="relative group rounded-md overflow-hidden aspect-square border border-ochre/20 shadow-sm">
                        <img src={post.imageUrl} alt="Instagram Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-coffee/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <a 
                            href={post.postUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-3 bg-ochre text-cream rounded-full hover:bg-ochre/90 transform hover:scale-110 transition-all shadow-lg"
                            title="View on Instagram"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                          </a>
                          {post._id !== 'default1' && post._id !== 'default2' && post._id !== 'default3' && post._id !== 'default4' && post._id !== 'default5' && post._id !== 'default6' && (
                            <>
                              <button onClick={() => setEditingInstaItem(post)} className="p-3 bg-blue-600/90 rounded-full text-white hover:bg-blue-600 transform hover:scale-110 transition-all shadow-lg" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                              <button onClick={() => deleteInstagramPost(post._id)} className="p-3 bg-red-600/90 rounded-full text-white hover:bg-red-600 transform hover:scale-110 transition-all shadow-lg" title="Delete">
                                <Trash2 size={20} />
                              </button>
                            </>
                          )}
                        </div>
                        {post.caption && (
                          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-cream-alt/90 text-coffee text-[10px] rounded-sm shadow-sm backdrop-blur-sm truncate">
                            {post.caption}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-ochre/95 text-coffee text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm backdrop-blur-sm">
                          ❤️ {post.likes || 0} | 💬 {post.comments || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'orders' && (
              <section className="bg-cream-alt p-6 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-6 border-b border-ochre/10 pb-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-ochre" size={28} />
                    <h2 className="text-2xl font-serif font-bold text-coffee transition-colors duration-300">
                      Manage <span className="text-ochre">Orders</span>
                    </h2>
                  </div>
                  <div className="bg-ochre/10 text-ochre px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase">
                    Total Orders: {orders.length}
                  </div>
                </div>
                
                {orders.length === 0 ? (
                  <p className="text-coffee/50 text-center py-8 transition-colors duration-300">No orders found.</p>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order._id} className="bg-cream border border-ochre/25 p-6 rounded-lg shadow-sm space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-ochre/10 pb-4">
                          <div>
                            <p className="text-xs text-coffee/50 font-bold uppercase">Order ID</p>
                            <p className="text-sm font-mono text-coffee font-semibold">{order._id}</p>
                            <p className="text-[10px] text-coffee/40">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-coffee/50 font-bold uppercase">Customer</p>
                            <p className="text-sm text-coffee font-semibold">{order.user?.name || 'Guest'} ({order.user?.mobile || 'No Mobile'})</p>
                            <p className="text-xs text-coffee/60">{order.user?.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-coffee/50 font-bold uppercase">Payment Method</p>
                            <p className="text-sm font-semibold text-ochre">{order.paymentMethod || 'COD'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-coffee/50 font-bold uppercase">Shipping</p>
                            {order.trackingId ? (
                              <div className="mt-1 space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-ochre/25 text-coffee border border-ochre/30">
                                  {order.deliveryPartner || 'Delhivery'}
                                </span>
                                <p className="text-xs font-mono text-coffee font-medium">{order.trackingId}</p>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleShipDelhivery(order._id)}
                                disabled={loading}
                                className="mt-1 px-3 py-1 bg-ochre text-cream text-[10px] font-bold uppercase tracking-wider hover:bg-ochre/90 transition-all rounded-sm disabled:opacity-50 shadow-sm"
                              >
                                Ship Delhivery
                              </button>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-coffee/50 font-bold uppercase">Status</p>
                            <div className="flex gap-2 mt-1">
                              <select 
                                value={order.status} 
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value, order.paymentStatus)}
                                className="bg-cream border border-ochre/30 text-xs px-2 py-1 rounded focus:outline-none focus:border-ochre text-coffee font-bold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              <select 
                                value={order.paymentStatus} 
                                onChange={(e) => handleUpdateOrderStatus(order._id, order.status, e.target.value)}
                                className={`border text-xs px-2 py-1 rounded focus:outline-none text-coffee font-bold ${order.paymentStatus === 'Paid' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                              >
                                <option value="Unpaid">Unpaid</option>
                                <option value="Paid">Paid</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-coffee/50 font-bold uppercase">Items ordered</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className="flex gap-3 bg-cream-alt p-3 rounded border border-ochre/10 items-center">
                                {item.product?.imageUrl && (
                                  <img src={item.product.imageUrl} alt={item.product.name} className="w-12 h-12 object-cover rounded border border-ochre/25" />
                                )}
                                <div>
                                  <p className="text-sm font-serif text-coffee font-semibold">{item.product?.name || item.product?.category}</p>
                                  <p className="text-xs text-coffee/60">
                                    Qty: {item.quantity} | ₹{(item.priceAtPurchase || 0).toLocaleString('en-IN')} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap justify-between items-end gap-6 pt-4 border-t border-ochre/10">
                          <div className="text-xs text-coffee/70 max-w-md">
                            <p className="font-bold text-coffee uppercase text-[10px] mb-1">Shipping Address</p>
                            <p className="font-semibold">{order.shippingAddress?.name} ({order.shippingAddress?.mobile})</p>
                            <p>{order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                          </div>
                          <div className="text-right space-y-1">
                            {order.distanceKm > 0 && (
                              <p className="text-xs text-coffee/60">Distance: {order.distanceKm} km</p>
                            )}
                            {order.shippingCharge > 0 && (
                              <p className="text-xs text-coffee/60">Delivery Charge: ₹{order.shippingCharge.toLocaleString('en-IN')}</p>
                            )}
                            <p className="text-lg font-serif text-coffee font-bold">Total: <span className="text-ochre">₹{order.totalAmount?.toLocaleString('en-IN')}</span></p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'users' && (
              <section className="bg-cream-alt p-6 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-6 border-b border-ochre/10 pb-3">
                  <div className="flex items-center gap-3">
                    <User className="text-ochre" size={28} />
                    <h2 className="text-2xl font-serif font-bold text-coffee transition-colors duration-300">
                      Registered <span className="text-ochre">Users</span>
                    </h2>
                  </div>
                  <div className="bg-ochre/10 text-ochre px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase">
                    Total Users: {users.length}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-ochre/20 text-coffee/70 text-sm uppercase tracking-wider">
                        <th className="py-4 px-4">Name</th>
                        <th className="py-4 px-4">Email</th>
                        <th className="py-4 px-4">Mobile</th>
                        <th className="py-4 px-4">Role</th>
                        <th className="py-4 px-4">Approval</th>
                        <th className="py-4 px-4">Joined Date</th>
                        <th className="py-4 px-4">Last Login</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-8 text-coffee/50">No users found.</td>
                        </tr>
                      ) : (
                        users.map((u, i) => (
                          <tr key={u._id} className="border-b border-ochre/10 hover:bg-ochre/5 transition-colors">
                            <td className="py-4 px-4 font-medium text-coffee">{u.name}</td>
                            <td className="py-4 px-4 text-coffee/70">{u.email || '-'}</td>
                            <td className="py-4 px-4 text-coffee/70">{u.mobile || '-'}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-sm ${u.role === 'admin' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-green-500/10 text-green-700 border border-green-500/20'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {u.role === 'admin' ? (
                                <span className="text-xs text-coffee/50 font-bold uppercase tracking-wider">Auto-Approved</span>
                              ) : (
                                <button
                                  onClick={() => toggleUserApproval(u._id, u.isApproved)}
                                  className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-all ${
                                    u.isApproved 
                                      ? 'bg-green-500/10 text-green-700 border border-green-500/30 hover:bg-green-500 hover:text-white' 
                                      : 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 hover:bg-yellow-500 hover:text-white'
                                  }`}
                                >
                                  {u.isApproved ? 'Approved ✓' : 'Pending ⏳'}
                                </button>
                              )}
                            </td>
                            <td className="py-4 px-4 text-sm text-coffee/60">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-sm text-coffee/60">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button onClick={() => handleDeleteUser(u._id)} className="text-red-500/70 hover:text-red-600 transition-colors" title="Delete User">
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'subscribers' && (
              <section className="bg-cream-alt p-6 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
                <div className="flex items-center justify-between mb-6 border-b border-ochre/10 pb-3">
                  <div className="flex items-center gap-3">
                    <Mail className="text-ochre" size={28} />
                    <h2 className="text-2xl font-serif font-bold text-coffee transition-colors duration-300">
                      VIP Newsletter <span className="text-ochre">Subscribers</span>
                    </h2>
                  </div>
                  <div className="bg-ochre/10 text-ochre px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase">
                    Total Subscribers: {subscribers.length}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-ochre/20 text-coffee/70 text-sm uppercase tracking-wider">
                          <th className="py-4 px-4">Email Address</th>
                          <th className="py-4 px-4">Subscribed Date</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscribers.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center py-8 text-coffee/50">No subscribers found.</td>
                          </tr>
                        ) : (
                          subscribers.map((s) => (
                            <tr key={s._id} className="border-b border-ochre/10 hover:bg-ochre/5 transition-colors">
                              <td className="py-4 px-4 font-medium text-coffee">
                                <a href={`mailto:${s.email}`} className="hover:text-ochre transition-colors">{s.email}</a>
                              </td>
                              <td className="py-4 px-4 text-sm text-coffee/60">
                                {new Date(s.createdAt).toLocaleString()}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button onClick={() => handleDeleteSubscriber(s._id)} className="text-red-500/70 hover:text-red-600 transition-colors" title="Delete Subscriber">
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:col-span-5 bg-cream border border-ochre/20 p-6 rounded-lg shadow-inner">
                    <h3 className="text-lg font-serif font-bold text-coffee uppercase tracking-widest mb-4 border-b border-ochre/10 pb-2">
                      📢 Broadcast Campaign
                    </h3>
                    <p className="text-xs text-coffee/60 mb-6 uppercase tracking-wider">
                      Send a premium branded promotion or update directly to all active subscribers.
                    </p>
                    
                    <form onSubmit={handleBroadcastSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Email Subject</label>
                        <input
                          type="text"
                          value={broadcastSubject}
                          onChange={(e) => setBroadcastSubject(e.target.value)}
                          required
                          className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                          placeholder="e.g. Exclusive Gold Offers! ✨"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Message Content</label>
                        <textarea
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                          required
                          rows="6"
                          className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre resize-none transition-colors"
                          placeholder="Dear Customer, we are pleased to announce..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={broadcasting || subscribers.length === 0}
                        className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 rounded-sm transition-all disabled:opacity-50"
                      >
                        {broadcasting ? 'Sending Campaign...' : 'Send Broadcast Email 🚀'}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'messages' && (
              <section className="bg-cream-alt p-6 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-ochre/10 pb-3">
                  <MessageSquare className="text-ochre" size={28} />
                  <h2 className="text-2xl font-serif font-bold text-coffee transition-colors duration-300">
                    Direct <span className="text-ochre">Messages</span>
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {messages.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-8 text-coffee/50">No messages found.</div>
                  ) : (
                    messages.map((m) => (
                      <div key={m._id} className="bg-cream border border-ochre/20 p-6 rounded-lg relative shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-serif font-bold text-coffee">{m.name}</h4>
                            <a href={`mailto:${m.email}`} className="text-sm text-ochre hover:underline">{m.email}</a>
                          </div>
                          <button onClick={() => handleDeleteMessage(m._id)} className="text-red-500/70 hover:text-red-600 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p className="text-coffee/80 text-sm whitespace-pre-wrap bg-cream-alt p-4 rounded border border-ochre/10">{m.message}</p>
                        <div className="mt-4 text-xs text-coffee/50 text-right">
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-[100] bg-coffee/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest">Edit Design</h3>
              <button onClick={() => setEditingItem(null)} className="text-coffee/50 hover:text-ochre">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-coffee/70 uppercase tracking-widest">Target Page</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="both" checked={editingItem.targetPage === 'both'} onChange={() => setEditingItem({ ...editingItem, targetPage: 'both' })} className="accent-ochre" />
                    <span className="text-sm text-coffee">Both</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="shop" checked={editingItem.targetPage === 'shop'} onChange={() => setEditingItem({ ...editingItem, targetPage: 'shop' })} className="accent-ochre" />
                    <span className="text-sm text-coffee">Shop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="collection" checked={editingItem.targetPage === 'collection'} onChange={() => setEditingItem({ ...editingItem, targetPage: 'collection' })} className="accent-ochre" />
                    <span className="text-sm text-coffee">Collection</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest">Select Category</label>
                  <select value={editingItem.category || 'gold'} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre">
                    <option value="gold">Gold Jewellery</option>
                    <option value="silver">Silver Jewellery</option>
                    <option value="rudraksha">Rudraksha</option>
                    <option value="antique">Antique Items</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest">Item Type</label>
                  <input 
                    type="text" 
                    list="editSubCatsList"
                    value={editingItem.subCategory || ''} 
                    onChange={(e) => setEditingItem({ ...editingItem, subCategory: e.target.value })} 
                    className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre" 
                    placeholder="e.g. Ring, Chain" 
                  />
                  <datalist id="editSubCatsList">
                    {[...new Set(gallery.filter(i => i.category === editingItem.category && i.subCategory).map(i => i.subCategory))].map(sub => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-coffee/70 uppercase tracking-widest">Item Name</label>
                <input type="text" value={editingItem.name || ''} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre" placeholder="e.g. Royal Heritage Necklace" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-coffee/70 uppercase tracking-widest">Description</label>
                <textarea value={editingItem.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} rows="2" className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre resize-none" placeholder="A timeless piece..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest text-red-500 font-bold">Fixed Price (₹ - CLEAR this for Live Rate)</label>
                  <input type="number" value={editingItem.price ?? ''} onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })} className="w-full bg-cream-alt border border-red-200 p-3 rounded-sm text-coffee outline-none focus:border-red-500" placeholder="Leave empty for Live Rate" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest">Weight (Grams)</label>
                  <input type="number" step="0.01" value={editingItem.weight ?? ''} onChange={(e) => setEditingItem({ ...editingItem, weight: e.target.value })} className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest">Purity</label>
                  <select value={editingItem.purity || ''} onChange={(e) => setEditingItem({ ...editingItem, purity: e.target.value })} className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre">
                    <option value="24K">24K Gold</option>
                    <option value="22K">22K Gold</option>
                    <option value="18K">18K Gold</option>
                    <option value="90%">90% Silver</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest">Making Charges (%)</label>
                  <input type="number" step="0.01" value={editingItem.makingCharges ?? ''} onChange={(e) => setEditingItem({ ...editingItem, makingCharges: e.target.value })} className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest">Other Charges (₹)</label>
                  <input type="number" value={editingItem.otherCharges ?? ''} onChange={(e) => setEditingItem({ ...editingItem, otherCharges: e.target.value })} className="w-full bg-cream-alt border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <input 
                  type="checkbox" 
                  id="editIsFeatured" 
                  checked={editingItem.isFeatured || false}
                  onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                  className="w-5 h-5 accent-ochre"
                />
                <label htmlFor="editIsFeatured" className="text-sm text-coffee font-bold cursor-pointer">
                  Highlight this photo on Home Page?
                </label>
              </div>
              <button disabled={loading} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 rounded-sm mt-4">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {editingInstaItem && (
        <div className="fixed inset-0 z-[100] bg-coffee/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest text-ochre">Edit Instagram Post</h3>
              <button onClick={() => setEditingInstaItem(null)} className="text-coffee/50 hover:text-ochre">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleInstaEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Instagram Post URL</label>
                <input 
                  type="url" 
                  value={editingInstaItem.postUrl || ''} 
                  onChange={(e) => setEditingInstaItem({ ...editingInstaItem, postUrl: e.target.value })} 
                  className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm" 
                  placeholder="https://www.instagram.com/p/..." 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Caption / Description</label>
                <input 
                  type="text" 
                  value={editingInstaItem.caption || ''} 
                  onChange={(e) => setEditingInstaItem({ ...editingInstaItem, caption: e.target.value })} 
                  className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm" 
                  placeholder="e.g. Timeless gold necklace... ✨" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Likes Count</label>
                  <input 
                    type="number" 
                    value={editingInstaItem.likes ?? ''} 
                    onChange={(e) => setEditingInstaItem({ ...editingInstaItem, likes: e.target.value })} 
                    className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest font-bold">Comments Count</label>
                  <input 
                    type="number" 
                    value={editingInstaItem.comments ?? ''} 
                    onChange={(e) => setEditingInstaItem({ ...editingInstaItem, comments: e.target.value })} 
                    className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors text-sm" 
                  />
                </div>
              </div>
              <button disabled={loading} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 rounded-sm mt-4">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
