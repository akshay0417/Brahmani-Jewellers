import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Royal Gold Necklaces
    subtitle: 'The Art of Fine Jewellery',
    title: 'Elegance That\nDefines You',
    italicWord: 'Defines You',
    description: 'Discover a timeless collection of handcrafted masterpieces in pure gold and silver, designed to celebrate your life\'s special moments.',
    shopText: 'Shop Gold 🪙',
    viewText: 'View Designs'
  },
  {
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Stunning Gold & Diamond Rings
    subtitle: 'Tokens of Eternal Love',
    title: 'Pure Gold &\nDiamond Rings',
    italicWord: 'Diamond Rings',
    description: 'Timeless wedding bands and engagement rings crafted with brilliant stones and pure gold, celebrating absolute promise.',
    shopText: 'Explore Rings 💍',
    viewText: 'View Collections'
  },
  {
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Traditional Golden Heritage
    subtitle: 'Royal Heritage Masterpieces',
    title: 'Traditional Gold\nNecklaces',
    italicWord: 'Necklaces',
    description: 'Intricately designed traditional Indian heritage sets that carry our legacy of purity and trust since 1992.',
    shopText: 'Shop Heritage 🪔',
    viewText: 'Explore Catalog'
  },
  {
    image: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Luxury Diamond Ornaments
    subtitle: 'Modern Diamond Elegance',
    title: 'Modern Diamond\nMasterpieces',
    italicWord: 'Masterpieces',
    description: 'Indulge in modern luxury with sparkling diamond designs that bring absolute grace to your evening wear.',
    shopText: 'Shop Diamonds 💎',
    viewText: 'View Gallery'
  },
  {
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Exquisite Handcrafted Bangles
    subtitle: 'Exquisite Silver Ornaments',
    title: 'Purity In\nSilver Wear',
    italicWord: 'Silver Wear',
    description: 'Dazzling silver bangles, chains, and articles designed for daily elegance and auspicious celebrations.',
    shopText: 'Shop Silver 🪙',
    viewText: 'View Silver'
  },
  {
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80', // Elegant Bridal Collection
    subtitle: 'Timeless Bridal Elegance',
    title: 'The Complete\nBridal Suite',
    italicWord: 'Bridal Suite',
    description: 'Stunning royal wedding sets meticulously hand-carved to make your special day look absolutely unforgettable.',
    shopText: 'Shop Bridal 👑',
    viewText: 'View Catalogue'
  }
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
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
            
            {/* Transparent overlay covering 100% height and width to make text perfectly readable */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-coffee/90 via-coffee/65 to-transparent transition-colors duration-300"></div>
            <div className="absolute inset-0 w-full h-full bg-black/40"></div>

            {/* Slide Content positioned absolute inside the active slide */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full h-full flex flex-col justify-center">
              <div className="max-w-2xl text-left mt-16 md:mt-24">
                <motion.span 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="text-ochre tracking-[0.8em] uppercase text-xs md:text-sm font-bold mb-4 block drop-shadow-md"
                >
                  {HERO_SLIDES[currentIndex].subtitle}
                </motion.span>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                  className="text-4xl md:text-7xl font-serif font-bold text-cream leading-tight mb-6 drop-shadow-lg"
                >
                  {HERO_SLIDES[currentIndex].title.split('\n')[0]} <br />
                  <span className="text-ochre italic drop-shadow-md">
                    {HERO_SLIDES[currentIndex].italicWord}
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="text-cream/95 text-base md:text-xl font-light mb-10 max-w-lg leading-relaxed drop-shadow-sm"
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
                    className="px-10 py-4 bg-ochre text-coffee font-extrabold uppercase tracking-widest hover:bg-ochre/90 transition-all duration-300 rounded-sm text-center shadow-lg hover:shadow-ochre/30 hover:scale-[1.02] active:scale-95"
                  >
                    {HERO_SLIDES[currentIndex].shopText}
                  </Link>
                  <Link 
                    to="/gallery" 
                    className="px-10 py-4 border-2 border-cream text-cream font-extrabold uppercase tracking-widest hover:bg-cream hover:text-coffee transition-all duration-300 rounded-sm text-center shadow-lg hover:scale-[1.02] active:scale-95"
                  >
                    {HERO_SLIDES[currentIndex].viewText}
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

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
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hidden md:block">
        <div className="w-px h-16 bg-gradient-to-b from-ochre to-transparent"></div>
      </div>
    </section>
  );
};

export default Hero;
