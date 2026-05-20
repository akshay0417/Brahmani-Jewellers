import React, { useState } from 'react';
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
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a star rating first.");
      return;
    }
    setIsSubmitting(true);
    
    // Copy text to clipboard so user can easily paste it in Google
    if (feedback.trim() !== '') {
      navigator.clipboard.writeText(feedback).catch(err => console.log('Could not copy text: ', err));
    }

    // Redirect to Google Maps Search for the Jewellery shop where they can write the review
    window.open("https://www.google.com/maps/search/Brahmani+Jewellers+Amraiwadi+Ahmedabad", "_blank");
    
    setTimeout(() => {
      setIsSubmitting(false);
      setRating(0);
      setFeedback('');
      alert("You are being redirected to Google to post your review. If you wrote any text, it has been copied to your clipboard so you can paste it there!");
    }, 1000);
  };

  return (
    <section className="py-16 md:py-20 bg-cream-alt transition-colors duration-300 relative overflow-hidden" id="reviews">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header */}
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
            Customer <span className="text-ochre italic">Feedback</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Write a Review Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-5 bg-white p-8 rounded-lg shadow-xl border border-ochre/20 flex flex-col justify-center"
          >
            <h3 className="text-2xl font-serif font-bold text-coffee mb-2">Write a Review</h3>
            <p className="text-coffee/60 text-sm mb-6">Share your experience with Brahmani Jewellers on Google.</p>
            
            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Star Rating Input */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-coffee mb-3">Rate your experience</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating) 
                            ? "fill-ochre text-ochre" 
                            : "fill-gray-200 text-gray-200"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-coffee mb-3">Your Feedback</p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe your experience with our jewellery and service..."
                  className="w-full bg-cream/50 border border-ochre/20 rounded-sm py-3 px-4 text-coffee focus:outline-none focus:border-ochre transition-colors resize-none h-32"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-coffee text-cream font-bold py-4 uppercase tracking-[0.2em] hover:bg-ochre transition-all disabled:opacity-50 shadow-md hover:shadow-lg rounded-sm"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-4 h-4 bg-white rounded-full p-[2px]" />
                {isSubmitting ? 'Redirecting...' : 'Post to Google'}
              </button>
              <p className="text-xs text-center text-coffee/50 mt-2">
                You will be redirected to Google Maps to post this review securely.
              </p>
            </form>
          </motion.div>

          {/* Existing Reviews Display */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="lg:col-span-7 flex flex-col gap-6"
          >
            <div className="flex items-center gap-4 mb-2">
              <span className="text-4xl font-bold text-coffee">4.9</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-ochre text-ochre" />
                ))}
              </div>
              <span className="text-coffee/60 text-sm">(Based on 150+ reviews)</span>
            </div>

            {REVIEWS.map((review, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm border border-ochre/10 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-ochre/20 text-ochre flex items-center justify-center font-bold text-lg">
                      {review.initial}
                    </div>
                    <div>
                      <h4 className="font-bold text-coffee leading-tight">{review.name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-ochre text-ochre" />
                          ))}
                        </div>
                        <span className="text-xs text-coffee/50">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-coffee/80 text-sm">
                  "{review.text}"
                </p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
