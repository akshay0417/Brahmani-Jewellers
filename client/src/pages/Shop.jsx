import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Heart, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Shop = () => {
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [rates, setRates] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, ratesRes] = await Promise.all([
          api.get('/gallery'),
          api.get('/rates')
        ]);
        setItems(itemsRes.data.filter(item => item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage));
        setRates(ratesRes.data);
      } catch (err) {
        console.error("Error fetching shop items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculatePrice = (item) => {
    if (item.price) return { final: item.price, breakdown: null };
    if (!rates || !item.weight || !item.purity) return { final: 0, breakdown: null };

    let ratePer10g = 0;
    if (item.purity === '24K') ratePer10g = rates.gold24K;
    else if (item.purity === '22K') ratePer10g = rates.gold22K;
    else if (item.purity === '18K') ratePer10g = rates.gold18K;
    else if (item.purity === '90%') ratePer10g = rates.silver90;

    if (!ratePer10g) return { final: 0, breakdown: null };

    const weight = parseFloat(item.weight);
    const basePrice = (ratePer10g / 10) * weight;
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

  const shopCategories = ['all', 'gold', 'silver', 'antique', 'rudraksha'];
  const filteredItems = filter === 'all' ? items : items.filter(item => item.category === filter);

  const ProductCard = ({ item }) => {
    const priceData = calculatePrice(item);
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -8 }}
        className="royal-card rounded-xl overflow-hidden group cursor-pointer"
        onClick={() => setSelectedProduct(item)}
      >
        <div className="aspect-[3/4] overflow-hidden relative bg-cream-alt">
          <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button onClick={(e) => { e.stopPropagation(); /* Wishlist logic */ }} className="p-2 bg-cream/80 backdrop-blur-md rounded-full text-coffee hover:text-ochre transition-colors">
              <Heart size={18} />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-coffee/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(item._id); }}
              className="w-full py-2 bg-ochre text-coffee font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded-sm hover:bg-ochre/90"
            >
              <ShoppingBag size={14} /> Quick Add
            </button>
          </div>
        </div>
        <div className="p-5 text-center">
          <span className="text-[10px] text-ochre uppercase tracking-[0.2em] font-bold mb-1 block">{item.category} Collection</span>
          <h3 className="font-serif text-lg text-coffee mb-2 tracking-wide">Heritage Masterpiece</h3>
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xl font-bold text-coffee">₹{priceData.final.toLocaleString('en-IN')}</span>
            {priceData.breakdown && <span className="text-[10px] text-coffee/50 uppercase tracking-widest">(Incl. 3% GST)</span>}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-48 pb-24 px-4 bg-cream min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-ochre tracking-[0.5em] uppercase text-xs font-bold mb-4 block">Luxury Showroom</motion.span>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-coffee mb-6">Royal <span className="text-ochre italic">Showcase</span></h1>
          <div className="w-24 h-1 bg-ochre mx-auto mb-8"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {shopCategories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={`px-10 py-3 rounded-full border border-ochre/20 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${filter === cat ? 'bg-ochre text-coffee border-ochre shadow-lg' : 'text-coffee hover:bg-ochre/10'}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[{ icon: ShieldCheck, text: "Certified Purity" }, { icon: Truck, text: "Secure Delivery" }, { icon: ShoppingBag, text: "Luxury Packaging" }, { icon: Heart, text: "Lifetime Trust" }].map((feature, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-6 bg-cream-alt rounded-xl border border-ochre/10">
              <feature.icon className="text-ochre mb-3" size={24} />
              <span className="text-[10px] uppercase tracking-widest text-coffee font-bold">{feature.text}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-ochre border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">{filteredItems.map(item => <ProductCard key={item._id} item={item} />)}</AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-coffee/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-cream max-w-5xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative flex flex-col md:flex-row scrollbar-hide" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 z-10 p-2 bg-coffee/10 hover:bg-ochre hover:text-cream rounded-full transition-all"><X size={24} /></button>
              <div className="w-full md:w-1/2 bg-cream-alt"><img src={selectedProduct.imageUrl} alt="Product" className="w-full h-full object-contain" /></div>
              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
                <span className="text-ochre tracking-[0.3em] uppercase text-xs font-bold mb-2 block">{selectedProduct.category} Collection</span>
                <h2 className="text-4xl font-serif font-bold text-coffee mb-4">Royal Heritage Ornament</h2>
                <div className="w-12 h-1 bg-ochre mb-6"></div>
                
                {(() => {
                  const pData = calculatePrice(selectedProduct);
                  return (
                    <>
                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between border-b border-ochre/10 py-2"><span className="text-xs uppercase tracking-widest text-coffee/60 font-bold">Category</span><span className="text-sm font-serif text-coffee capitalize">{selectedProduct.category}</span></div>
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
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={() => { addToCart(selectedProduct._id); setSelectedProduct(null); }} className="flex-1 py-4 bg-coffee text-cream font-bold uppercase tracking-widest rounded-sm hover:bg-coffee/90 transition-all flex items-center justify-center gap-3"><ShoppingBag size={20} /> Add to Cart</button>
                        <a href={`https://wa.me/917621967577?text=${encodeURIComponent("I am interested in buying this masterpiece: " + selectedProduct.imageUrl + "\nFinal Price: ₹" + pData.final)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-ochre text-coffee font-bold uppercase tracking-widest rounded-sm hover:bg-ochre/90 transition-all flex items-center justify-center gap-3">Buy via WhatsApp</a>
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
