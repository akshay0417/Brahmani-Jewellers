import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Royal Gold Necklaces
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Stunning Gold & Diamond Rings
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Traditional Golden Heritage
  'https://images.unsplash.com/photo-1635767798638-3e25273a8236?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Luxury Diamond Ornaments
  'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Exquisite Handcrafted Bangles
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'  // Elegant Bridal Collection
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 5000); // Slide every 5 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-coffee">
      {/* Background Auto-Sliding Carousel with AnimatePresence Crossfade */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ backgroundImage: `url(${HERO_IMAGES[currentIndex]})` }}
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          />
        </AnimatePresence>

        {/* Transparent overlay covering 100% height and width to make text perfectly readable */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-coffee/85 via-coffee/60 to-transparent transition-colors duration-300"></div>
        <div className="absolute inset-0 w-full h-full bg-black/35"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="max-w-2xl mt-16 md:mt-24 text-left"
        >
          <span className="text-ochre tracking-[1em] uppercase text-xs md:text-sm font-bold mb-4 block drop-shadow-md">
            The Art of Fine Jewellery
          </span>
          <h1 className="text-4xl md:text-7xl font-serif font-bold text-cream leading-tight mb-6 drop-shadow-lg">
            Elegance <br />
            <span className="text-ochre italic drop-shadow-md">That Defines You</span>
          </h1>
          <p className="text-cream/90 text-lg md:text-xl font-light mb-10 max-w-lg leading-relaxed drop-shadow-sm">
            Discover a timeless collection of handcrafted masterpieces in pure gold and silver, designed to celebrate your life's special moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/shop" 
              className="px-10 py-4 bg-ochre text-coffee font-extrabold uppercase tracking-widest hover:bg-ochre/90 transition-all duration-300 rounded-sm text-center shadow-lg hover:shadow-ochre/30 hover:scale-[1.02]"
            >
              Shop Now
            </Link>
            <Link 
              to="/gallery" 
              className="px-10 py-4 border-2 border-cream text-cream font-extrabold uppercase tracking-widest hover:bg-cream hover:text-coffee transition-all duration-300 rounded-sm text-center shadow-lg hover:scale-[1.02]"
            >
              View Collection
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Slide Indicators (Dots) */}
      <div className="absolute bottom-10 right-10 z-20 flex gap-2">
        {HERO_IMAGES.map((_, index) => (
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
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hidden md:block">
        <div className="w-px h-16 bg-gradient-to-b from-ochre to-transparent"></div>
      </div>
    </section>
  );
};

export default Hero;
