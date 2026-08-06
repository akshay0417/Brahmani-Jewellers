import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, ShieldCheck, Truck, MessageCircle, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [rates, setRates] = useState(null);
  const [filter, setFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

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

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    const newUrl = `${window.location.pathname}?id=${product._id}`;
    window.history.pushState({ id: product._id }, '', newUrl);
  };

  const handleShare = (product) => {
    const priceData = calculatePrice(product);
    const finalPrice = priceData.final;
    const shareUrl = `${window.location.origin}/shop?id=${product._id}`;
    
    let shareText = `✨ *Brahmani Jewellers* ✨\n\n`;
    shareText += `Heritage Masterpiece: *${product.name || 'Luxury Ornament'}*\n`;
    shareText += `Category: ${product.category}\n`;
    if (product.weight) shareText += `Weight: ${product.weight} Grams\n`;
    if (product.purity) shareText += `Purity: ${product.purity}\n`;
    if (finalPrice > 0) shareText += `Price: ₹${finalPrice.toLocaleString('en-IN')} (Incl. GST)\n`;
    shareText += `\n📷 Photo Preview: ${product.imageUrl}\n`;
    shareText += `🔗 View Details: ${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: product.name || 'Brahmani Jewellers Design',
        text: shareText
      }).catch(err => console.error("Error sharing: ", err));
    } else {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error("Could not copy text: ", err));
    }
  };

  // Local Wishlist State (persisted in localStorage)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (id) => {
    let updated;
    if (wishlist.includes(id)) {
      updated = wishlist.filter(item => item !== id);
    } else {
      updated = [...wishlist, id];
    }
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, ratesRes] = await Promise.all([
          api.get('/gallery'),
          api.get('/rates')
        ]);
        const shopItems = itemsRes.data.filter(item => item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage);
        setItems(shopItems);
        setRates(ratesRes.data);

        // Deep-linking: check if URL query params contain product ID
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (productId) {
          const matched = shopItems.find(item => item._id === productId);
          if (matched) {
            setSelectedProduct(matched);
          }
        }
      } catch (err) {
        console.error("Error fetching shop items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculatePrice = (item) => {
    if (item.price) {
      const basePrice = Number(item.price);
      const gst = basePrice * 0.03;
      const final = Math.round(basePrice + gst);
      return { 
        final, 
        breakdown: { basePrice, makingPercent: 0, makingAmount: 0, other: 0, gst, subtotal: basePrice } 
      };
    }
    if (!rates || !item.weight || !item.purity) return { final: 0, breakdown: null };

    let ratePerGram = 0;
    const p = (item.purity || '').toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('92.5') || p.includes('925')) ratePerGram = (rates.silver90 / 1000) * (92.5 / 90);
    else if (p.includes('90') || p.includes('SILVER')) ratePerGram = rates.silver90 / 1000;

    if (!ratePerGram) return { final: 0, breakdown: null };

    const weight = parseFloat(item.weight);
    const basePrice = ratePerGram * weight;
    const makingPercent = item.makingCharges || 0;
    const makingAmount = basePrice * (makingPercent / 100);
    const other = item.otherCharges || 0;
    const subtotal = basePrice + makingAmount + other;
    const gst = subtotal * 0.03;
    const final = Math.round(subtotal + gst);

    return {
      final,
      breakdown: { basePrice, makingPercent, makingAmount, other, gst, subtotal }
    };
  };

  const handleWhatsAppInquiry = (product) => {
    if (!product) return;
    const priceData = calculatePrice(product);
    const finalPrice = priceData.final;
    const productLink = `${window.location.origin}/shop?id=${product._id}`;
    
    let text = `Hello Brahmani Jewellers, I am interested in this item:\n\n`;
    text += `*Name:* ${product.name || 'Heritage Ornament'}\n`;
    text += `*Category:* ${product.category}\n`;
    if (product.purity) text += `*Purity:* ${product.purity}\n`;
    if (product.weight) text += `*Weight:* ${product.weight} Grams\n`;
    text += `*Price:* ₹${finalPrice.toLocaleString('en-IN')}\n\n`;
    text += `Link: ${productLink}`;

    const whatsappUrl = `https://wa.me/917621967577?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shopCategories = ['all', 'gold', 'silver', 'best-seller', 'offers'];
  const filteredItems = items.filter(item => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (subFilter && item.subCategory !== subFilter) return false;
    return true;
  });

  const ProductCard = ({ item }) => {
    const priceData = calculatePrice(item);
    const isFavorite = wishlist.includes(item._id);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -8 }}
        className="royal-card rounded-xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 border border-ochre/10"
        onClick={() => handleProductSelect(item)}
      >
        <div className="aspect-[3/4] overflow-hidden relative bg-cream-alt">
          <img 
            src={item.imageUrl} 
            alt={item.category} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80'; }}
          />
          
          {/* Wishlist Heart Icon (Working) */}
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                toggleWishlist(item._id); 
              }} 
              className="p-2.5 bg-cream/90 backdrop-blur-md rounded-full shadow-md text-coffee hover:text-ochre hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Heart 
                size={18} 
                className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-coffee/80'} transition-colors duration-200`} 
              />
            </button>
          </div>

          {/* Hover Overlay with Add to Cart Action */}
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-coffee/95 via-coffee/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(item._id); }}
              className="w-full py-3 bg-ochre text-coffee font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 rounded-sm hover:bg-ochre/90 transition-all duration-200 shadow-md"
            >
              <ShoppingBag size={14} /> Add to Cart
            </button>
          </div>
        </div>
        <div className="p-5 text-center">
          <span className="text-[10px] text-ochre uppercase tracking-[0.2em] font-bold mb-1 block">{item.subCategory ? `${item.subCategory} • ${item.category}` : `${item.category} Collection`}</span>
          <h3 className="font-serif text-lg text-coffee mb-2 tracking-wide truncate px-2">{item.name || 'Heritage Masterpiece'}</h3>
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xl font-bold text-coffee">₹{priceData.final.toLocaleString('en-IN')}</span>
            {priceData.breakdown && <span className="text-[10px] text-coffee/50 uppercase tracking-widest">(Incl. 3% GST)</span>}
          </div>
        </div>
      </motion.div>
    );
  };

  const handleBackToShop = () => {
    setSelectedProduct(null);
    setIsZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
    window.history.pushState({}, '', window.location.pathname);
  };

  if (selectedProduct) {
    const pData = calculatePrice(selectedProduct);
    const allImages = [selectedProduct.imageUrl, ...(selectedProduct.additionalImages || [])];
    const isFavorite = wishlist.includes(selectedProduct._id);
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pt-32 pb-24 px-4 bg-cream min-h-screen"
      >
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button 
            onClick={handleBackToShop} 
            className="mb-8 flex items-center gap-2 text-coffee/60 hover:text-ochre font-bold uppercase tracking-widest text-xs transition-colors"
          >
            ← Back to Shop
          </button>
          
          <div className="flex flex-col lg:flex-row gap-12 bg-cream-alt p-8 md:p-12 rounded-2xl border border-ochre/10 shadow-xl">
            {/* Left Side: Product Images */}
            <div className="w-full lg:w-1/2 flex flex-col items-center">
              <div 
                className="w-full aspect-[4/5] bg-cream rounded-xl overflow-hidden relative flex items-center justify-center p-4 border border-ochre/15"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onClick={handleImageClick}
              >
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={selectedProduct.name} 
                  className={`max-w-full max-h-full object-contain transition-transform duration-200 ease-out ${isZoomed ? 'cursor-zoom-out font-bold' : 'cursor-zoom-in'}`}
                  style={{
                    transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                  }}
                />
                
                {/* Wishlist Heart Icon */}
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={() => toggleWishlist(selectedProduct._id)} 
                    className="p-3 bg-cream-alt/90 backdrop-blur-md rounded-full shadow-md text-coffee hover:text-ochre hover:scale-110 active:scale-95 transition-all duration-200"
                  >
                    <Heart 
                      size={20} 
                      className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-coffee/80'} transition-colors duration-200`} 
                    />
                  </button>
                </div>
                
                {/* Left/Right Carousel Controls */}
                {allImages.length > 1 && !isZoomed && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="absolute left-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/20 hover:bg-ochre hover:text-coffee transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 p-2 rounded-full bg-coffee/80 text-cream border border-ochre/20 hover:bg-ochre hover:text-coffee transition-all"
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
            </div>
            
            {/* Right Side: Product Details */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center">
              <span className="text-ochre tracking-[0.3em] uppercase text-xs font-bold mb-3 block">{selectedProduct.category} Collection</span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-coffee mb-4 leading-tight">{selectedProduct.name || 'Royal Heritage Ornament'}</h1>
              <div className="w-16 h-1 bg-ochre mb-6"></div>
              
              {selectedProduct.description && <p className="text-coffee/70 mb-8 italic leading-relaxed text-base">{selectedProduct.description}</p>}
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Category</span><span className="text-sm font-serif text-coffee capitalize">{selectedProduct.category}</span></div>
                {selectedProduct.subCategory && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Item Type</span><span className="text-sm font-serif text-coffee capitalize">{selectedProduct.subCategory}</span></div>}
                {selectedProduct.weight && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Weight</span><span className="text-sm font-serif text-coffee">{selectedProduct.weight} Grams</span></div>}
                {selectedProduct.purity && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Purity</span><span className="text-sm font-serif text-coffee">{selectedProduct.purity}</span></div>}
              </div>

              {pData.breakdown && (
                <div className="bg-cream p-5 rounded-xl border border-ochre/15 mb-8 space-y-3 shadow-inner">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-coffee mb-3 border-b border-ochre/10 pb-2 flex items-center justify-between">
                    <span>Price Breakdown</span>
                    <span className="text-[10px] text-ochre tracking-[0.1em] font-serif lowercase italic">Live Market Verified</span>
                  </h4>
                  <div className="flex justify-between text-sm"><span className="text-coffee/70">Metal Value</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.basePrice).toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-coffee/70">Making Charges ({pData.breakdown.makingPercent}%)</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.makingAmount).toLocaleString('en-IN')}</span></div>
                  {pData.breakdown.other > 0 && <div className="flex justify-between text-sm"><span className="text-coffee/70">Other Charges</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.other).toLocaleString('en-IN')}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-coffee/70">GST (3%)</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.gst).toLocaleString('en-IN')}</span></div>
                </div>
              )}

              <div className="flex items-end gap-6 mb-10">
                <span className="text-5xl font-bold text-coffee">₹{pData.final.toLocaleString('en-IN')}</span>
                {pData.breakdown && <div className="px-3 py-1 bg-ochre/10 text-ochre text-[10px] font-bold uppercase tracking-widest rounded-sm border border-ochre/20 mb-1">Live Rate Verified</div>}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => addToCart(selectedProduct._id)} 
                  className="flex-1 py-4 bg-ochre text-coffee font-bold uppercase tracking-widest rounded-sm hover:bg-ochre/90 transition-all flex items-center justify-center gap-3 shadow-md"
                >
                  <ShoppingBag size={20} /> Add to Cart
                </button>
                <button 
                  onClick={() => handleWhatsAppInquiry(selectedProduct)} 
                  className="flex-1 py-4 bg-[#25D366] text-white font-bold uppercase tracking-widest rounded-sm hover:bg-[#20ba5a] transition-all flex items-center justify-center gap-3 shadow-md"
                >
                  <MessageCircle size={20} /> WhatsApp Inquiry
                </button>
                <button 
                  onClick={() => handleShare(selectedProduct)} 
                  className="flex-1 py-4 bg-cream-alt text-coffee border border-ochre/30 font-bold uppercase tracking-widest rounded-sm hover:bg-ochre hover:text-coffee transition-all flex items-center justify-center gap-3 shadow-md"
                >
                  <Share2 size={20} className="text-ochre" />
                  {copied ? "Link Copied!" : "Share"}
                </button>
              </div>
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
      className="pt-32 pb-24 px-4 bg-cream min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-ochre tracking-[0.5em] uppercase text-xs font-bold mb-4 block">Luxury Showroom</motion.span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-coffee mb-6">Royal <span className="text-ochre italic">Showcase</span></h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {shopCategories.map(cat => {
            const isGoldOrSilver = cat === 'gold' || cat === 'silver';
            const subCats = isGoldOrSilver ? [...new Set(items.filter(i => i.category === cat && i.subCategory).map(i => i.subCategory))] : [];

            return (
              <div key={cat} className="relative group">
                <button 
                  onClick={() => { setFilter(cat); setSubFilter(''); }} 
                  className={`px-10 py-3 rounded-full border border-ochre/20 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${filter === cat && !subFilter ? 'bg-ochre text-coffee border-ochre shadow-lg' : 'text-coffee hover:bg-ochre/10'}`}
                >
                  {cat === 'best-seller' ? 'Best Sellers' : cat === 'offers' ? 'Offers' : cat}
                </button>
                
                {isGoldOrSilver && subCats.length > 0 && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="flex flex-col bg-cream border border-ochre/20 rounded-md shadow-xl overflow-hidden">
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

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-ochre border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-16">
            <AnimatePresence mode="popLayout">{filteredItems.map(item => <ProductCard key={item._id} item={item} />)}</AnimatePresence>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[{ icon: ShieldCheck, text: "Certified Purity" }, { icon: Truck, text: "Secure Delivery" }, { icon: ShoppingBag, text: "Luxury Packaging" }, { icon: Heart, text: "Lifetime Trust" }].map((feature, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-6 bg-cream-alt rounded-xl border border-ochre/10">
              <feature.icon className="text-ochre mb-3" size={24} />
              <span className="text-[10px] uppercase tracking-widest text-coffee font-bold">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-coffee/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setSelectedProduct(null); setIsZoomed(false); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-cream max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative flex flex-col md:flex-row scrollbar-hide" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setSelectedProduct(null); setIsZoomed(false); }} className="absolute top-6 right-6 z-10 p-2 bg-coffee/10 hover:bg-ochre hover:text-cream rounded-full transition-all"><X size={24} /></button>
              {(() => {
                const allImages = [selectedProduct.imageUrl, ...(selectedProduct.additionalImages || [])];
                return (
                  <div className="w-full md:w-1/2 bg-cream-alt flex flex-col items-center justify-center p-4 min-h-[40vh] relative">
                    <div 
                      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-cream rounded-xl border border-ochre/10 min-h-[40vh]"
                      onMouseMove={handleMouseMove}
                      onTouchMove={handleTouchMove}
                      onClick={handleImageClick}
                    >
                      <img 
                        src={allImages[currentImageIndex]} 
                        alt="Product" 
                        className={`max-w-full max-h-[50vh] object-contain transition-transform duration-200 ease-out ${isZoomed ? 'cursor-zoom-out font-bold' : 'cursor-zoom-in'}`}
                        style={{
                          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                          transform: isZoomed ? 'scale(2.5)' : 'scale(1)'
                        }}
                      />

                      {/* Left/Right Carousel Controls */}
                      {allImages.length > 1 && !isZoomed && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-2 p-1.5 rounded-full bg-coffee/80 text-cream border border-ochre/20 hover:bg-ochre hover:text-coffee transition-all"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-2 p-1.5 rounded-full bg-coffee/80 text-cream border border-ochre/20 hover:bg-ochre hover:text-coffee transition-all"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnails below the image */}
                    {allImages.length > 1 && (
                      <div className="flex gap-2 mt-4 select-none flex-wrap justify-center">
                        {allImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-10 h-10 rounded border overflow-hidden transition-all ${currentImageIndex === idx ? 'border-ochre ring-1 ring-ochre font-bold' : 'border-coffee/10 opacity-60 hover:opacity-100'}`}
                          >
                            <img src={img} alt="thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
                <span className="text-ochre tracking-[0.3em] uppercase text-xs font-bold mb-2 block">{selectedProduct.category} Collection</span>
                <h2 className="text-4xl font-serif font-bold text-coffee mb-4">{selectedProduct.name || 'Royal Heritage Ornament'}</h2>
                <div className="w-12 h-1 bg-ochre mb-6"></div>
                {selectedProduct.description && <p className="text-coffee/70 mb-6 italic">{selectedProduct.description}</p>}
                
                {(() => {
                  const pData = calculatePrice(selectedProduct);
                  return (
                    <>
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Category</span><span className="text-sm font-serif text-coffee capitalize">{selectedProduct.category}</span></div>
                        {selectedProduct.subCategory && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Item Type</span><span className="text-sm font-serif text-coffee capitalize">{selectedProduct.subCategory}</span></div>}
                        {selectedProduct.weight && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Weight</span><span className="text-sm font-serif text-coffee">{selectedProduct.weight} Grams</span></div>}
                        {selectedProduct.purity && <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Purity</span><span className="text-sm font-serif text-coffee">{selectedProduct.purity}</span></div>}
                      </div>

                      {pData.breakdown && (
                        <div className="bg-cream-alt p-4 rounded-lg border border-ochre/20 mb-8 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-coffee mb-3 border-b border-ochre/20 pb-2">Price Breakdown</h4>
                          <div className="flex justify-between text-sm"><span className="text-coffee/70">Gold/Silver Value</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.basePrice).toLocaleString('en-IN')}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-coffee/70">Making Charges ({pData.breakdown.makingPercent}%)</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.makingAmount).toLocaleString('en-IN')}</span></div>
                          {pData.breakdown.other > 0 && <div className="flex justify-between text-sm"><span className="text-coffee/70">Other Charges</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.other).toLocaleString('en-IN')}</span></div>}
                          <div className="flex justify-between text-sm"><span className="text-coffee/70">GST (3%)</span><span className="text-coffee font-medium">₹{Math.round(pData.breakdown.gst).toLocaleString('en-IN')}</span></div>
                        </div>
                      )}

                      <div className="flex items-end gap-6 mb-10">
                        <span className="text-4xl font-bold text-coffee">₹{pData.final.toLocaleString('en-IN')}</span>
                        {pData.breakdown && <div className="px-3 py-1 bg-ochre/10 text-ochre text-[10px] font-bold uppercase tracking-widest rounded-sm border border-ochre/20 mb-1">Live Rate Verified</div>}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button 
                          onClick={() => { addToCart(selectedProduct._id); setSelectedProduct(null); }} 
                          className="flex-1 py-4 bg-ochre text-coffee font-bold uppercase tracking-widest rounded-sm hover:bg-ochre/90 transition-all flex items-center justify-center gap-3 shadow-md"
                        >
                          <ShoppingBag size={20} /> Add to Cart
                        </button>
                        <button 
                          onClick={() => handleWhatsAppInquiry(selectedProduct)} 
                          className="flex-1 py-4 bg-[#25D366] text-white font-bold uppercase tracking-widest rounded-sm hover:bg-[#20ba5a] transition-all flex items-center justify-center gap-3 shadow-md"
                        >
                          <MessageCircle size={20} /> WhatsApp Inquiry
                        </button>
                        <button 
                          onClick={() => handleShare(selectedProduct)} 
                          className="flex-1 py-4 bg-cream-alt text-coffee border border-ochre/30 font-bold uppercase tracking-widest rounded-sm hover:bg-ochre hover:text-coffee transition-all flex items-center justify-center gap-3 shadow-md"
                        >
                          <Share2 size={20} className="text-ochre" />
                          {copied ? "Link Copied!" : "Share"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Shop;
