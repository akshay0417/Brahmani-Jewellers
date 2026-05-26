import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, AlertCircle, ShoppingBag, Scale } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 bg-cream min-h-screen transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-coffee">
            Terms & <span className="text-ochre">Conditions</span>
          </h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-6"></div>
          <p className="text-coffee/60 italic text-sm">Last Updated: May 2026</p>
        </div>

        <div className="bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/20 shadow-sm space-y-8 text-coffee">
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <BookOpen className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">1. Acceptance of Terms</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              By accessing and using this website, you agree to be bound by these Terms & Conditions. Please read them carefully before making any purchases or using our services.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">2. Pricing & Live Gold/Silver Rates</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Gold and silver rates fluctuate daily according to the bullion market. The pricing for products on our site is dynamically calculated based on current live rates.
            </p>
            <div className="p-4 bg-ochre/5 border-l-4 border-ochre rounded-r-lg text-sm text-coffee/95">
              <strong>Important Rate Lock Agreement:</strong> The price presented at checkout when you place your order is final and binding. Even if gold/silver market rates increase or decrease after your order, the price of your placed order will remain unchanged.
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <ShoppingBag className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">3. Product Details & Weight Variance</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              All our jewellery pieces are handcrafted with maximum precision. Because they are handmade, the final weight of the delivered jewellery may vary by approximately <strong>+/- 5%</strong> compared to the estimated weight listed online. The final bill will be adjusted and calculated according to the actual weight of the shipped product.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <Scale className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">4. Order Validation & Cancellation</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Brahmani Jewellers reserves the right to cancel any orders under exceptional circumstances (e.g. unexpected technical errors causing wrong price displays, lack of raw materials, or verification issues). If we cancel an order, we will issue a full refund to the customer.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-ochre/15">
            <h2 className="text-xl font-serif font-bold text-coffee">5. Contact Information</h2>
            <p className="leading-relaxed text-coffee/80">
              If you have any questions regarding these terms, please contact our support team at:
            </p>
            <div className="mt-4 p-4 bg-cream/50 rounded-lg border border-ochre/10 text-sm space-y-1">
              <p><strong>Email:</strong> info.brahmanijewellers@gmail.com</p>
              <p><strong>Phone:</strong> +91 9925811771</p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default TermsAndConditions;
