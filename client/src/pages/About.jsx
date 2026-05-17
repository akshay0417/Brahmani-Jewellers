import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star, Users, Gem } from 'lucide-react';

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 bg-cream min-h-screen transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Intro Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-coffee">
            About <span className="text-ochre">Brahmani Jewellers</span>
          </h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
          <p className="text-coffee/70 max-w-3xl mx-auto text-xl font-medium italic mb-10">
            "Crafting timeless jewellery with trust, tradition, and elegance for generations."
          </p>
          <div className="text-coffee/80 leading-relaxed text-lg max-w-4xl mx-auto space-y-6 text-left bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/20 shadow-sm">
            <p>
              Welcome to Brahmani Jewellers — a name built on trust, quality, and beautiful craftsmanship.
            </p>
            <p>
              For more than 35 years, our family has been creating jewellery that carries emotions, traditions, and memories. From classic traditional designs to modern elegant collections, we believe every jewellery piece should feel special.
            </p>
            <p>
              Our journey started with dedication, honesty, and passion for fine jewellery, and today we proudly continue serving customers with the same values and commitment.
            </p>
          </div>
        </div>

        {/* Legacy Section */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-coffee">
              Our <span className="text-ochre">Legacy</span>
            </h2>
            <div className="w-16 h-1 bg-ochre mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-cream-alt p-8 rounded-xl border border-ochre/20 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-ochre/10 p-3 rounded-full">
                  <Star className="text-ochre w-6 h-6" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-coffee">Founder</h3>
              </div>
              <p className="text-coffee/80 leading-relaxed text-lg">
                With years of dedication and craftsmanship, our founder built Brahmani Jewellers with a vision of trust, purity, and customer satisfaction. His passion and hard work became the strong foundation of our journey.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-cream-alt p-8 rounded-xl border border-ochre/20 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-ochre/10 p-3 rounded-full">
                  <Users className="text-ochre w-6 h-6" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-coffee">Second Generation</h3>
              </div>
              <p className="text-coffee/80 leading-relaxed text-lg">
                Continuing the family legacy with modern creativity and customer-focused service, the next generation brings fresh designs while maintaining the traditional values that define Brahmani Jewellers.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Why Choose Us & Journey Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Why Choose Us */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-serif font-bold mb-8 text-coffee">
              Why <span className="text-ochre">Choose Us</span>
            </h2>
            <div className="space-y-4">
              {[
                "35+ Years of Trusted Service",
                "Premium Quality Jewellery",
                "Elegant Traditional & Modern Designs",
                "Custom Jewellery Available",
                "Trusted Customer Relationships",
                "Fine Craftsmanship"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-cream-alt p-4 rounded-lg border border-ochre/10">
                  <CheckCircle className="text-ochre w-6 h-6 flex-shrink-0" />
                  <span className="text-coffee font-medium text-lg">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Our Journey */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-serif font-bold mb-8 text-coffee">
              Our <span className="text-ochre">Journey</span>
            </h2>
            <div className="relative border-l-2 border-ochre/30 ml-4 space-y-8 pb-4">
              {[
                { year: "1990", desc: "Brahmani Jewellers Started" },
                { year: "2005", desc: "Expanded Jewellery Collection" },
                { year: "2015", desc: "Trusted by Thousands of Customers" },
                { year: "2020", desc: "Modern Design Collections Introduced" },
                { year: "2025", desc: "Growing with Tradition & Innovation" }
              ].map((item, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-ochre shadow-[0_0_0_4px_rgba(253,248,241,1)]"></div>
                  <h4 className="text-xl font-bold text-ochre mb-1">{item.year}</h4>
                  <p className="text-coffee/80 text-lg">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trusted By Generations & Visit Us */}
        <div className="bg-coffee text-cream rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Gem size={200} className="text-cream" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto space-y-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-cream">
                Trusted By <span className="text-ochre">Generations</span>
              </h2>
              <div className="text-cream/80 leading-relaxed text-lg space-y-4">
                <p>
                  At Brahmani Jewellers, every customer is part of our family. We are proud to be trusted by generations for quality, honesty, and timeless jewellery designs.
                </p>
                <p>
                  Every jewellery piece we create is designed with care, passion, and attention to detail — making every occasion more special and memorable.
                </p>
              </div>
            </div>
            
            <div className="w-24 h-px bg-ochre/30 mx-auto"></div>

            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-cream">
                Visit <span className="text-ochre">Us</span>
              </h2>
              <div className="text-cream/80 leading-relaxed text-lg space-y-4">
                <p>Discover jewellery that reflects tradition, beauty, and elegance.</p>
                <p className="font-semibold text-ochre text-xl mt-4">Experience craftsmanship, trust, and timeless designs only at Brahmani Jewellers.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default About;
