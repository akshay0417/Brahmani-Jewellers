import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { TrendingUp, Clock } from 'lucide-react';

const RatesSection = () => {
  const [rates, setRates] = useState({ gold22K: 0, gold24K: 0, gold18K: 0, silver: 0, silver90: 0, lastUpdated: null });
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const res = await api.get('/rates');
      setRates(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching rates", err);
      // Fallback dummy data for demo
      setRates({ gold22K: 6250, gold24K: 6820, silver: 74, lastUpdated: new Date() });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const RateCard = ({ title, value, unit, icon: Icon, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-cream border border-ochre/20 p-6 sm:p-7 rounded-lg text-center relative overflow-hidden group shadow-sm hover:border-ochre/60 hover:shadow-md transition-all duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ochre to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="mb-4 inline-flex p-3 rounded-full bg-cream-alt text-ochre">
        <Icon size={32} />
      </div>
      <h3 className="text-coffee/70 text-sm tracking-widest uppercase mb-2">{title}</h3>
      <div className="flex items-center justify-center gap-2">
        <span className="text-3xl font-serif font-bold text-coffee transition-colors duration-300">₹{(value || 0).toLocaleString('en-IN')}</span>
        <span className="text-coffee/60 text-sm transition-colors duration-300">/{unit}</span>
      </div>
    </motion.div>
  );

  return (
    <section className="py-10 md:py-12 bg-cream-alt relative transition-colors duration-300" id="rates">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-coffee transition-colors duration-300">Market <span className="text-ochre">Live Rates</span></h2>
          <div className="flex items-center justify-center gap-2 text-ochre text-sm uppercase tracking-[0.2em]">
            <Clock size={16} />
            <span>Updated: {rates.lastUpdated ? new Date(rates.lastUpdated).toLocaleTimeString() : 'Refreshing...'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <RateCard 
            title="Gold 24K (Fine)" 
            value={rates.gold24K} 
            unit="10g" 
            icon={TrendingUp} 
            delay={0.1} 
          />
          <RateCard 
            title="Gold 22K (916)" 
            value={rates.gold22K} 
            unit="10g" 
            icon={TrendingUp} 
            delay={0.2} 
          />
          <RateCard 
            title="Gold 18K" 
            value={rates.gold18K} 
            unit="10g" 
            icon={TrendingUp} 
            delay={0.3} 
          />
          <RateCard 
            title="Silver" 
            value={rates.silver90 || rates.silver} 
            unit="1kg" 
            icon={TrendingUp} 
            delay={0.4} 
          />
        </div>
        
        <p className="mt-8 text-center text-xs text-coffee/50 uppercase tracking-widest transition-colors duration-300">
          * Prices are indicative and subject to market fluctuations.
        </p>
      </div>
    </section>
  );
};

export default RatesSection;
