import React, { useState, useEffect } from 'react';
import api from '../api';
import Hero from '../components/Hero';
import RatesSection from '../components/RatesSection';
import GoogleReviews from '../components/GoogleReviews';
import InstagramFeed from '../components/InstagramFeed';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, CheckCircle, Map, Star, Send, User, Mail } from 'lucide-react';

const About = () => (
  <section className="py-10 md:py-12 bg-cream transition-colors duration-300" id="about">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      {/* Left side: Image */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative order-2 md:order-1"
      >
        <div className="absolute -inset-4 border-2 border-ochre/40 translate-x-4 translate-y-4 rounded-lg"></div>
        <img 
          src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt="Brahmani Jewellers Showroom" 
          className="relative z-10 w-full rounded-lg shadow-2xl hover:scale-[1.02] transition-transform duration-500 object-cover aspect-[4/5]"
        />
        {/* Years of trust badge */}
        <div className="absolute -bottom-6 -right-6 z-20 bg-ochre text-coffee p-6 rounded-lg shadow-xl text-center">
          <span className="block text-4xl font-bold font-serif">35+</span>
          <span className="text-sm font-medium uppercase tracking-wider">Years of Trust</span>
        </div>
      </motion.div>

      {/* Right side: Text Content */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="order-1 md:order-2"
      >
        <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-coffee shadow-sm transition-colors duration-300">
          About <span className="text-ochre">Brahmani Jewellers</span>
        </h2>
        <div className="w-20 h-1 bg-ochre mb-8"></div>
        
        <div className="text-coffee/80 leading-relaxed mb-8 text-lg transition-colors duration-300 space-y-4">
          <p>“Elegance that defines you” — celebrating over 35 years of excellence, trust, and timeless craftsmanship in jewellery design. Each piece we create reflects our legacy of purity, precision, and passion, making every moment you cherish even more special with a touch of true elegance.</p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {[
            "Trusted Jewellery",
            "Certified Gold & Silver",
            "Latest Designs"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <CheckCircle className="text-ochre w-6 h-6 flex-shrink-0" />
              <span className="text-coffee font-medium text-lg transition-colors duration-300">{item}</span>
            </div>
          ))}
        </div>

        <div className="bg-cream-alt border-l-4 border-ochre p-6 rounded-r-lg space-y-4 transition-colors duration-300">
          <div className="flex items-start gap-4">
            <Map className="text-ochre w-6 h-6 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-coffee/60 uppercase tracking-wider font-semibold mb-1 transition-colors duration-300">Our Location</p>
              <a 
                href="https://maps.app.goo.gl/ey6AtEEev3JdAEo59" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-coffee hover:text-ochre transition-colors duration-300 font-medium underline underline-offset-4 decoration-ochre/30"
              >
                Choksi Bazar, Azad Chowk, Amraiwadi, Ahmedabad
              </a>
            </div>
          </div>
          <div className="w-full h-px bg-coffee/10 transition-colors duration-300"></div>
          <div className="flex items-start gap-4">
            <Phone className="text-ochre w-6 h-6 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-coffee/60 uppercase tracking-wider font-semibold mb-1 transition-colors duration-300">Contact Us</p>
              <p className="text-coffee font-semibold text-lg transition-colors duration-300">+91 9925811771</p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  </section>
);

const Categories = () => {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    api.get('/gallery').then(res => {
      // slice top 8 for the home page showcase to fill a 4-col grid nicely
      const showcased = res.data.slice(0, 8);
      setItems(showcased);
    }).catch(err => console.log("Error fetching gallery", err));
  }, []);

  return (
    <section className="py-10 md:py-12 bg-cream-alt transition-colors duration-300" id="categories">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-12">
          <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="text-ochre tracking-[0.5em] uppercase text-xs font-bold mb-4 block">Royal Showcase</motion.span>
          <h2 className="text-4xl font-serif font-bold mb-4 text-coffee transition-colors duration-300">Featured <span className="text-ochre">Masterpieces</span></h2>
          <p className="text-coffee/70 transition-colors duration-300">Discover the latest arrivals and exquisite designs from our gallery</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:auto-rows-[280px]">
          {items.map((item, idx) => (
            <Link
              key={item._id || idx}
              to={`/gallery?category=${item.category}`}
              className={`block group ${item.isFeatured ? 'md:col-span-2 md:row-span-2' : ''}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 4) * 0.15 }}
                className="relative h-full min-h-[280px] rounded-xl overflow-hidden cursor-pointer shadow-xl shadow-coffee/5 border border-ochre/15 hover:border-ochre/60 transition-colors duration-300"
              >
                <img src={item.imageUrl} alt={item.name || item.category} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee/90 via-coffee/40 to-transparent flex flex-col justify-end p-4 md:p-6">
                  <h3 className={`${item.isFeatured ? 'text-base md:text-lg' : 'text-xs md:text-sm'} font-serif text-cream mb-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300`}>{item.name || `${item.category} Design`}</h3>
                  <p className="text-cream/80 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 line-clamp-2">{item.description || item.subCategory || "Exquisite craftsmanship"}</p>
                  <span className="text-[9px] tracking-[0.2em] text-ochre uppercase font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">View Category →</span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
        
        {items.length === 0 && (
          <div className="text-center text-coffee/50 py-10">Loading masterpieces...</div>
        )}
        
        <div className="mt-16 text-center">
          <Link to="/gallery" className="inline-block px-8 py-3 border border-ochre text-coffee font-bold uppercase tracking-widest text-sm hover:bg-ochre hover:text-cream transition-colors duration-300 shadow-sm hover:shadow-md">
            Explore Full Collection
          </Link>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => (
  <section className="py-16 md:py-20 bg-cream border-y border-ochre/10 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-10 sm:mb-12">
        <h2 className="text-4xl font-serif font-bold mb-4 text-coffee transition-colors duration-300">Customer <span className="text-ochre">Reviews</span></h2>
        <p className="text-coffee/70 transition-colors duration-300 mb-8">What our trusted family of customers say about us</p>
        <motion.a 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://www.google.com/maps/search/Brahmani+Jewellers+Amraiwadi+Ahmedabad"
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-3 bg-white text-coffee border border-coffee/10 shadow-md hover:shadow-lg rounded-full font-bold uppercase tracking-widest text-sm transition-all duration-300"
        >
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
          Review Us on Google
        </motion.a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { name: "Rahul Patel", review: "Best place for authentic gold jewellery in Amraiwadi. The designs are unique and the trust they have built over years is remarkable.", rating: 5 },
          { name: "Sneha Shah", review: "Purchased a silver set and absolutely loved the craftsmanship. They maintain pure transparency with rates.", rating: 5 },
          { name: "Vikram Singh", review: "Great customer service and premium collection. Got my Rudraksha from here, absolutely certified and genuine.", rating: 4 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-cream-alt p-8 rounded-xl text-center flex flex-col justify-between shadow-md border border-ochre/20"
          >
            <div>
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className={i < item.rating ? "text-ochre fill-ochre" : "text-coffee/30"} />
                ))}
              </div>
              <p className="text-coffee/80 italic mb-8 transition-colors duration-300">"{item.review}"</p>
            </div>
            <div>
              <div className="w-12 h-px bg-ochre/50 mx-auto mb-4"></div>
              <h4 className="text-ochre font-serif tracking-widest uppercase text-sm">{item.name}</h4>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

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
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Error sending message' });
    }
  };

  return (
    <section className="py-10 md:py-12 bg-cream-alt relative overflow-hidden transition-colors duration-300" id="contact">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-4xl font-serif font-bold mb-4 text-coffee transition-colors duration-300">Get In <span className="text-ochre">Touch</span></h2>
          <p className="text-coffee/70 transition-colors duration-300">Visit us or reach out for personalized design consultations</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info & Map */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-cream border border-ochre/20 p-5 rounded-lg flex items-start gap-3 shadow-sm">
                <Phone className="text-ochre flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="text-coffee font-serif text-sm mb-0.5 transition-colors duration-300 font-bold">Call Us</h4>
                  <p className="text-coffee/70 text-xs mb-1.5 transition-colors duration-300 font-medium">+91 9925811771</p>
                  <a href="tel:+919925811771" className="text-ochre text-[10px] font-bold uppercase tracking-wider hover:underline">Call Now</a>
                </div>
              </div>
              <div className="bg-cream border border-ochre/20 p-5 rounded-lg flex items-start gap-3 shadow-sm">
                <MessageSquare className="text-ochre flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="text-coffee font-serif text-sm mb-0.5 transition-colors duration-300 font-bold">WhatsApp</h4>
                  <p className="text-coffee/70 text-xs mb-1.5 transition-colors duration-300 font-medium">Chat with us</p>
                  <a href="https://wa.me/919925811771" className="text-ochre text-[10px] font-bold uppercase tracking-wider hover:underline">Message</a>
                </div>
              </div>
              <div className="bg-cream border border-ochre/20 p-5 rounded-lg flex items-start gap-3 shadow-sm">
                <MapPin className="text-ochre flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="text-coffee font-serif text-sm mb-0.5 transition-colors duration-300 font-bold">Location</h4>
                  <p className="text-coffee/70 text-xs mb-1.5 transition-colors duration-300 font-medium">Azad Chowk</p>
                  <a 
                    href="https://maps.app.goo.gl/ey6AtEEev3JdAEo59" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-ochre text-[10px] font-bold uppercase tracking-wider hover:underline"
                  >
                    Open in Map
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-cream p-2 rounded-xl border border-ochre/20 overflow-hidden h-[300px] shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.4847954930107!2d72.62886267597148!3d22.99676741753765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e8705e46bfb3f%3A0xe104cfbc17cbb8df!2sBrahmani%20Jewellers!5e0!3m2!1sen!2sin!4v1715800000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'sepia(20%) hue-rotate(340deg) saturate(120%)' }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-cream border border-ochre/20 p-10 rounded-2xl shadow-sm"
          >
            <h3 className="text-2xl font-serif text-coffee mb-6 transition-colors duration-300">Send A Message</h3>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status.text && (
                <div className={`p-3 rounded text-sm ${status.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                  {status.text}
                </div>
              )}
              <div>
                <label className="block text-sm text-coffee/70 mb-2 transition-colors duration-300">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ochre w-5 h-5 transition-colors duration-300" />
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-cream-alt border border-ochre/30 rounded-lg py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre transition-colors" placeholder="Your Full Name" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-coffee/70 mb-2 transition-colors duration-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ochre w-5 h-5 transition-colors duration-300" />
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-cream-alt border border-ochre/30 rounded-lg py-3 pl-12 pr-4 text-coffee focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre transition-colors" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-coffee/70 mb-2 transition-colors duration-300">Message</label>
                <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-cream-alt border border-ochre/30 rounded-lg py-3 px-4 text-coffee focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre transition-colors min-h-[120px]" placeholder="Tell us what you're looking for..."></textarea>
              </div>
              <button type="submit" className="w-full bg-ochre text-coffee font-bold uppercase tracking-widest py-4 rounded-lg flex justify-center items-center gap-2 hover:bg-ochre/90 transition-colors">
                Send Message <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero />
      <RatesSection />
      <Categories />
      <About />
      <GoogleReviews />
      <InstagramFeed />
      <Contact />
    </motion.div>
  );
};

export default Home;

