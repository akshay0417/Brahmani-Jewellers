import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Gem, Key, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const location = useLocation();
  const [loginMethod, setLoginMethod] = useState('password'); // 'otp' or 'password'
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // in seconds
  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && step === 2) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
    const autoToken = params.get('token');
    
    if (verified === 'true') {
      if (autoToken) {
        const userObj = {
          id: params.get('userId'),
          name: params.get('userName'),
          email: params.get('userEmail'),
          mobile: params.get('userMobile'),
          role: params.get('userRole') || 'user'
        };
        sessionStorage.setItem('token', autoToken);
        sessionStorage.setItem('user', JSON.stringify(userObj));
        
        const dashboardPath = userObj.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(dashboardPath);
        window.location.reload();
        return;
      }
      setSuccessMsg(msg || 'Your account has been successfully verified! You can now log in.');
      setLoginMethod('password');
    } else if (verified === 'false' && msg) {
      setError(msg);
    } else if (msg) {
      setSuccessMsg(msg);
    }
  }, [location.search, navigate]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/auth/login', { identifier: identifier.trim(), password });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      const dashboardPath = res.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      navigate(dashboardPath);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.unverified) {
        setSuccessMsg('Your account is not verified yet. We have sent a verification OTP to your email/mobile. Please enter it below.');
        try {
          await api.post('/auth/request-otp', { identifier });
        } catch (otpErr) {
          console.error(otpErr);
        }
        setStep(2);
        setOtpTimer(120);
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
      const res = await api.post('/auth/request-otp', { identifier: identifier.trim() });
      setSuccessMsg(res.data.message);
      setStep(2);
      setOtpTimer(120); // 2 minutes validity
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
      const res = await api.post('/auth/verify-otp', { identifier: identifier.trim(), otp: otp.trim() });
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
    <div className="min-h-screen flex items-center justify-center px-4 pt-32 pb-12 bg-gradient-to-br from-cream via-cream-alt to-ochre/20">
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm bg-cream-alt/95 p-6 rounded-lg border border-ochre/20 shadow-2xl transition-colors duration-300"
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Password"
                required
                className="w-full bg-cream border border-ochre/20 rounded-sm py-3 pl-12 pr-12 text-coffee focus:outline-none focus:border-ochre transition-colors"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ochre/50 hover:text-ochre focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
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
              <button type="button" onClick={() => { setStep(1); setError(''); setSuccessMsg(''); setOtp(''); setOtpTimer(0); }} className="text-coffee/70 hover:text-ochre transition-colors">
                Change Identifier
              </button>
              {otpTimer > 0 ? (
                <span className="text-coffee/70 font-bold bg-cream-alt px-2 py-1 rounded border border-ochre/20">Valid for {formatTimer(otpTimer)}</span>
              ) : (
                <button type="button" onClick={handleRequestOtp} className="text-ochre hover:underline font-bold">
                  Resend OTP
                </button>
              )}
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
