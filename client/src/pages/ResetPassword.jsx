import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import api from '../api';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setStatus({ type: 'error', message: 'Invalid or missing reset token.' });
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'Missing reset token.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setStatus({ type: 'success', message: res.data.message || 'Password reset successfully. Redirecting to login...' });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-cream-alt p-8 rounded-lg border border-ochre/20 shadow-sm"
      >
        <div className="text-center mb-8">
          <ShieldCheck className="text-coffee mx-auto mb-4" size={48} />
          <h2 className="text-3xl font-serif font-bold text-coffee mb-2">Reset Password</h2>
          <p className="text-coffee/70 text-sm">Create a new password for your account.</p>
        </div>

        {status.message && (
          <div className={`p-4 rounded mb-6 text-sm text-center ${status.type === 'success' ? 'bg-green-500/10 text-green-700 border border-green-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/30'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee/50" size={20} />
            <input
              type="password"
              value={newPassword}
              placeholder="New Password"
              required
              disabled={!token || status.type === 'success'}
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-coffee transition-colors"
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee/50" size={20} />
            <input
              type="password"
              value={confirmPassword}
              placeholder="Confirm New Password"
              required
              disabled={!token || status.type === 'success'}
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-coffee transition-colors"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !token || status.type === 'success'}
            className="w-full bg-coffee text-cream font-medium py-3 hover:bg-coffee/90 transition-all disabled:opacity-50 rounded-sm"
          >
            {loading ? 'Resetting...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-coffee hover:text-ochre transition-colors font-medium border-b border-transparent hover:border-ochre pb-1">
            &larr; Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
