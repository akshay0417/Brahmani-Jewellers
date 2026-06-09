import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Gem, Phone, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '', termsAccepted: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.mobile || !formData.password || !formData.confirmPassword) {
      return 'All fields are required.';
    }
    if (!formData.termsAccepted) {
      return 'You must agree to the Terms & Conditions and Privacy Policy.';
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
      setSuccess('Registration successful! Please check your email for the verification link.');
      setTimeout(() => {
        navigate('/login', { state: { identifier: res.data.identifier || formData.email || formData.mobile, step: 1, successMsg: res.data.message } });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32 pb-12 bg-gradient-to-br from-cream via-cream-alt to-ochre/20">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm bg-cream-alt/95 p-6 rounded-lg border border-ochre/20 shadow-2xl transition-colors duration-300"
      >
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Brahmani Jewellers Logo" 
            className="h-16 w-16 mx-auto mb-4 object-contain transition-transform duration-300 hover:scale-105" 
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
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
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-12 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ochre/50 hover:text-ochre focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              required
              className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-12 text-coffee focus:outline-none focus:border-ochre transition-colors"
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ochre/50 hover:text-ochre focus:outline-none"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              className="w-4 h-4 rounded text-ochre focus:ring-ochre border-ochre/20 cursor-pointer"
            />
            <label htmlFor="termsAccepted" className="text-xs text-coffee/80 cursor-pointer">
              I agree to the{' '}
              <Link to="/terms-conditions" className="text-ochre hover:underline font-bold" target="_blank">
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="text-ochre hover:underline font-bold" target="_blank">
                Privacy Policy
              </Link>
            </label>
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
