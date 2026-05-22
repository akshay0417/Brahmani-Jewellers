import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import api from '../api';

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

const CustomerReviews = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 5.0, totalCount: 3 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data.reviews);
      setStats({
        averageRating: res.data.averageRating,
        totalCount: res.data.totalCount
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reviews", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setName(parsedUser.name || '');
        
        // Fetch existing review
        api.get('/reviews/my')
          .then(res => {
            if (res.data && res.data.review) {
              setRating(res.data.review.rating);
              setFeedback(res.data.review.text);
              setHasExistingReview(true);
            }
          })
          .catch(err => console.error("Error fetching my review:", err));
      } catch (err) {
        console.error("Error parsing user from sessionStorage", err);
      }
    }
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to submit a review.");
      return;
    }
    if (rating === 0) {
      alert("Please select a star rating first.");
      return;
    }
    if (!feedback.trim()) {
      alert("Please enter your feedback.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const res = await api.post('/reviews', {
        rating,
        text: feedback.trim()
      });
      
      alert(res.data?.message || "Thank you for your feedback! Your review has been submitted successfully.");
      setHasExistingReview(true);
      fetchReviews();
    } catch (err) {
      console.error("Error submitting review", err);
      alert(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-10 md:py-12 bg-cream-alt transition-colors duration-300 relative overflow-hidden" id="reviews">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-serif font-bold text-coffee mb-4 mt-8"
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
            className="lg:col-span-5 bg-white p-8 rounded-lg shadow-xl border border-ochre/20 flex flex-col justify-center min-h-[400px]"
          >
            {!isLoggedIn ? (
              <div className="text-center py-6 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-ochre/10 rounded-full flex items-center justify-center mb-6">
                  <Star className="w-8 h-8 text-ochre fill-ochre" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-coffee mb-4">Write a Review</h3>
                <p className="text-coffee/70 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  Please log in to share your experience and write a review. Only verified customer accounts can leave reviews to ensure authenticity.
                </p>
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 bg-coffee text-cream font-bold py-4 uppercase tracking-[0.2em] hover:bg-ochre transition-all shadow-md hover:shadow-lg rounded-sm"
                >
                  Login to Write Review
                </Link>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-serif font-bold text-coffee mb-2">Write a Review</h3>
                <p className="text-coffee/60 text-sm mb-6">
                  {hasExistingReview 
                    ? "You have already submitted a review. Submitting this form will update your existing review." 
                    : "Share your experience with Brahmani Jewellers."}
                </p>
                
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {/* Name Input */}
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-coffee mb-3">Your Name</p>
                    <input
                      type="text"
                      value={name}
                      disabled
                      className="w-full bg-gray-100 border border-ochre/20 rounded-sm py-3 px-4 text-coffee/60 font-medium transition-colors text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-ochre/80 mt-1.5 italic font-medium">
                      Reviewing as verified customer
                    </p>
                  </div>

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
                      className="w-full bg-cream/50 border border-ochre/20 rounded-sm py-3 px-4 text-coffee focus:outline-none focus:border-ochre transition-colors resize-none h-32 text-sm"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-coffee text-cream font-bold py-4 uppercase tracking-[0.2em] hover:bg-ochre transition-all disabled:opacity-50 shadow-md hover:shadow-lg rounded-sm"
                  >
                    {isSubmitting ? 'Posting...' : hasExistingReview ? 'Update Review' : 'Post'}
                  </button>
                </form>
              </>
            )}
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
              <span className="text-4xl font-bold text-coffee">{stats.averageRating}</span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => {
                  const ratingVal = stats.averageRating || 5.0;
                  const isFilled = i < Math.round(ratingVal);
                  return (
                    <Star key={i} className={`w-5 h-5 ${isFilled ? "fill-ochre text-ochre" : "fill-gray-200 text-gray-200"}`} />
                  );
                })}
              </div>
              <span className="text-coffee/60 text-sm">(Based on {stats.totalCount} reviews)</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-coffee/60">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-coffee/60">No reviews yet. Be the first to review!</div>
            ) : (
              reviews.map((review, idx) => {
                const initial = review.name ? review.name.charAt(0).toUpperCase() : 'U';
                const dateText = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }) : 'Recently';

                return (
                  <motion.div 
                    key={review._id || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white p-6 rounded-lg shadow-sm border border-ochre/10 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-ochre/20 text-ochre flex items-center justify-center font-bold text-lg">
                          {initial}
                        </div>
                        <div>
                          <h4 className="font-bold text-coffee leading-tight">{review.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-ochre text-ochre" />
                              ))}
                              {[...Array(5 - review.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-gray-200 text-gray-200" />
                              ))}
                            </div>
                            <span className="text-xs text-coffee/50">{dateText}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-coffee/80 text-sm">
                      "{review.text}"
                    </p>
                  </motion.div>
                );
              })
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
