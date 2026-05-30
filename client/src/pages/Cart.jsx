import React from 'react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex flex-col items-center justify-center bg-cream px-4">
        <ShoppingBag size={80} className="text-ochre/20 mb-6" />
        <h2 className="text-3xl font-serif text-coffee mb-4">Your cart is empty</h2>
        <p className="text-coffee/60 mb-8">Discover our collection and find something beautiful.</p>
        <Link to="/gallery" className="bg-ochre text-coffee px-8 py-3 rounded-full font-serif uppercase tracking-widest hover:bg-ochre/90 transition-all">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 min-h-screen bg-cream px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-12 text-coffee transition-colors duration-300">
          Shopping <span className="text-ochre">Cart</span>
        </h1>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-cream-alt p-6 rounded-lg border border-ochre/10 shadow-sm">
            {cart.items.map((item) => (
              <div key={item.product._id} className="flex flex-col sm:flex-row items-center gap-6 py-6 border-b border-ochre/10 last:border-0">
                <img src={item.product.imageUrl} alt={item.product.name || item.product.category} className="w-24 h-24 object-cover rounded-sm border border-ochre/20" />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-serif text-coffee">{item.product.name || `${item.product.category} ${item.product.weight || ''}`}</h3>
                  <p className="text-ochre text-sm font-medium">₹{(item.product.price || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-4 bg-cream p-2 rounded-full border border-ochre/20">
                  <button onClick={() => updateQuantity(item.product._id, item.quantity - 1)} className="p-1 hover:text-ochre transition-colors"><Minus size={16} /></button>
                  <span className="font-medium text-coffee w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product._id, item.quantity + 1)} className="p-1 hover:text-ochre transition-colors"><Plus size={16} /></button>
                </div>
                <button onClick={() => removeFromCart(item.product._id)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-cream-alt p-8 rounded-lg border border-ochre/10 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <span className="text-coffee/60 uppercase tracking-widest text-sm">Subtotal</span>
              <span className="text-2xl font-serif text-coffee font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-coffee/50 mb-8 italic italic">Note: Prices are based on live market rates and may vary slightly during checkout.</p>
            <Link to="/checkout" className="w-full bg-ochre text-coffee py-4 rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-ochre/90 transition-all shadow-lg">
              Proceed to Checkout <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
