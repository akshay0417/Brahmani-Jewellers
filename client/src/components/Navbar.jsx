import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Gem, Phone, MessageSquare, Map, Mail, User, Send, ShoppingBag, Trash2, Plus, Minus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { cart, cartCount, cartTotal, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const location = useLocation();
  const isLoggedIn = !!sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Collection', path: '/gallery' },
    { name: 'About', path: '/#about' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({ type: 'error', text: 'Please fill all fields' });
      return;
    }
    try {
      await api.post('/messages', formData);
      setStatus({ type: 'success', text: 'Message sent successfully!' });
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus({ type: '', text: '' }), 3000);
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Error sending message' });
    }
  };

  return (
    <>
      <nav className={`fixed w-full z-40 transition-all duration-500 bg-cream/90 backdrop-blur-md border-b border-ochre/20 shadow-sm ${scrolled ? 'py-3' : 'py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center relative min-h-[50px] md:min-h-0">
            
            {/* Left Section: Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <Gem className="text-ochre group-hover:rotate-12 transition-transform duration-500" size={32} />
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-serif font-bold tracking-[0.1em] text-coffee uppercase leading-none">
                  Brahmani
                </span>
                <span className="text-[9px] md:text-xs font-serif font-light text-ochre tracking-[0.3em] uppercase leading-none mt-1">
                  Jewellers
                </span>
              </div>
            </Link>

            {/* Right Section: Navigation & Actions */}
            <div className="hidden md:flex items-center gap-10">
              <div className="flex items-center gap-8 border-r border-ochre/20 pr-10">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={(e) => {
                      if (link.path.startsWith('/#') && location.pathname === '/') {
                        e.preventDefault();
                        const element = document.getElementById(link.path.slice(2));
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                          window.history.pushState(null, '', link.path);
                        }
                      }
                    }}
                    className={`text-[11px] tracking-[0.2em] uppercase hover:text-ochre transition-colors duration-300 ${location.pathname === link.path ? 'text-ochre font-bold underline underline-offset-8' : 'text-coffee'}`}
                  >
                    {link.name}
                  </Link>
                ))}
                <button onClick={() => setIsContactOpen(true)} className="text-[11px] tracking-[0.2em] uppercase hover:text-ochre transition-colors duration-300 text-coffee">
                  Contact
                </button>
              </div>

              <div className="flex items-center gap-6">
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-coffee hover:text-ochre transition-colors">
                  <ShoppingBag size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-ochre text-coffee text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </button>

                {isLoggedIn ? (
                  <Link to={dashboardPath} className="px-5 py-2 bg-coffee text-cream hover:bg-ochre transition-all duration-300 text-[10px] tracking-widest uppercase rounded-sm">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/login" className="px-5 py-2 border border-ochre text-ochre hover:bg-ochre hover:text-cream transition-all duration-300 text-[10px] tracking-widest uppercase rounded-sm">
                    Login
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-4">
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-ochre">
                <ShoppingBag size={24} />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-coffee text-cream text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{cartCount}</span>}
              </button>
              <button onClick={() => setIsOpen(!isOpen)} className="text-ochre focus:outline-none">
                {isOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
          className="md:hidden bg-cream border-b border-ochre/20 overflow-hidden"
        >
          <div className="px-4 pt-2 pb-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={(e) => {
                  setIsOpen(false);
                  if (link.path.startsWith('/#') && location.pathname === '/') {
                    e.preventDefault();
                    const element = document.getElementById(link.path.slice(2));
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      window.history.pushState(null, '', link.path);
                    }
                  }
                }}
                className="block text-lg font-serif tracking-widest text-center py-2 text-coffee hover:text-ochre transition-colors"
              >
                {link.name}
              </Link>
            ))}
            
            <button 
              onClick={() => { setIsOpen(false); setIsContactOpen(true); }}
              className="block w-full text-lg font-serif tracking-widest text-center py-2 text-coffee hover:text-ochre transition-colors"
            >
              Contact
            </button>

            {isLoggedIn ? (
              <Link 
                to={dashboardPath} 
                onClick={() => setIsOpen(false)}
                className="block w-full py-3 bg-ochre text-cream text-center font-bold tracking-widest uppercase rounded-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsOpen(false)}
                className="block w-full py-3 bg-ochre text-cream text-center font-bold tracking-widest uppercase rounded-sm"
              >
                Login
              </Link>
            )}
          </div>
        </motion.div>
      </nav>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-cream z-[60] shadow-2xl flex flex-col">
              <div className="p-6 border-b border-ochre/20 flex justify-between items-center bg-cream-alt">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="text-ochre" size={24} />
                  <h2 className="text-2xl font-serif font-bold text-coffee uppercase tracking-wider">Your <span className="text-ochre">Cart</span></h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:text-ochre transition-colors"><X size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-6 bg-cream-alt rounded-full text-ochre/30"><ShoppingBag size={64} /></div>
                    <p className="text-coffee/50 font-serif italic text-lg">Your cart is empty.</p>
                    <button onClick={() => { setIsCartOpen(false); navigate('/shop'); }} className="px-8 py-3 bg-ochre text-coffee font-bold uppercase tracking-widest text-xs rounded-sm">Shop Now</button>
                  </div>
                ) : (
                  cart.items.map((item) => (
                    <div key={item._id} className="flex gap-4 bg-cream-alt p-4 rounded-lg border border-ochre/10 group">
                      <div className="w-20 h-24 rounded overflow-hidden border border-ochre/20 flex-shrink-0">
                        <img src={item.product.imageUrl} alt={item.product.category} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-serif text-coffee truncate pr-4">Heritage {item.product.category}</h4>
                          <button onClick={() => removeFromCart(item.product._id)} className="text-coffee/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        <p className="text-ochre font-bold mb-3">₹{(item.product.price || 0).toLocaleString('en-IN')}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-ochre/30 rounded overflow-hidden bg-cream">
                            <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="p-1.5 hover:bg-ochre/10 text-ochre"><Minus size={14} /></button>
                            <span className="w-8 text-center text-xs font-bold text-coffee">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="p-1.5 hover:bg-ochre/10 text-ochre"><Plus size={14} /></button>
                          </div>
                          <span className="text-xs text-coffee/40 uppercase font-bold tracking-widest">Quantity</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.items.length > 0 && (
                <div className="p-6 bg-cream-alt border-t border-ochre/20 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-coffee/60 uppercase tracking-[0.2em] text-xs font-bold">Subtotal</span>
                    <span className="text-2xl font-bold text-coffee">₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[10px] text-coffee/40 uppercase tracking-widest text-center mb-4 italic">* Taxes and shipping calculated at checkout</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/cart'); }}
                    className="w-full py-4 bg-coffee text-cream font-bold uppercase tracking-widest rounded-sm hover:bg-coffee/90 transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    View Cart & Checkout <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contact Slide Drawer */}
      <AnimatePresence>
        {isContactOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsContactOpen(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-cream z-50 shadow-2xl flex flex-col overflow-y-auto">
              <div className="p-6 border-b border-ochre/20 flex justify-between items-center bg-cream-alt sticky top-0 z-10">
                <h2 className="text-2xl font-serif font-bold text-coffee">Contact <span className="text-ochre">Us</span></h2>
                <button onClick={() => setIsContactOpen(false)} className="text-coffee hover:text-ochre transition-colors bg-cream p-2 rounded-full shadow-sm border border-ochre/20"><X size={24} /></button>
              </div>

              <div className="p-6 flex-1">
                <div className="space-y-6 mb-10">
                  <div className="bg-cream-alt border border-ochre/20 p-4 rounded-lg flex items-start gap-4 shadow-sm">
                    <Phone className="text-ochre flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-coffee font-serif mb-1">Call Us</h4>
                      <a href="tel:+919925811771" className="text-coffee/70 text-sm hover:text-ochre transition-colors">+91 9925811771</a>
                    </div>
                  </div>
                  <div className="bg-cream-alt border border-ochre/20 p-4 rounded-lg flex items-start gap-4 shadow-sm">
                    <MessageSquare className="text-ochre flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-coffee font-serif mb-1">WhatsApp</h4>
                      <a href="https://wa.me/919925811771" className="text-coffee/70 text-sm hover:text-ochre transition-colors">Chat with Experts</a>
                    </div>
                  </div>
                  <div className="bg-cream-alt border border-ochre/20 p-4 rounded-lg flex items-start gap-4 shadow-sm">
                    <Map className="text-ochre flex-shrink-0 mt-1" size={20} />
                    <div>
                      <h4 className="text-coffee font-serif mb-1">Location</h4>
                      <p className="text-coffee/70 text-sm leading-relaxed">Choksi Bazar, Azad Chowk, Amraiwadi, Ahmedabad</p>
                    </div>
                  </div>
                </div>

                <div className="bg-cream-alt border border-ochre/20 p-6 rounded-xl shadow-sm">
                  <h3 className="text-xl font-serif text-coffee mb-6">Send A Message</h3>
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    {status.text && <div className={`p-3 rounded text-sm ${status.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{status.text}</div>}
                    <div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ochre w-5 h-5" />
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-cream border border-ochre/30 rounded-lg py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre" placeholder="Your Name" />
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ochre w-5 h-5" />
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-cream border border-ochre/30 rounded-lg py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre" placeholder="Email Address" />
                      </div>
                    </div>
                    <div>
                      <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-cream border border-ochre/30 rounded-lg py-3 px-4 text-coffee focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre min-h-[100px]" placeholder="Your Message..."></textarea>
                    </div>
                    <button type="submit" className="w-full bg-ochre text-coffee font-bold uppercase tracking-widest py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-ochre/90 transition-colors">
                      Send <Send size={18} />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
