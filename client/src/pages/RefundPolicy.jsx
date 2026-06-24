import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Ban, HelpCircle, XOctagon } from 'lucide-react';

const RefundPolicy = () => {
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
            Refund & <span className="text-ochre">Cancellation</span>
          </h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-6"></div>
          <p className="text-coffee/60 italic text-sm">Last Updated: May 2026</p>
        </div>

        <div className="bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/20 shadow-sm space-y-8 text-coffee">
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <Ban className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">1. Order Cancellation</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Customers can request to cancel their order within <strong>24 hours</strong> of placement or before the product has been shipped (whichever is earlier). Once the package has been dispatched from our facility, the order cannot be cancelled.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <RefreshCw className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">2. Returns & Exchange Policy</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              We offer a <strong>7-day return and exchange policy</strong> for our products. To request a return or replacement, you must contact us within 7 days of delivery. The item must be unused, unworn, and have all original tags and packaging intact along with the original invoice.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-red-600">
              <XOctagon className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">3. Exclusion: Damaged or Altered Pieces</h2>
            </div>
            <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-coffee/95 space-y-2">
              <p className="font-semibold text-red-700">Strict Policy on Damaged Returns:</p>
              <p className="leading-relaxed text-sm">
                If the jewellery piece is returned to us in a damaged condition, altered in any way, showing signs of wear, or missing its original security tags, it will <strong>NOT</strong> be accepted for return, exchange, or refund. 
              </p>
              <p className="leading-relaxed text-sm">
                We perform detailed quality checks on every shipment before dispatch, and returned items are thoroughly inspected upon receipt.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <HelpCircle className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">4. Refund Processing</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Once your returned item is received, inspected, and approved for refund:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-coffee/80 leading-relaxed">
              <li>The refund amount will be credited back to your original source of payment (Credit/Debit Card, Net Banking, UPI, or Wallet).</li>
              <li>Refund processing through our payment partner (Razorpay) typically takes <strong>5 to 7 working days</strong> to reflect in your account.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-6 border-t border-ochre/15">
            <h2 className="text-xl font-serif font-bold text-coffee">5. Support</h2>
            <p className="leading-relaxed text-coffee/80">
              To initiate a cancellation, return, or replacement request, please reach out to our team:
            </p>
            <div className="mt-4 p-4 bg-cream/50 rounded-lg border border-ochre/10 text-sm space-y-1">
              <p><strong>Email:</strong> info.brahmanijewellers@gmail.com</p>
              <p><strong>Phone:</strong> +91 7621967577</p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default RefundPolicy;
