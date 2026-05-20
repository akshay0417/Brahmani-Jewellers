import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: "Rakesh Patel",
    date: "2 weeks ago",
    text: "Excellent collection of gold and antique jewellery. The staff is very polite and rates are genuine. Highly recommended!",
    rating: 5,
    initial: "R"
  },
  {
    name: "Meghna Shah",
    date: "1 month ago",
    text: "Bought my bridal jewellery from Brahmani Jewellers. The designs are unique and they explained the purity details very well. Very trustworthy.",
    rating: 5,
    initial: "M"
  },
  {
    name: "Dinesh Prajapati",
    date: "2 months ago",
    text: "Best jewellery showroom in Amraiwadi. We have been their customers for 15 years. They always provide the best service and 100% pure gold.",
    rating: 5,
    initial: "D"
  }
];

const GoogleReviews = () => {
  return (
    <section className="py-16 md:py-20 bg-cream-alt transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-6 border border-gray-100"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
            <span className="font-bold text-gray-700 text-sm tracking-wider uppercase">Google Reviews</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-serif font-bold text-coffee mb-4"
          >
            What Our <span className="text-ochre italic">Customers Say</span>
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-1 mb-2"
          >
            <span className="text-2xl font-bold text-coffee mr-2">4.9</span>
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-ochre text-ochre" />
            ))}
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-coffee/60"
          >
            Based on real customer feedback
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {REVIEWS.map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-lg shadow-lg border border-ochre/10 hover:border-ochre/30 transition-all duration-300 group hover:-translate-y-2"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ochre flex items-center justify-center text-white font-bold text-lg">
                    {review.initial}
                  </div>
                  <div>
                    <h4 className="font-bold text-coffee">{review.name}</h4>
                    <p className="text-xs text-coffee/50">{review.date}</p>
                  </div>
                </div>
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-4 h-4 opacity-50" />
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-ochre text-ochre" />
                ))}
              </div>
              <p className="text-coffee/80 text-sm leading-relaxed">
                "{review.text}"
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a 
            href="https://www.google.com/maps/search/Brahmani+Jewellers+Amraiwadi+Ahmedabad" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-coffee text-cream px-8 py-3 font-bold uppercase tracking-widest text-sm hover:bg-ochre hover:text-white transition-all duration-300 shadow-lg rounded-sm"
          >
            Write a Review on Google <Star className="w-4 h-4 fill-current" />
          </a>
        </motion.div>

      </div>
    </section>
  );
};

export default GoogleReviews;
