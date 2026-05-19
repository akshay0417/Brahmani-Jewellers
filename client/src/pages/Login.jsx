import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Gem, Key } from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const [loginMethod, setLoginMethod] = useState('password'); // 'otp' or 'password'
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state) {
      if (location.state.identifier) setIdentifier(location.state.identifier);
      if (location.state.step) setStep(location.state.step);
      if (location.state.successMsg) setSuccessMsg(location.state.successMsg);
    }
  }, [location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    const msg = params.get('message');
    if (verified === 'true') {
      setSuccessMsg(msg || 'Your account has been successfully verified! You can now log in.');
      setLoginMethod('password');
    } else if (verified === 'false' && msg) {
      setError(msg);
    } else if (msg) {
      setSuccessMsg(msg);
    }
  }, [location.search]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { identifier, password });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      const dashboardPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(dashboardPath);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.unverified) {
        setError(err.response.data.message || 'Your account is not verified yet. Please check your email for the verification link.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/auth/request-otp', { identifier });
      setSuccessMsg(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. User may not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { identifier, otp });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      const dashboardPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(dashboardPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32 bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1920&q=20')] bg-cover bg-fixed">
      <div className="absolute inset-0 bg-cream/90 backdrop-blur-sm transition-colors duration-300"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-cream-alt backdrop-blur-xl p-8 rounded-lg border border-ochre/20 shadow-2xl transition-colors duration-300"
      >
        <div className="text-center mb-6">
          <img 
            src="/logo.png" 
            alt="Brahmani Jewellers Logo" 
            className="h-16 w-16 mx-auto mb-4 object-contain transition-transform duration-300 hover:scale-105" 
          />
          <h2 className="text-3xl font-serif font-bold text-coffee italic uppercase">Welcome Back</h2>
          <p className="text-coffee/70 text-sm mt-2 uppercase tracking-widest transition-colors duration-300">Sign in to your account</p>
        </div>

        {step === 1 && (
          <div className="flex bg-cream rounded-sm p-1 mb-8 border border-ochre/10 transition-colors duration-300">
            <button
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors rounded-sm ${loginMethod === 'otp' ? 'bg-cream-alt shadow-sm text-ochre' : 'text-coffee/60 hover:text-coffee'}`}
              onClick={() => { setLoginMethod('otp'); setError(''); setSuccessMsg(''); }}
            >
              OTP
            </button>
            <button
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors rounded-sm ${loginMethod === 'password' ? 'bg-cream-alt shadow-sm text-ochre' : 'text-coffee/60 hover:text-coffee'}`}
              onClick={() => { setLoginMethod('password'); setError(''); setSuccessMsg(''); }}
            >
              Password
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-600 p-3 rounded mb-6 text-sm text-center">
            {successMsg}
          </div>
        )}

        {step === 1 && loginMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
              <input
                type="text"
                value={identifier}
                placeholder="Email or Mobile Number"
                required
                className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
              <input
                type="password"
                value={password}
                placeholder="Password"
                required
                className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-coffee/70 hover:text-ochre transition-colors">
                Forgot Password?
              </Link>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ochre text-cream font-bold py-3 uppercase tracking-[0.2em] hover:bg-ochre/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {step === 1 && loginMethod === 'otp' && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
              <input
                type="text"
                value={identifier}
                placeholder="Email or Mobile Number"
                required
                className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors"
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !identifier}
              className="w-full bg-ochre text-cream font-bold py-3 uppercase tracking-[0.2em] hover:bg-ochre/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Request OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-ochre/50" size={20} />
              <input
                type="text"
                value={otp}
                placeholder="Enter 6-digit OTP"
                required
                className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre transition-colors tracking-widest text-center"
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep(1); setError(''); setSuccessMsg(''); setOtp(''); }} className="text-coffee/70 hover:text-ochre transition-colors">
                Change Identifier
              </button>
              <button type="button" onClick={handleRequestOtp} className="text-ochre hover:underline">
                Resend OTP
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !otp}
              className="w-full bg-ochre text-cream font-bold py-3 uppercase tracking-[0.2em] hover:bg-ochre/90 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-coffee/70 text-sm transition-colors duration-300">
          Don't have an account?{' '}
          <Link to="/register" className="text-ochre hover:underline font-bold">Register</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
