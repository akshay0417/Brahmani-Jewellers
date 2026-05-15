import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-cream">
      {/* Background Image/Overlay */}
      <div className="absolute inset-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat">
        {/* Full cream transparent overlay covering 100% height and width */}
        <div className="absolute inset-0 w-full h-full bg-cream/70 transition-colors duration-300"></div>
        
        {/* Optional decorative gradient overlay for a premium UI effect */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cream-alt/90 via-cream-alt/60 to-transparent transition-colors duration-300"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-2xl mt-16 md:mt-24"
        >
          <span className="text-ochre tracking-[1em] uppercase text-xs md:text-sm font-medium mb-4 block">
            The Art of Fine Jewellery
          </span>
          <h1 className="text-4xl md:text-7xl font-serif font-bold text-coffee leading-tight mb-6 transition-colors duration-300">
            Elegance <br />
            <span className="text-ochre italic">That Defines You</span>
          </h1>
          <p className="text-coffee/80 text-lg md:text-xl font-light mb-10 max-w-lg leading-relaxed transition-colors duration-300">
            Discover a timeless collection of handcrafted masterpieces in gold and silver, designed to celebrate your unique story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/shop" className="px-10 py-4 bg-ochre text-coffee font-bold uppercase tracking-widest hover:bg-ochre/90 transition-all duration-300 rounded-sm text-center">
              Shop Now
            </Link>
            <Link to="/gallery" className="px-10 py-4 border border-ochre text-ochre font-bold uppercase tracking-widest hover:bg-ochre/10 transition-all duration-300 rounded-sm text-center">
              View Collection
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer">
        <div className="w-px h-16 bg-gradient-to-b from-ochre to-transparent"></div>
      </div>
    </section>
  );
};

export default Hero;
