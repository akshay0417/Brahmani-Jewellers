import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    image: '/hero_rings.png',
    subtitle: 'LUXURY SHOWROOM',
    title: 'Timeless Elegance,\nCrafted for You',
    italicWord: 'Crafted for You',
    description: 'Discover elegance that reflects your perfect style. Handcrafted rings with certified purity and lifetime trust.',
    shopText: 'Explore Rings 💍',
    viewText: 'Explore Collection'
  },
  {
    image: '/hero_necklace.png',
    subtitle: 'ROYAL HERITAGE',
    title: 'Exquisite Artistry,\nDesigned to Inspire',
    italicWord: 'Designed to Inspire',
    description: 'Experience the majesty of pure gold and fine diamonds with our classic and traditional necklace collections.',
    shopText: 'Explore Necklaces ✨',
    viewText: 'Explore Collection'
  },
  {
    image: '/hero_bracelet.png',
    subtitle: 'FINE CRAFTSMANSHIP',
    title: 'Modern Aesthetics,\nShaped with Passion',
    italicWord: 'Shaped with Passion',
    description: 'Adorn your wrist with our premium diamond-studded gold bracelets, handcrafted to perfection.',
    shopText: 'Explore Bracelets 💎',
    viewText: 'Explore Collection'
  },
  {
    image: '/hero_earrings.png',
    subtitle: 'TIMELESS BEAUTY',
    title: 'Elegance in Detail,\nMade for Royalty',
    italicWord: 'Made for Royalty',
    description: 'Breathtaking gold and diamond drop earrings designed to make every occasion memorable.',
    shopText: 'Explore Earrings 🌟',
    viewText: 'Explore Collection'
  }
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [currentIndex]); 

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-cream pt-24 md:pt-16 group transition-colors duration-300">
      {/* Background Decorative Subtle Texture Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.04]"></div>

      {/* Main Grid Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 md:grid-cols-2 items-center gap-12">
        
        {/* Left Side: Animated Text Content */}
        <div className="text-left flex flex-col justify-center h-full order-2 md:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-xl space-y-4 md:space-y-6"
            >
              <span className="text-ochre tracking-[0.5em] uppercase text-[10px] md:text-xs font-bold block font-sans">
                {HERO_SLIDES[currentIndex].subtitle}
              </span>
              
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-coffee leading-tight">
                {HERO_SLIDES[currentIndex].title.split('\n')[0]} <br />
                <span className="text-ochre italic font-normal">
                  {HERO_SLIDES[currentIndex].italicWord}
                </span>
              </h1>
              
              <p className="text-coffee/70 text-sm md:text-base font-sans font-medium max-w-lg leading-relaxed">
                {HERO_SLIDES[currentIndex].description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  to="/shop" 
                  className="px-8 py-3.5 bg-ochre hover:bg-coffee hover:text-cream text-coffee text-xs font-sans font-extrabold uppercase tracking-widest transition-all duration-300 rounded-sm text-center shadow-lg shadow-ochre/15 hover:scale-[1.02] active:scale-95"
                >
                  {HERO_SLIDES[currentIndex].shopText}
                </Link>
                <Link 
                  to="/gallery" 
                  className="px-8 py-3.5 border-2 border-coffee hover:bg-coffee hover:text-cream text-coffee text-xs font-sans font-extrabold uppercase tracking-widest transition-all duration-300 rounded-sm text-center hover:scale-[1.02] active:scale-95"
                >
                  {HERO_SLIDES[currentIndex].viewText}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Showcase Image with Zoom & Slide Transition */}
        <div className="relative w-full h-[40vh] md:h-[65vh] flex items-center justify-center order-1 md:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotate: -1 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
              className="w-full h-full overflow-hidden rounded-2xl border border-ochre/15 shadow-2xl bg-cream-alt flex items-center justify-center"
            >
              <motion.img 
                src={HERO_SLIDES[currentIndex].image}
                alt="Brahmani Jewellers Premium Showcase"
                className="w-full h-full object-cover"
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ duration: 5, ease: "easeOut" }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Manual Scroll Navigation Arrows (visible on hover) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-coffee/20 text-coffee opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-ochre hover:text-coffee backdrop-blur-sm shadow-md"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} className="md:w-8 md:h-8" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-coffee/20 text-coffee opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-ochre hover:text-coffee backdrop-blur-sm shadow-md"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} className="md:w-8 md:h-8" />
      </button>

      {/* Slide Indicators (Dots) */}
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-20 flex gap-2">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index ? 'bg-ochre w-6' : 'bg-coffee/30 hover:bg-coffee/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
