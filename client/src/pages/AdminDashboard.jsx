import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Upload, Trash2, TrendingUp, Image as ImageIcon, CheckCircle, AlertCircle, User, MessageSquare } from 'lucide-react';

const AdminDashboard = () => {
  const [rates, setRates] = useState({ isManual: true, goldImpFine: '', silverFine: '', manualGold24K: '', manualGold22K: '', manualGold18K: '', manualSilver90: '' });
  const [gallery, setGallery] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newImage, setNewImage] = useState(null);
  const [category, setCategory] = useState('gold');
  const [weight, setWeight] = useState('');
  const [purity, setPurity] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [user, setUser] = useState(null);
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
      const rateRes = await api.get('/rates');
      if (rateRes.data) setRates({ 
        isManual: rateRes.data.isManual ?? true,
        goldImpFine: rateRes.data.goldImpFine || '',
        silverFine: rateRes.data.silverFine || '',
        manualGold24K: rateRes.data.gold24K || '',
        manualGold22K: rateRes.data.gold22K || '',
        manualGold18K: rateRes.data.gold18K || '',
        manualSilver90: rateRes.data.silver90 || ''
      });
      
      const galleryRes = await api.get('/gallery');
      setGallery(galleryRes.data);

      const usersRes = await api.get('/users', config);
      if (usersRes.data) setUsers(usersRes.data);

      const messagesRes = await api.get('/messages', config);
      if (messagesRes.data) setMessages(messagesRes.data);
    } catch (err) {
      console.error(err);
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

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!newImage) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', newImage);
    formData.append('category', category);
    formData.append('weight', weight);
    formData.append('purity', purity);
    formData.append('price', rates.price || '');

    try {
      await api.post('/gallery', formData, {
        headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
      });
      setNewImage(null);
      setWeight('');
      setPurity('');
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

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-cream pt-12 pb-24 px-4 md:px-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-coffee uppercase tracking-wider transition-colors duration-300">Dashboard</h1>
            <p className="text-ochre/80 tracking-[0.2em] text-xs mt-1">
              WELCOME BACK, {user?.name?.toUpperCase() || 'USER'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex items-center justify-center gap-2 px-4 py-2 bg-coffee/5 text-coffee border border-coffee/20 hover:bg-coffee hover:text-cream transition-all rounded-sm text-sm font-medium">
              Home
            </Link>
            <button onClick={logout} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all rounded-sm font-medium">
              <LogOut size={18} /> Logout
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Rate Management */}
          <section className="bg-cream-alt p-8 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300">
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
                  <p className="text-xs text-coffee/70 font-bold mb-2">AUTO CALCULATOR (Enters Fine, calculates 24K/22K/18K/90%)</p>
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

              <button disabled={loading} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 transition-all rounded-sm">
                {loading ? 'Processing...' : 'Save Market Prices'}
              </button>
            </form>
          </section>

          {/* Gallery Management - Upload */}
          <section className="bg-cream-alt p-8 rounded-lg shadow-sm border border-ochre/10 transition-colors duration-300">
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
                  <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Weight (e.g. 10g)</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                    placeholder="Enter weight"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-coffee/70 uppercase tracking-widest transition-colors duration-300">Purity (e.g. 22K)</label>
                  <input
                    type="text"
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    className="w-full bg-cream border border-ochre/20 p-3 rounded-sm text-coffee outline-none focus:border-ochre transition-colors"
                    placeholder="Enter purity"
                  />
                </div>
              </div>
              <button disabled={loading || !newImage} className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest hover:bg-ochre/90 transition-all disabled:opacity-50 rounded-sm">
                {loading ? 'Uploading...' : 'Add to Collection'}
              </button>
            </form>
          </section>
        </div>

        {/* Gallery List */}
        <section className="mt-12 bg-cream-alt p-8 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
          <h2 className="text-2xl font-serif font-bold text-coffee mb-8 border-b border-ochre/10 pb-4 transition-colors duration-300">
            Manage <span className="text-ochre">Collection</span>
          </h2>
          {gallery.length === 0 ? (
            <p className="text-coffee/50 text-center py-8 transition-colors duration-300">No images found in the collection.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {gallery.map((item) => (
                <div key={item._id} className="relative group rounded-md overflow-hidden aspect-square border border-ochre/20 shadow-sm">
                  <img src={item.imageUrl} alt="Design" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-coffee/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button onClick={() => deleteImage(item._id)} className="p-3 bg-red-600/90 rounded-full text-white hover:bg-red-600 transform hover:scale-110 transition-all shadow-lg">
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-cream-alt/90 text-coffee text-[10px] uppercase font-bold tracking-wider rounded-sm shadow-sm backdrop-blur-sm">
                    {item.category} {item.weight && `| ${item.weight}`} {item.purity && `| ${item.purity}`} {item.price && `| ₹${item.price}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* User Management List */}
        <section className="mt-12 bg-cream-alt p-8 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-8 border-b border-ochre/10 pb-4">
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
                  <th className="py-4 px-4">Joined Date</th>
                  <th className="py-4 px-4">Last Login</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-coffee/50">No users found.</td>
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

        {/* Messages Section */}
        <section className="mt-12 bg-cream-alt p-8 border border-ochre/10 rounded-lg shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3 mb-8 border-b border-ochre/10 pb-4">
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
      </div>
    </div>
  );
};

export default AdminDashboard;
