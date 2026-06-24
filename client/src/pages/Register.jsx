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
  const [step, setStep] = useState(1); // 1 = register form, 2 = OTP verification
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
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
    setSuccess('');
    try {
      const { confirmPassword, ...registerData } = formData;
      await api.post('/auth/register', registerData);
      setSuccess('Registration successful! Please enter the OTP code sent to your email/mobile.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }
    setOtpLoading(true);
    setError('');
    setSuccess('');
    try {
      const identifier = formData.email || formData.mobile;
      const res = await api.post('/auth/verify-otp', { identifier, otp });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess('Login Successful!');
      setTimeout(() => {
        const dashboardPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(dashboardPath);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    try {
      const identifier = formData.email || formData.mobile;
      await api.post('/auth/request-otp', { identifier });
      setSuccess('OTP resent successfully. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
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

        {step === 1 ? (
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
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-coffee/80 leading-relaxed">
                Please enter the 6-digit OTP code sent to your email/mobile.
              </p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                required
                value={otp}
                className="w-full bg-cream border border-ochre/20 rounded-sm py-3 px-4 text-coffee focus:outline-none focus:border-ochre transition-colors tracking-[0.3em] text-center text-lg font-bold"
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <button 
                type="button" 
                onClick={() => { setStep(1); setError(''); setSuccess(''); }} 
                className="text-coffee/70 hover:text-ochre transition-colors"
              >
                Back to Signup
              </button>
              <button 
                type="button" 
                onClick={handleResendOtp} 
                className="text-ochre hover:underline font-bold"
              >
                Resend OTP
              </button>
            </div>
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full bg-ochre text-cream font-bold py-3 uppercase tracking-[0.2em] hover:bg-ochre/90 transition-all disabled:opacity-50"
            >
              {otpLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-coffee/70 text-sm transition-colors duration-300">
          Already have an account?{' '}
          <Link to="/login" className="text-ochre hover:underline font-bold">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
