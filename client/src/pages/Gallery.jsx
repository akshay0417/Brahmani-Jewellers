import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
    const newUrl = `${window.location.pathname}?id=${item._id}`;
    window.history.pushState({ id: item._id }, '', newUrl);
  };

  const handleShare = (item) => {
    const shareUrl = `${window.location.origin}/gallery?id=${item._id}`;
    if (navigator.share) {
      navigator.share({
        title: item.name || 'Heritage Masterpiece',
        text: 'Check out this luxury ornament from Brahmani Jewellers:',
        url: shareUrl
      }).catch(err => console.error("Error sharing: ", err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error("Could not copy text: ", err));
    }
  };

  const closeLightbox = () => {
    setSelectedItem(null);
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    setCurrentImageIndex(0);
    window.history.pushState({}, '', window.location.pathname);
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

        // Check if id parameter is in URL for deep linking
        const params = new URLSearchParams(window.location.search);
        const itemId = params.get('id');
        if (itemId) {
          const matched = res.data.find(i => i._id === itemId);
          if (matched) {
            setSelectedItem(matched);
          }
        }
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

  if (selectedItem) {
    const allImages = [selectedItem.imageUrl, ...(selectedItem.additionalImages || [])];
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pt-32 pb-24 px-4 bg-cream min-h-screen text-coffee"
      >
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={closeLightbox} 
            className="mb-8 flex items-center gap-2 text-coffee/60 hover:text-ochre font-bold uppercase tracking-widest text-xs transition-colors"
          >
            ← Back to Collection
          </button>
          
          <div className="flex flex-col lg:flex-row gap-12 bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/10 shadow-xl">
            {/* Left Side: Images */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div 
                className="w-full aspect-[4/5] bg-cream rounded-xl overflow-hidden relative flex items-center justify-center p-4 border border-ochre/15"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onClick={handleImageClick}
              >
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={selectedItem.name || 'Design'} 
                  className={`max-w-full max-h-full object-contain transition-transform duration-200 ease-out ${isZoomed ? 'cursor-zoom-out font-bold' : 'cursor-zoom-in'}`}
                  style={{
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                  }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
                />
                
                {/* Carousel Left/Right arrows */}
                {allImages.length > 1 && !isZoomed && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="absolute left-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/25 hover:bg-ochre hover:text-coffee transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/25 hover:bg-ochre hover:text-coffee transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnails below the image */}
              {allImages.length > 1 && (
                <div className="flex gap-3 mt-6 select-none flex-wrap justify-center">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg border-2 overflow-hidden transition-all ${currentImageIndex === idx ? 'border-ochre shadow-md' : 'border-coffee/10 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-coffee/50 text-xs mt-4 select-none">
                {isZoomed ? "Move mouse or drag touch to pan. Click to zoom out." : "Click or tap image to zoom."}
              </p>
            </div>
            
            {/* Right Side: Details */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center">
              <span className="text-ochre tracking-[0.3em] uppercase text-xs font-bold mb-3 block">{selectedItem.category} Collection</span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-coffee mb-4 leading-tight">{selectedItem.name || 'Royal Heritage Design'}</h1>
              <div className="w-16 h-1 bg-ochre mb-6"></div>
              
              {selectedItem.description && <p className="text-coffee/75 mb-8 italic leading-relaxed text-base">{selectedItem.description}</p>}
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Category</span><span className="text-sm font-serif text-coffee capitalize">{selectedItem.category}</span></div>
                {selectedItem.subCategory && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Item Type</span><span className="text-sm font-serif text-coffee capitalize">{selectedItem.subCategory}</span></div>}
                {selectedItem.weight && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Weight</span><span className="text-sm font-serif text-coffee">{selectedItem.weight} Grams</span></div>}
                {selectedItem.purity && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Purity</span><span className="text-sm font-serif text-coffee">{selectedItem.purity}</span></div>}
              </div>
              
              {(() => {
                let text = `Hello Brahmani Jewellers, I am interested in this design from your collection:\n\n`;
                text += `*Name:* ${selectedItem.name || 'Heritage Design'}\n`;
                text += `*Category:* ${selectedItem.category}\n`;
                if (selectedItem.subCategory) text += `*Item Type:* ${selectedItem.subCategory}\n`;
                if (selectedItem.weight) text += `*Weight:* ${selectedItem.weight} Grams\n`;
                if (selectedItem.purity) text += `*Purity:* ${selectedItem.purity}\n\n`;
                text += `Image Link: ${selectedItem.imageUrl}`;

                const whatsappUrl = `https://wa.me/917621967577?text=${encodeURIComponent(text)}`;
                return (
                  <div className="flex flex-col sm:flex-row gap-4 w-full">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-4 px-8 bg-[#25D366] text-white border border-[#25D366] text-center font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-[#20ba5a] transition-all shadow-md block animate-pulse hover:animate-none"
                    >
                      Inquire Design
                    </a>
                    <button
                      onClick={() => handleShare(selectedItem)}
                      className="flex-1 py-4 px-8 bg-cream-alt text-coffee border border-ochre/30 text-center font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-ochre hover:text-coffee transition-all shadow-md flex items-center justify-center gap-3"
                    >
                      <Share2 size={16} className="text-ochre" />
                      {copied ? "Link Copied!" : "Share"}
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 min-h-screen px-4 bg-cream text-coffee"
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
          {['all', 'gold', 'silver', 'best-seller', 'offers'].map((cat) => {
            const isGoldOrSilver = cat === 'gold' || cat === 'silver';
            const subCats = isGoldOrSilver ? [...new Set(items.filter(i => i.category === cat && i.subCategory && (i.targetPage === 'collection' || i.targetPage === 'both' || !i.targetPage)).map(i => i.subCategory))] : [];

            return (
              <div key={cat} className="relative group pb-2">
                <button
                  onClick={() => { setFilter(cat); setSubFilter(''); }}
                  className={`uppercase tracking-[0.2em] text-sm font-bold transition-all duration-300 ${filter === cat && !subFilter ? 'text-ochre border-b-2 border-ochre pb-1' : 'text-coffee/50 hover:text-coffee'}`}
                >
                  {cat === 'best-seller' ? 'Best Sellers' : cat === 'offers' ? 'Offers' : cat}
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
          <div className="columns-2 lg:columns-3 gap-4 space-y-4">
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
                  onClick={() => handleItemSelect(item)}
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
              className="relative flex flex-col md:flex-row items-center justify-center max-w-5xl w-full bg-coffee border border-ochre/20 rounded-lg p-6 md:p-10 gap-8 overflow-y-auto max-h-[90vh]" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Side: Image container */}
              {(() => {
                const allImages = [selectedItem.imageUrl, ...(selectedItem.additionalImages || [])];
                return (
                  <div className="flex-1 flex flex-col items-center justify-center w-full max-h-[55vh] md:max-h-[75vh]">
                    <div 
                      className="overflow-hidden rounded-md ring-1 ring-cream/10 bg-cream-alt relative w-full flex items-center justify-center min-h-[40vh]"
                      onMouseMove={handleMouseMove}
                      onTouchMove={handleTouchMove}
                      onClick={handleImageClick}
                    >
                      <img
                        src={allImages[currentImageIndex]}
                        alt="Preview"
                        className={`max-w-full max-h-[50vh] md:max-h-[65vh] object-contain shadow-2xl transition-transform duration-200 ease-out ${isZoomed ? 'cursor-zoom-out font-bold' : 'cursor-zoom-in'}`}
                        style={{
                          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                          transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                        }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
                      />

                      {/* Carousel Left/Right arrows */}
                      {allImages.length > 1 && !isZoomed && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/25 hover:bg-ochre hover:text-coffee transition-all"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/25 hover:bg-ochre hover:text-coffee transition-all"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dots / Thumbnails */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-4 select-none">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-12 h-12 rounded border overflow-hidden transition-all ${currentImageIndex === idx ? 'border-ochre ring-1 ring-ochre font-bold' : 'border-cream/20 opacity-60 hover:opacity-100'}`}
                          >
                            <img src={img} alt="thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-cream/50 text-xs mt-3 select-none">
                      {isZoomed ? "Move mouse or drag touch to pan. Click to zoom out." : "Click or tap image to zoom."}
                    </p>
                  </div>
                );
              })()}

              {/* Right Side: Details container */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 w-full flex flex-col justify-center text-center md:text-left"
              >
                <h3 className="text-3xl font-serif text-ochre mb-4 tracking-widest uppercase">{selectedItem.name || `${selectedItem.category} Design`}</h3>
                {selectedItem.description && <p className="text-cream/80 text-base italic mb-4 max-w-lg leading-relaxed">{selectedItem.description}</p>}
                
                <div className="border-t border-b border-cream/10 py-4 my-4">
                  {(selectedItem.weight || selectedItem.purity || selectedItem.subCategory) && (
                    <div className="space-y-2">
                      {selectedItem.subCategory && (
                        <p className="text-cream/70 text-sm"><strong className="text-ochre uppercase tracking-wider text-xs">Category:</strong> {selectedItem.subCategory}</p>
                      )}
                      {selectedItem.weight && (
                        <p className="text-cream/70 text-sm"><strong className="text-ochre uppercase tracking-wider text-xs">Weight:</strong> {selectedItem.weight} grams</p>
                      )}
                      {selectedItem.purity && (
                        <p className="text-cream/70 text-sm"><strong className="text-ochre uppercase tracking-wider text-xs">Purity:</strong> {selectedItem.purity}</p>
                      )}
                    </div>
                  )}
                </div>

                {(() => {
                  let text = `Hello Brahmani Jewellers, I am interested in this design from your collection:\n\n`;
                  text += `*Name:* ${selectedItem.name || 'Heritage Design'}\n`;
                  text += `*Category:* ${selectedItem.category}\n`;
                  if (selectedItem.subCategory) text += `*Item Type:* ${selectedItem.subCategory}\n`;
                  if (selectedItem.weight) text += `*Weight:* ${selectedItem.weight} Grams\n`;
                  if (selectedItem.purity) text += `*Purity:* ${selectedItem.purity}\n\n`;
                  text += `Image Link: ${selectedItem.imageUrl}`;

                  const whatsappUrl = `https://wa.me/917621967577?text=${encodeURIComponent(text)}`;
                  return (
                    <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 border border-[#25D366] bg-[#25D366] text-white px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-[#20ba5a] hover:border-[#20ba5a] transition-all text-center rounded-sm shadow-md block"
                      >
                        Inquire Design
                      </a>
                      <button
                        onClick={() => handleShare(selectedItem)}
                        className="flex-1 border border-ochre/30 bg-cream text-coffee px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-ochre hover:text-coffee transition-all text-center rounded-sm shadow-md flex items-center justify-center gap-2"
                      >
                        <Share2 size={14} className="text-ochre" />
                        {copied ? "Link Copied!" : "Share"}
                      </button>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Gallery;
