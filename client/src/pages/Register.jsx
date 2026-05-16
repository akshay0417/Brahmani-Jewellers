import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Gem, Phone } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.mobile || !formData.password || !formData.confirmPassword) {
      return 'All fields are required.';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    if (!mobileRegex.test(formData.mobile)) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...registerData } = formData;
      const res = await api.post('/auth/register', registerData);
      setSuccess('Registration successful! Redirecting to verification...');
      setTimeout(() => {
        navigate('/login', { state: { identifier: res.data.identifier || formData.mobile, step: 2, successMsg: res.data.message } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1920&q=20')] bg-cover bg-fixed">
      <div className="absolute inset-0 bg-cream/90 backdrop-blur-sm transition-colors duration-300"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-cream-alt backdrop-blur-xl p-8 rounded-lg border border-ochre/20 shadow-2xl mt-44 mb-12 transition-colors duration-300"
      >
        <div className="text-center mb-8">
          <Gem className="text-ochre mx-auto mb-4" size={48} />
          <h2 className="text-3xl font-serif font-bold text-coffee italic uppercase">Create Account</h2>
          <p className="text-coffee/70 text-sm mt-2 uppercase tracking-widest transition-colors duration-300">Join Brahmani Jewellers</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-600 p-3 rounded mb-6 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
            <input
              type="tel"
              name="mobile"
              placeholder="10-digit Mobile Number"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ochre text-cream font-bold py-3 uppercase tracking-[0.2em] hover:bg-ochre/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-coffee/70 text-sm transition-colors duration-300">
          Already have an account?{' '}
          <Link to="/login" className="text-ochre hover:underline font-bold">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
