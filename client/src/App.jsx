import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ? localStorage.getItem('theme') : 'light'
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin/dashboard');
  const hideNavbar = isDashboard;
  const hideFooter = isAuthPage || isDashboard;

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
      {!hideNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
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
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
        </Routes>
      </AnimatePresence>
      {!hideFooter && <Footer />}

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/917621967577"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center hover:bg-[#20ba5a] cursor-pointer"
        title="Chat on WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.724-1.466L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.793 1.453 5.426.002 9.843-4.414 9.846-9.843.002-2.63-1.023-5.102-2.884-6.964C16.483 1.942 14.015.918 11.383.918 5.956.918 1.54 5.334 1.537 10.76c-.001 1.696.449 3.35 1.303 4.807l-.997 3.642 3.73-.977c1.472.802 3.111 1.222 4.774 1.222zm11.285-7.393c-.307-.154-1.817-.897-2.098-.999-.281-.102-.486-.154-.69.154-.204.307-.793.999-.972 1.203-.18.204-.359.229-.665.076-1.55-.776-2.584-1.282-3.626-3.072-.275-.472.275-.438.788-1.458.087-.174.043-.327-.022-.48-.065-.153-.59-1.417-.808-1.943-.213-.51-.43-.44-.627-.45-.162-.008-.348-.01-.534-.01-.187 0-.49.07-.747.348-.256.277-1.004.981-1.004 2.392 0 1.41 1.027 2.775 1.17 2.964.143.19 2.02 3.084 4.895 4.328.684.296 1.218.473 1.635.606.688.219 1.314.188 1.808.114.551-.082 1.817-.742 2.073-1.458.256-.717.256-1.33.18-1.458-.077-.128-.282-.204-.589-.359z"/>
        </svg>
      </a>

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
