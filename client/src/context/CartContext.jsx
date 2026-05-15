import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const token = sessionStorage.getItem('token');
  const config = token ? { headers: { Authorization: `Bearer ${token}` } } : null;

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await api.get('/cart', config);
      setCart(res.data);
    } catch (err) {
      console.error("Error fetching cart", err);
    }
  };

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      alert("Please login to add items to cart");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/cart/add', { productId, quantity }, config);
      setCart(res.data);
      setIsCartOpen(true);
    } catch (err) {
      console.error("Error adding to cart", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await api.put('/cart/update', { productId, quantity }, config);
      setCart(res.data);
    } catch (err) {
      console.error("Error updating quantity", err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await api.delete(`/cart/remove/${productId}`, config);
      setCart(res.data);
    } catch (err) {
      console.error("Error removing from cart", err);
    }
  };

  const cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.items.reduce((total, item) => total + (item.product.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      updateQuantity, 
      removeFromCart, 
      cartCount, 
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      loading 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
