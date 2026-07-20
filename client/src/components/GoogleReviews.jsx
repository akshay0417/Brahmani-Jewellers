import React from 'react';
import { motion } from 'framer-motion';
import { Star, ExternalLink } from 'lucide-react';

const GOOGLE_REVIEWS = [
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
  },
  {
    name: "Sneha Parikh",
    date: "3 months ago",
    text: "100% genuine 916 BIS Hallmarked gold jewellery. Transparent pricing and polite owner.",
    rating: 5,
    initial: "S"
  }
];

const CustomerReviews = () => {
  const googleReviewUrl = "https://maps.app.goo.gl/ey6AtEEev3JdAEo59";

  return (
    <section className="py-12 md:py-16 bg-cream-alt transition-colors duration-300 relative overflow-hidden" id="reviews">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header Section with Google Branding & Rating Badge */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-ochre/20 mb-4"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" className="w-5 h-5" />
            <span className="font-bold text-coffee text-sm">Google Verified Reviews</span>
            <div className="flex gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-ochre text-ochre" />
              ))}
            </div>
            <span className="text-xs font-bold text-ochre ml-1">4.9 / 5.0</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-serif font-bold text-coffee mb-4"
          >
            Google <span className="text-ochre italic">Customer Reviews</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-coffee/70 text-sm md:text-base max-w-xl mx-auto mb-8"
          >
            Over 500+ happy families have rated us 4.9 stars on Google. Click below to read all reviews or share your feedback directly on Google Maps!
          </motion.p>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-ochre hover:bg-coffee text-cream font-bold px-8 py-4 rounded-full uppercase tracking-widest text-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-ochre"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
            Review Us on Google
            <ExternalLink size={16} />
          </motion.a>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GOOGLE_REVIEWS.map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-xl shadow-md border border-ochre/15 flex flex-col justify-between hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ochre/20 text-ochre flex items-center justify-center font-bold text-base border border-ochre/30">
                      {review.initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-coffee text-sm leading-tight">{review.name}</h4>
                      <span className="text-[10px] text-coffee/50 font-medium">{review.date}</span>
                    </div>
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Verified" className="w-4 h-4 opacity-80" />
                </div>

                <div className="flex gap-0.5 mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-ochre text-ochre" />
                  ))}
                </div>

                <p className="text-coffee/80 text-xs leading-relaxed italic">
                  "{review.text}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-ochre/10 text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-ochre flex items-center justify-end gap-1">
                  Verified Google Review ✓
                </span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default CustomerReviews;
