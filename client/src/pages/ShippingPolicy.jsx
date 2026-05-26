import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Clock, MapPin } from 'lucide-react';

const ShippingPolicy = () => {
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
            Shipping & <span className="text-ochre">Delivery</span>
          </h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-6"></div>
          <p className="text-coffee/60 italic text-sm">Last Updated: May 2026</p>
        </div>

        <div className="bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/20 shadow-sm space-y-8 text-coffee">
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <Truck className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">1. Delivery Timeline</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              We aim to ship all orders as quickly as possible. Once your order and payment are verified:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-coffee/80 leading-relaxed">
              <li>Orders are processed and dispatched within <strong>2 to 3 business days</strong>.</li>
              <li>Delivery takes approximately <strong>5 to 7 business days</strong> depending on your pincode.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">2. Insured Shipments</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Jewellery is highly valuable, and security is paramount. Every single package dispatched from Brahmani Jewellers is <strong>100% transit-insured</strong>. In the rare event of transit loss or package tampering before delivery, you are fully protected.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <Clock className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">3. Shipping Verification & Charges</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Any shipping charges, if applicable, are calculated and displayed during the checkout process based on delivery distance and order value. For security, delivery requires verification (an OTP or Signature at the time of delivery to the verified recipient).
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <MapPin className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">4. Tracking Your Order</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Once shipped, you will receive an SMS and email notification with your tracking details and tracking link (powered by our logistics partners like Delhivery) so you can track your package's movement in real-time.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-ochre/15">
            <h2 className="text-xl font-serif font-bold text-coffee">5. Support</h2>
            <p className="leading-relaxed text-coffee/80">
              For any queries regarding shipping status or delivery issues, please reach out:
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

export default ShippingPolicy;
