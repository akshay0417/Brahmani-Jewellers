import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Lock, FileText } from 'lucide-react';

const PrivacyPolicy = () => {
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
            Privacy <span className="text-ochre">Policy</span>
          </h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-6"></div>
          <p className="text-coffee/60 italic text-sm">Last Updated: May 2026</p>
        </div>

        <div className="bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/20 shadow-sm space-y-8 text-coffee">
          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">1. Introduction</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              Welcome to <strong>Brahmani Jewellers</strong>. We value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website or make a purchase from us.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <Eye className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">2. Information We Collect</h2>
            </div>
            <p className="leading-relaxed text-coffee/80 font-semibold text-sm uppercase tracking-wider">A. Personal Information</p>
            <p className="leading-relaxed text-coffee/80">
              We collect information that you share directly with us, including your name, shipping address, billing address, email address, and phone number when you create an account, place an order, or subscribe to our newsletter.
            </p>
            <p className="leading-relaxed text-coffee/80 font-semibold text-sm uppercase tracking-wider">B. Payment Information</p>
            <p className="leading-relaxed text-coffee/80">
              Your security is our absolute priority. We do <strong>NOT</strong> store your credit card, debit card, or UPI credentials on our servers. All transaction details are processed securely by our trusted PCI-DSS compliant payment gateway partner (Razorpay).
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <Lock className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">3. How We Use Your Data</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-coffee/80 leading-relaxed">
              <li>To process, ship, and deliver your luxury jewellery orders.</li>
              <li>To send order confirmations, tracking information, and customer support updates.</li>
              <li>To share daily live gold and silver rate updates (if subscribed).</li>
              <li>To prevent fraudulent transactions and maintain website security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-3 text-ochre">
              <FileText className="w-6 h-6" />
              <h2 className="text-2xl font-serif font-bold">4. Data Sharing & Third Parties</h2>
            </div>
            <p className="leading-relaxed text-coffee/80">
              We never sell or rent your personal data to anyone. We only share necessary data with trusted service providers to run our services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-coffee/80 leading-relaxed">
              <li><strong>Courier Services:</strong> Sharing your name, address, and phone number to ship your packages.</li>
              <li><strong>Payment Gateways:</strong> Sharing billing details to securely complete your payment.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-6 border-t border-ochre/15">
            <h2 className="text-xl font-serif font-bold text-coffee">5. Contact Us</h2>
            <p className="leading-relaxed text-coffee/80">
              If you have any questions or concerns regarding this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-cream/50 rounded-lg border border-ochre/10 text-sm space-y-1">
              <p><strong>Email:</strong> info.brahmanijewellers@gmail.com</p>
              <p><strong>Phone:</strong> +91 9925811771</p>
              <p><strong>Address:</strong> Near Amraiwadi Metro, Ahmedabad, Gujarat, India</p>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
