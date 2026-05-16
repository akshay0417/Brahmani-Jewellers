import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light'
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin/dashboard');
  const hideHeaderFooter = isAuthPage || isDashboard;

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = !!sessionStorage.getItem('token');
    // Check if we already showed the prompt in this session
    const hasSeenPrompt = sessionStorage.getItem('hasSeenLoginPrompt');

    if (!isLoggedIn && !hasSeenPrompt && !isAuthPage) {
      const timer = setTimeout(() => {
        setShowLoginPrompt(true);
        sessionStorage.setItem('hasSeenLoginPrompt', 'true');
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isAuthPage]);
  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-cream text-coffee font-sans selection:bg-ochre selection:text-cream transition-colors duration-300">
      {!hideHeaderFooter && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </AnimatePresence>
      {!hideHeaderFooter && <Footer />}

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-coffee/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-cream p-8 rounded-xl shadow-2xl max-w-md w-full relative border border-ochre/20"
            >
              <button 
                onClick={() => setShowLoginPrompt(false)}
                className="absolute top-4 right-4 text-coffee/50 hover:text-ochre transition-colors"
              >
                <X size={24} />
              </button>
              <div className="text-center">
                <h2 className="text-3xl font-serif font-bold text-coffee mb-2">Welcome!</h2>
                <p className="text-coffee/70 mb-8">Sign in to unlock exclusive designs, track your orders, and enjoy a personalized experience.</p>
                <div className="flex flex-col gap-4">
                  <Link 
                    to="/login"
                    onClick={() => setShowLoginPrompt(false)}
                    className="w-full py-3 bg-ochre text-cream font-bold uppercase tracking-widest rounded-sm hover:bg-ochre/90 transition-all inline-block"
                  >
                    Login Now
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setShowLoginPrompt(false)}
                    className="w-full py-3 border border-ochre text-ochre font-bold uppercase tracking-widest rounded-sm hover:bg-ochre/10 transition-all inline-block"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
