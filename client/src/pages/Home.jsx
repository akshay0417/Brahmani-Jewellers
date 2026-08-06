import React, { useState, useEffect } from 'react';
import api from '../api';
import Hero from '../components/Hero';
import RatesSection from '../components/RatesSection';
import GoogleReviews from '../components/GoogleReviews';
import InstagramFeed from '../components/InstagramFeed';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, CheckCircle, Map, Star, Send, User, Mail, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [selectedItem, setSelectedItem] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  useEffect(() => {
    api.get('/gallery').then(res => {
      // Filter for items that are marked to show on the homepage by the admin
      let showcased = res.data.filter(item => item.showOnHomepage === true);
      // Fallback to top 8 items if no items are marked yet
      if (showcased.length === 0) {
        showcased = res.data.slice(0, 8);
      }
      setItems(showcased);
    }).catch(err => console.log("Error fetching gallery", err));
  }, []);

  const closeLightbox = () => {
    setSelectedItem(null);
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setCurrentImageIndex(0);
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin({ x, y });
  };

  const handleTouchMove = (e) => {
    if (!isZoomed) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
      setZoomOrigin({ x, y });
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (isZoomed) {
      setIsZoomed(false);
    } else {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
      if (clientX && clientY) {
        const x = ((clientX - left) / width) * 100;
        const y = ((clientY - top) / height) * 100;
        setZoomOrigin({ x, y });
      } else {
        setZoomOrigin({ x: 50, y: 50 });
      }
      setIsZoomed(true);
    }
  };

  return (
    <>
      <section className="py-10 md:py-12 bg-cream-alt transition-colors duration-300" id="categories">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12">
            <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="text-ochre tracking-[0.5em] uppercase text-xs font-bold mb-4 block">Royal Showcase</motion.span>
            <h2 className="text-4xl font-serif font-bold mb-4 text-coffee transition-colors duration-300">Featured <span className="text-ochre">Masterpieces</span></h2>
            <p className="text-coffee/70 transition-colors duration-300">Discover the latest arrivals and exquisite designs from our gallery</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:auto-rows-[280px]">
            {items.map((item, idx) => (
              <div
                key={item._id || idx}
                onClick={() => { setSelectedItem(item); setCurrentImageIndex(0); }}
                className={`block group cursor-pointer ${item.isFeatured ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 4) * 0.15 }}
                  className="relative h-full min-h-[280px] rounded-xl overflow-hidden shadow-xl shadow-coffee/5 border border-ochre/15 hover:border-ochre/60 transition-colors duration-300"
                >
                  <img src={item.imageUrl} alt={item.name || item.category} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-coffee/90 via-coffee/40 to-transparent flex flex-col justify-end p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className={`${item.isFeatured ? 'text-base md:text-lg' : 'text-xs md:text-sm'} font-serif text-cream mb-1`}>{item.name || `${item.category} Design`}</h3>
                    <p className="text-cream/80 text-[10px] line-clamp-2">{item.description || item.subCategory || "Exquisite craftsmanship"}</p>
                    <span className="text-[9px] tracking-[0.2em] text-ochre uppercase font-bold mt-1">View Details →</span>
                  </div>
                </motion.div>
              </div>
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

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-coffee/95 flex flex-col items-center justify-center p-4 md:p-10 backdrop-blur-md"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-10 right-10 text-cream/50 hover:text-ochre transition-colors z-50 p-4"
              onClick={closeLightbox}
            >
              <X size={40} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative flex flex-col md:flex-row items-center justify-center max-w-5xl w-full bg-coffee border border-ochre/20 rounded-lg p-6 md:p-10 gap-8 overflow-y-auto max-h-[90vh]" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: Image container */}
              {(() => {
                const allImages = [selectedItem.imageUrl, ...(selectedItem.additionalImages || [])];
                return (
                  <div className="flex-1 flex flex-col items-center justify-center w-full max-h-[55vh] md:max-h-[75vh]">
                    <div 
                      className="overflow-hidden rounded-md ring-1 ring-cream/10 bg-cream-alt relative w-full flex items-center justify-center min-h-[40vh]"
                      onMouseMove={handleMouseMove}
                      onTouchMove={handleTouchMove}
                      onClick={handleImageClick}
                    >
                      <img
                        src={allImages[currentImageIndex]}
                        alt="Preview"
                        className={`max-w-full max-h-[50vh] md:max-h-[65vh] object-contain shadow-2xl transition-transform duration-200 ease-out ${isZoomed ? 'cursor-zoom-out font-bold' : 'cursor-zoom-in'}`}
                        style={{
                          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                          transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                        }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
                      />

                      {/* Carousel Left/Right arrows */}
                      {allImages.length > 1 && !isZoomed && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/25 hover:bg-ochre hover:text-coffee transition-all"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/25 hover:bg-ochre hover:text-coffee transition-all"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dots / Thumbnails */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-4 select-none">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-12 h-12 rounded border overflow-hidden transition-all ${currentImageIndex === idx ? 'border-ochre ring-1 ring-ochre font-bold' : 'border-cream/20 opacity-60 hover:opacity-100'}`}
                          >
                            <img src={img} alt="thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-cream/50 text-xs mt-3 select-none">
                      {isZoomed ? "Move mouse or drag touch to pan. Click to zoom out." : "Click or tap image to zoom."}
                    </p>
                  </div>
                );
              })()}

              {/* Right Side: Details container */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 w-full flex flex-col justify-center text-center md:text-left animate-fade-in"
              >
                <h3 className="text-3xl font-serif text-ochre mb-4 tracking-widest uppercase">{selectedItem.name || `${selectedItem.category} Design`}</h3>
                {selectedItem.description && <p className="text-cream/80 text-base italic mb-4 max-w-lg leading-relaxed">{selectedItem.description}</p>}
                
                <div className="border-t border-b border-cream/10 py-4 my-4">
                  {(selectedItem.weight || selectedItem.purity || selectedItem.subCategory) && (
                    <div className="space-y-2">
                      {selectedItem.subCategory && (
                        <p className="text-cream/70 text-sm"><strong className="text-ochre uppercase tracking-wider text-xs">Category:</strong> {selectedItem.subCategory}</p>
                      )}
                      {selectedItem.weight && (
                        <p className="text-cream/70 text-sm"><strong className="text-ochre uppercase tracking-wider text-xs">Weight:</strong> {selectedItem.weight} grams</p>
                      )}
                      {selectedItem.purity && (
                        <p className="text-cream/70 text-sm"><strong className="text-ochre uppercase tracking-wider text-xs">Purity:</strong> {selectedItem.purity}</p>
                      )}
                    </div>
                  )}
                </div>

                {(() => {
                  let text = `Hello Brahmani Jewellers, I am interested in this design from your collection:\n\n`;
                  text += `*Name:* ${selectedItem.name || 'Heritage Design'}\n`;
                  text += `*Category:* ${selectedItem.category}\n`;
                  if (selectedItem.subCategory) text += `*Item Type:* ${selectedItem.subCategory}\n`;
                  if (selectedItem.weight) text += `*Weight:* ${selectedItem.weight} Grams\n`;
                  if (selectedItem.purity) text += `*Purity:* ${selectedItem.purity}\n\n`;
                  text += `Image Link: ${selectedItem.imageUrl}`;

                  const whatsappUrl = `https://wa.me/917621967577?text=${encodeURIComponent(text)}`;
                  return (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 border border-ochre text-cream px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-ochre hover:text-coffee transition-colors text-center w-full md:w-fit"
                    >
                      Inquire Design
                    </a>
                  );
                })()}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3672.1931558231575!2d72.6237243!3d23.0044041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e86720e480ae5%3A0x3f1a429425213530!2sBrahmani%20Jewellers!5e0!3m2!1sen!2sin!4v1717000000000!5m2!1sen!2sin" 
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

const MobileAppShowcase = () => {
  const [apkUrl, setApkUrl] = useState('https://brahmani-jewellers.vercel.app/download');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/rates');
        if (res.data && res.data.apkDownloadUrl) {
          setApkUrl(res.data.apkDownloadUrl);
        }
      } catch (err) {
        console.error("Error fetching settings for mobile app banner", err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-cream transition-colors duration-300 relative overflow-hidden" id="download-app">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-ochre/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ochre/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
        
        {/* Left Side: Mockup of Phone using CSS */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="md:col-span-5 flex justify-center order-2 md:order-1"
        >
          {/* Elegant CSS Phone Frame */}
          <div className="relative w-[280px] h-[540px] bg-[#0A0A0A] rounded-[40px] p-3 shadow-2xl border-4 border-ochre/25 ring-1 ring-ochre/40 overflow-hidden flex flex-col justify-between">
            {/* Speaker & Camera notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0A0A0A] rounded-b-2xl z-20 flex justify-center items-center gap-1.5 border-b border-ochre/15">
              <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></div>
              <div className="w-8 h-1 bg-zinc-800 rounded-full"></div>
            </div>

            {/* Screen Content */}
            <div className="relative flex-1 w-full bg-[#0F0F0F] rounded-[30px] p-4 flex flex-col justify-between border border-ochre/10 overflow-hidden pt-8 select-none">
              {/* App Header */}
              <div className="text-center border-b border-ochre/10 pb-3">
                <h4 className="text-[14px] font-serif font-bold text-cream tracking-widest uppercase">Brahmani</h4>
                <p className="text-[7px] text-ochre tracking-[0.3em] uppercase -mt-0.5 font-bold">Jewellers</p>
              </div>

              {/* Live Rate Screen Card */}
              <div className="my-auto space-y-4">
                <div className="bg-cream-alt/5 border border-ochre/15 p-3 rounded-xl text-center shadow-inner backdrop-blur-md">
                  <p className="text-[8px] text-ochre/80 uppercase tracking-widest mb-1 font-bold">Live Market Rate</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-lg font-serif font-bold text-cream">₹76,450</span>
                    <span className="text-[8px] text-cream/60">/10g</span>
                  </div>
                  <p className="text-[6px] text-green-500 font-bold uppercase tracking-wider mt-0.5">▲ Live Gold 24K</p>
                </div>

                <div className="bg-cream-alt/5 border border-ochre/15 p-3 rounded-xl text-center shadow-inner backdrop-blur-md">
                  <p className="text-[8px] text-ochre/80 uppercase tracking-widest mb-1 font-bold">Digital Gold Vault</p>
                  <p className="text-[7px] text-cream/70">Invest in Gold starting from ₹100</p>
                  <div className="mt-2 py-1 px-3 bg-ochre/90 hover:bg-ochre text-coffee text-[8px] font-bold rounded-full uppercase tracking-wider inline-block">
                    Buy Gold
                  </div>
                </div>
              </div>

              {/* App Nav Bar Simulation */}
              <div className="border-t border-ochre/10 pt-2 flex justify-around items-center text-[7px] text-cream/50">
                <span className="text-ochre font-bold flex flex-col items-center">⭐ <span>Home</span></span>
                <span className="flex flex-col items-center">💎 <span>Gallery</span></span>
                <span className="flex flex-col items-center">💼 <span>Vault</span></span>
                <span className="flex flex-col items-center">👤 <span>Profile</span></span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="md:col-span-7 order-1 md:order-2 space-y-6"
        >
          <span className="text-ochre tracking-[0.4em] uppercase text-xs font-bold block">Exclusive Mobile App</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-coffee leading-tight transition-colors duration-300">
            Timeless Luxury, <br/>Now <span className="text-ochre">In Your Pocket</span>
          </h2>
          <div className="w-20 h-1 bg-ochre"></div>
          
          <p className="text-coffee/80 text-base leading-relaxed transition-colors duration-300">
            Get the full Brahmani Jewellers experience right on your Android phone. Track live daily gold and silver rates with instant push alerts, purchase digital gold, manage your virtual jewellery vault, and browse our entire luxury catalogue anywhere.
          </p>

          <div className="grid grid-cols-2 gap-4 pb-2">
            <div>
              <h4 className="text-ochre font-serif font-bold text-sm mb-1">🔔 Live Price Alerts</h4>
              <p className="text-coffee/70 text-xs">Receive instant notifications for sudden drops or changes in live rates.</p>
            </div>
            <div>
              <h4 className="text-ochre font-serif font-bold text-sm mb-1">🔒 Digital Gold Vault</h4>
              <p className="text-coffee/70 text-xs">Invest, resell, or redeem 24K pure digital gold securely from your device.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-coffee hover:bg-ochre text-cream hover:text-coffee border border-ochre/25 rounded transition-all duration-300 font-bold uppercase tracking-widest text-xs shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              <Smartphone size={16} />
              Download Android APK
            </a>
            <span className="text-coffee/50 text-[10px] uppercase tracking-wider text-center sm:text-left">
              * Direct download. Secure installation link.
            </span>
          </div>
        </motion.div>

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
      <MobileAppShowcase />
      <GoogleReviews />
      <InstagramFeed />
      <Contact />
    </motion.div>
  );
};

export default Home;

