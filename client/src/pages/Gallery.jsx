import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const closeLightbox = () => {
    setSelectedItem(null);
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin({ x, y });
  };

  const handleTouchMove = (e) => {
    if (!isZoomed) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
      const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
      setZoomOrigin({ x, y });
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (isZoomed) {
      setIsZoomed(false);
    } else {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
      if (clientX && clientY) {
        const x = ((clientX - left) / width) * 100;
        const y = ((clientY - top) / height) * 100;
        setZoomOrigin({ x, y });
      } else {
        setZoomOrigin({ x: 50, y: 50 });
      }
      setIsZoomed(true);
    }
  };

  useEffect(() => {
    if (categoryParam) {
      setFilter(categoryParam.toLowerCase());
      setSubFilter('');
    }
  }, [categoryParam]);

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

  const filteredItems = items.filter(item => {
    const isCollection = item.targetPage === 'collection' || item.targetPage === 'both' || !item.targetPage;
    if (!isCollection) return false;
    if (filter !== 'all' && item.category !== filter) return false;
    if (subFilter && item.subCategory !== subFilter) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-48 pb-24 min-h-screen px-4 bg-cream text-coffee"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-ochre tracking-[0.5em] uppercase text-xs font-bold mb-4 block">Collection</motion.span>
          <h1 className="text-5xl font-serif font-bold mb-4 text-coffee">Our <span className="text-ochre italic">Masterpieces</span></h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
          <p className="text-coffee/70 max-w-2xl mx-auto">A pure visual showcase of our finest artistry. Browse our heritage designs and draw inspiration for your next bespoke creation.</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-6 mb-16 flex-wrap">
          {['all', 'gold', 'silver', 'rudraksha', 'antique'].map((cat) => {
            const isGoldOrSilver = cat === 'gold' || cat === 'silver';
            const subCats = isGoldOrSilver ? [...new Set(items.filter(i => i.category === cat && i.subCategory && (i.targetPage === 'collection' || i.targetPage === 'both' || !i.targetPage)).map(i => i.subCategory))] : [];

            return (
              <div key={cat} className="relative group pb-2">
                <button
                  onClick={() => { setFilter(cat); setSubFilter(''); }}
                  className={`uppercase tracking-[0.2em] text-sm font-bold transition-all duration-300 ${filter === cat && !subFilter ? 'text-ochre border-b-2 border-ochre pb-1' : 'text-coffee/50 hover:text-coffee'}`}
                >
                  {cat}
                </button>
                
                {isGoldOrSilver && subCats.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-cream border border-ochre/20 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                    <div className="flex flex-col">
                      <button onClick={() => { setFilter(cat); setSubFilter(''); }} className={`px-4 py-3 text-xs uppercase tracking-widest text-left transition-colors ${filter === cat && !subFilter ? 'bg-ochre/10 text-ochre font-bold' : 'text-coffee hover:bg-ochre/5'}`}>
                        All {cat}
                      </button>
                      {subCats.map(sub => (
                        <button 
                          key={sub} 
                          onClick={() => { setFilter(cat); setSubFilter(sub); }} 
                          className={`px-4 py-3 text-xs uppercase tracking-widest text-left transition-colors ${subFilter === sub ? 'bg-ochre/10 text-ochre font-bold' : 'text-coffee hover:bg-ochre/5'}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-coffee/90 via-coffee/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-6">
                    <span className="text-ochre uppercase tracking-[0.2em] text-xs font-bold mb-2">
                      {item.subCategory ? `${item.subCategory} • ${item.category}` : `${item.category} Collection`}
                    </span>
                    <button className="px-6 py-2 border border-ochre text-cream hover:bg-ochre hover:text-coffee transition-colors rounded-sm uppercase tracking-widest text-xs font-bold">
                      View Details
                    </button>
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
            onClick={closeLightbox}
          >
            <button
              className="absolute top-10 right-10 text-cream/50 hover:text-ochre transition-colors z-50 p-4"
              onClick={closeLightbox}
            >
              <X size={40} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative flex flex-col items-center max-w-full max-h-full" 
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="overflow-hidden rounded-sm ring-1 ring-cream/10 bg-cream-alt max-w-full max-h-[75vh] relative"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onClick={handleImageClick}
              >
                <img
                  src={selectedItem.imageUrl}
                  alt="Preview"
                  className={`max-w-full max-h-[75vh] object-contain shadow-2xl transition-transform duration-200 ease-out ${isZoomed ? 'cursor-zoom-out font-bold' : 'cursor-zoom-in'}`}
                  style={{
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                  }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
                />
              </div>
              <p className="text-cream/50 text-xs mt-3 select-none">
                {isZoomed ? "Move mouse or drag touch to pan. Click to zoom out." : "Click or tap image to zoom."}
              </p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 text-center"
              >
                <h3 className="text-2xl font-serif text-ochre mb-2 tracking-widest uppercase">{selectedItem.name || `${selectedItem.category} Design`}</h3>
                {selectedItem.description && <p className="text-cream/80 text-sm italic mb-2 max-w-lg mx-auto">{selectedItem.description}</p>}
                {(selectedItem.weight || selectedItem.purity || selectedItem.subCategory) && (
                  <p className="text-cream/60 text-xs tracking-widest uppercase mt-2">
                    {selectedItem.subCategory && `${selectedItem.subCategory}`}
                    {selectedItem.subCategory && (selectedItem.weight || selectedItem.purity) && ` • `}
                    {selectedItem.weight && `Weight: ${selectedItem.weight}`} 
                    {selectedItem.weight && selectedItem.purity && ` • `}
                    {selectedItem.purity && `Purity: ${selectedItem.purity}`}
                  </p>
                )}
                <a
                  href={`https://wa.me/917621967577?text=${encodeURIComponent("Hello! I love this design from your collection: " + selectedItem.imageUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block border border-ochre text-cream px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-ochre hover:text-coffee transition-colors"
                >
                  Inquire Design
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;
