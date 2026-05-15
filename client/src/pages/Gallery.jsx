import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Gallery = () => {
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get('/gallery');
        setItems(res.data);
      } catch (err) {
        // Fallback for demo
        setItems([
          { _id: '1', imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80', category: 'gold' },
          { _id: '2', imageUrl: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=800&q=80', category: 'gold' },
          { _id: '3', imageUrl: 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80', category: 'silver' },
          { _id: '4', imageUrl: 'https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?auto=format&fit=crop&w=800&q=80', category: 'silver' },
          { _id: '5', imageUrl: 'https://images.unsplash.com/photo-1598560912005-59a0d5c1-8ce?auto=format&fit=crop&w=800&q=80', category: 'gold' },
          { _id: '6', imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', category: 'gold' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = filter === 'all' ? items : items.filter(item => item.category === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-48 pb-24 min-h-screen px-4 bg-cream"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-serif font-bold mb-4 text-coffee transition-colors duration-300">Our <span className="text-ochre">Collection</span></h1>
          <p className="text-coffee/70 max-w-2xl mx-auto transition-colors duration-300">Explore our curated collection of heritage jewellery, where each piece tells a story of elegance and craftsmanship.</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {['all', 'gold', 'silver', 'rudraksha', 'antique'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-8 py-2 rounded-full border border-ochre/30 uppercase tracking-widest text-xs transition-all duration-300 ${filter === cat ? 'bg-ochre text-coffee border-ochre' : 'text-ochre hover:bg-ochre/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -10 }}
                className="group relative cursor-pointer overflow-hidden rounded-sm"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-[4/5] overflow-hidden bg-cream-alt">
                  <img
                    src={item.imageUrl}
                    alt={item.category}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-coffee/90 via-coffee/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <span className="text-ochre text-xs uppercase tracking-[0.2em]">{item.category} Collection</span>
                    <h3 className="text-cream font-serif text-lg tracking-wider capitalize">Brahmani Heritage Ornament</h3>
                    {(item.weight || item.purity || item.price) && (
                      <p className="text-cream/80 text-sm mt-1">
                        {item.weight && `Weight: ${item.weight}`} 
                        {item.purity && ` | Purity: ${item.purity}`}
                        {item.price && ` | Price: ₹${item.price.toLocaleString('en-IN')}`}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-coffee/95 flex flex-col items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedItem(null)}
          >
            <button
              className="absolute top-10 right-10 text-cream hover:text-ochre transition-colors z-50"
              onClick={() => setSelectedItem(null)}
            >
              <X size={40} />
            </button>
            <div className="relative flex flex-col items-center max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={selectedItem.imageUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain shadow-2xl border border-ochre/10 mb-4 rounded-sm"
              />
              {(selectedItem.weight || selectedItem.purity) && (
                <div className="text-cream text-lg font-serif mb-6 flex gap-6">
                  {selectedItem.weight && <span>Weight: <span className="text-ochre">{selectedItem.weight}</span></span>}
                  {selectedItem.purity && <span>Purity: <span className="text-ochre">{selectedItem.purity}</span></span>}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="bg-cream text-coffee px-8 py-3 rounded-full font-serif tracking-wider uppercase hover:bg-cream-alt transition-colors shadow-lg border border-ochre/30 flex items-center justify-center"
                  onClick={() => { addToCart(selectedItem._id); setSelectedItem(null); }}
                >
                  Add to Cart
                </button>
                  <a
                    href={`https://wa.me/917621967577?text=${encodeURIComponent("Hello! I'm interested in buying this design: " + selectedItem.imageUrl + (selectedItem.weight ? " (Weight: " + selectedItem.weight + ")" : "") + (selectedItem.purity ? " (Purity: " + selectedItem.purity + ")" : "") + (selectedItem.price ? " (Price: ₹" + selectedItem.price + ")" : ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-ochre text-coffee px-8 py-3 rounded-full font-serif tracking-wider uppercase hover:bg-ochre/90 transition-colors shadow-lg flex items-center justify-center"
                  >
                    Buy via WhatsApp
                  </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;
