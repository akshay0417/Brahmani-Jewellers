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

  const [rates, setRates] = useState(null);

  const fetchRates = async () => {
    try {
      const res = await api.get('/rates');
      setRates(res.data);
    } catch (err) {
      console.error("Error fetching rates in CartContext", err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const calculatePrice = (product) => {
    if (!product) return 0;
    if (product.price) return product.price;
    if (!rates || !product.weight || !product.purity) return 0;

    let ratePerGram = 0;
    const p = (product.purity || '').toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('90') || p.includes('SILVER')) ratePerGram = rates.silver90 / 1000;

    if (!ratePerGram) return 0;

    const weight = parseFloat(product.weight);
    const basePrice = ratePerGram * weight;
    const makingPercent = product.makingCharges || 0;
    const makingAmount = basePrice * (makingPercent / 100);
    const other = product.otherCharges || 0;
    const subtotal = basePrice + makingAmount + other;
    const gst = subtotal * 0.03;
    return Math.round(subtotal + gst);
  };

  const cartItems = cart.items.map(item => {
    if (!item.product) return item;
    const calculatedPrice = calculatePrice(item.product);
    return {
      ...item,
      product: {
        ...item.product,
        price: calculatedPrice || item.product.price || 0
      }
    };
  });

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.product.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart: { ...cart, items: cartItems }, 
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
