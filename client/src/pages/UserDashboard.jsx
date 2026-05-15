import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Shield, Clock } from 'lucide-react';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
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
    }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-2 bg-cream-alt border border-ochre/10 p-8 rounded-lg shadow-sm transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6 border-b border-ochre/10 pb-4 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <UserIcon className="text-ochre" size={24} />
                <h2 className="text-xl font-serif font-bold text-coffee uppercase tracking-widest transition-colors duration-300">Profile Details</h2>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-ochre uppercase hover:underline">
                  Edit Profile
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
                  Save Changes
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
            className="col-span-1 bg-cream border border-ochre/20 p-8 rounded-lg flex flex-col items-center justify-center text-center transition-colors duration-300 shadow-sm"
          >
            <Clock className="text-ochre mb-4" size={40} />
            <h3 className="text-lg font-serif font-bold text-coffee uppercase tracking-widest mb-2 transition-colors duration-300">Order History</h3>
            <p className="text-sm text-coffee/70 transition-colors duration-300">Your recent orders and inquiries will appear here soon.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
