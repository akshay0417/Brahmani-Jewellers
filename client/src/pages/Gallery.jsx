import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Gallery = () => {
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
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = filter === 'all' 
    ? items.filter(item => item.targetPage === 'collection' || item.targetPage === 'both' || !item.targetPage) 
    : items.filter(item => item.category === filter && (item.targetPage === 'collection' || item.targetPage === 'both' || !item.targetPage));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-48 pb-24 min-h-screen px-4 bg-cream text-coffee"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-ochre tracking-[0.5em] uppercase text-xs font-bold mb-4 block">Exhibition</motion.span>
          <h1 className="text-5xl font-serif font-bold mb-4 text-coffee">Our <span className="text-ochre italic">Masterpieces</span></h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
          <p className="text-coffee/70 max-w-2xl mx-auto">A pure visual showcase of our finest artistry. Browse our heritage designs and draw inspiration for your next bespoke creation.</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-6 mb-16 flex-wrap">
          {['all', 'gold', 'silver', 'rudraksha', 'antique'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`pb-2 uppercase tracking-[0.2em] text-sm font-bold transition-all duration-300 ${filter === cat ? 'text-ochre border-b-2 border-ochre' : 'text-coffee/50 hover:text-coffee'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid - Masonry style approximation */}
        {loading ? (
           <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-ochre border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <motion.div
                  layout
                  key={item._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  className="group relative cursor-zoom-in overflow-hidden rounded-lg break-inside-avoid shadow-xl border border-ochre/10"
                  onClick={() => setSelectedItem(item)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.category}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-coffee/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-cream font-serif text-2xl uppercase tracking-widest border border-cream/50 px-6 py-2 backdrop-blur-sm">View</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-coffee/95 flex flex-col items-center justify-center p-4 md:p-10 backdrop-blur-md"
            onClick={() => setSelectedItem(null)}
          >
            <button
              className="absolute top-10 right-10 text-cream/50 hover:text-ochre transition-colors z-50 p-4"
              onClick={() => setSelectedItem(null)}
            >
              <X size={40} />
            </button>
            <div className="relative flex flex-col items-center max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
              <motion.img
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                src={selectedItem.imageUrl}
                alt="Preview"
                className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-sm ring-1 ring-cream/10 bg-cream-alt"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
              />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 text-center"
              >
                <h3 className="text-2xl font-serif text-ochre mb-2 tracking-widest uppercase">{selectedItem.category} Design</h3>
                {(selectedItem.weight || selectedItem.purity) && (
                  <p className="text-cream/80 text-sm tracking-widest uppercase">
                    {selectedItem.weight && `Weight: ${selectedItem.weight}`} 
                    {selectedItem.weight && selectedItem.purity && ` • `}
                    {selectedItem.purity && `Purity: ${selectedItem.purity}`}
                  </p>
                )}
                <a
                  href={`https://wa.me/917621967577?text=${encodeURIComponent("Hello! I love this design from your exhibition: " + selectedItem.imageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block border border-ochre text-cream px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-ochre hover:text-coffee transition-colors"
                >
                  Inquire Design
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;
