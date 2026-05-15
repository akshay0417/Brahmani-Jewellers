import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck } from 'lucide-react';
import api from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus({ type: 'success', message: res.data.message || 'Password reset link sent to your email.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to process request. Please check the email address.' });
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
          <h2 className="text-3xl font-serif font-bold text-coffee mb-2">Forgot Password</h2>
          <p className="text-coffee/70 text-sm">Enter your email address to receive a password reset link.</p>
        </div>

        {status.message && (
          <div className={`p-4 rounded mb-6 text-sm text-center ${status.type === 'success' ? 'bg-green-500/10 text-green-700 border border-green-500/30' : 'bg-red-500/10 text-red-600 border border-red-500/30'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee/50" size={20} />
            <input
              type="email"
              value={email}
              placeholder="Email Address"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-coffee transition-colors"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-coffee text-cream font-medium py-3 hover:bg-coffee/90 transition-all disabled:opacity-50 rounded-sm"
          >
            {loading ? 'Sending...' : 'Reset Password'}
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

export default ForgotPassword;
