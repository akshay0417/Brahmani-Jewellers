import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Light Gold Necklace
    subtitle: 'Timeless Traditional Elegance',
    title: 'The Divine\nBridal Heritage',
    italicWord: 'Bridal Heritage',
    description: 'Adorn yourself with our majestic bridal collections. Handcrafted in pure gold to make your special day absolutely divine.',
    shopText: 'Shop Bridal 👑',
    viewText: 'View Collection'
  },
  {
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Model with light jewelry
    subtitle: 'The Art of Fine Jewellery',
    title: 'Exquisite Pure\nGold Designs',
    italicWord: 'Gold Designs',
    description: 'Discover our premium range of hallmarked gold necklaces, designed for the modern woman who cherishes her roots.',
    shopText: 'Shop Gold 🪙',
    viewText: 'Explore Catalog'
  },
  {
    image: 'https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Diamond ring on light background
    subtitle: 'Tokens of Eternal Love',
    title: 'Brilliant Diamond\nMasterpieces',
    italicWord: 'Masterpieces',
    description: 'Celebrate your absolute promise with our premium diamond rings and ornaments, crafted with brilliant stones.',
    shopText: 'Explore Diamonds 💎',
    viewText: 'View Gallery'
  },
  {
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Model with heavy jewelry
    subtitle: 'Exquisite Silver Ornaments',
    title: 'Purity In\nSilver Wear',
    italicWord: 'Silver Wear',
    description: 'Dazzling silver bangles, chains, and articles designed for daily elegance and auspicious celebrations.',
    shopText: 'Shop Silver 🪙',
    viewText: 'View Silver'
  }
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
    }, 3000); // Changed to 3 seconds as requested
    return () => clearInterval(timer);
  }, [currentIndex]); // Added dependency to reset timer on manual scroll

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-cream group">
      {/* Background Auto-Sliding Carousel with AnimatePresence Crossfade */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Ken Burns Zoom Effect */}
            <motion.div 
              initial={{ scale: 1.06 }}
              animate={{ scale: 1.01 }}
              transition={{ duration: 5, ease: "easeOut" }}
              style={{ backgroundImage: `url(${HERO_SLIDES[currentIndex].image})` }}
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            />
            
            {/* Lighter Transparent overlay for 'light color' theme */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cream/95 via-cream/60 to-transparent transition-colors duration-300"></div>

            {/* Slide Content positioned absolute inside the active slide */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-24 w-full h-full flex flex-col justify-center">
              <div className="max-w-2xl text-left mt-16 md:mt-24">
                <motion.span 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="text-ochre tracking-[0.6em] uppercase text-[10px] md:text-xs font-bold mb-3 block drop-shadow-sm font-sans"
                >
                  {HERO_SLIDES[currentIndex].subtitle}
                </motion.span>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                  className="text-3xl md:text-5xl font-serif font-bold text-coffee leading-tight mb-4"
                >
                  {HERO_SLIDES[currentIndex].title.split('\n')[0]} <br />
                  <span className="text-ochre italic drop-shadow-sm">
                    {HERO_SLIDES[currentIndex].italicWord}
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="text-coffee/80 text-sm md:text-base font-sans font-medium mb-8 max-w-lg leading-relaxed"
                >
                  {HERO_SLIDES[currentIndex].description}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link 
                    to="/shop" 
                    className="px-10 py-4 bg-ochre text-cream font-sans font-extrabold uppercase tracking-widest hover:bg-coffee transition-all duration-300 rounded-sm text-center shadow-lg hover:shadow-ochre/30 hover:scale-[1.02] active:scale-95"
                  >
                    {HERO_SLIDES[currentIndex].shopText}
                  </Link>
                  <Link 
                    to="/gallery" 
                    className="px-10 py-4 border-2 border-coffee text-coffee font-sans font-extrabold uppercase tracking-widest hover:bg-coffee hover:text-cream transition-all duration-300 rounded-sm text-center shadow-lg hover:scale-[1.02] active:scale-95"
                  >
                    {HERO_SLIDES[currentIndex].viewText}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Scroll Navigation Arrows (visible on hover) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-coffee/40 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-ochre hover:text-coffee backdrop-blur-sm shadow-lg"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={32} />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-coffee/40 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-ochre hover:text-coffee backdrop-blur-sm shadow-lg"
        aria-label="Next Slide"
      >
        <ChevronRight size={32} />
      </button>

      {/* Slide Indicators (Dots) */}
      <div className="absolute bottom-10 right-10 z-20 flex gap-2">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              currentIndex === index ? 'bg-ochre w-8' : 'bg-cream/40 hover:bg-cream/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative Bounce Line */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hidden md:block z-20">
        <div className="w-px h-16 bg-gradient-to-b from-ochre to-transparent"></div>
      </div>
    </section>
  );
};

export default Hero;
