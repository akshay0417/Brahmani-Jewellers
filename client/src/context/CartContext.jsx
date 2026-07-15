import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const location = useLocation();

  // Sync token state synchronously during render if changed in sessionStorage
  const currentToken = sessionStorage.getItem('token');
  if (currentToken !== token) {
    setToken(currentToken);
  }

  useEffect(() => {
    const freshToken = sessionStorage.getItem('token');
    if (freshToken !== token) {
      setToken(freshToken);
    }
  }, [location, token]);

  const fetchCart = async (activeToken) => {
    const t = activeToken || token;
    if (!t) return;
    try {
      const res = await api.get('/cart', { headers: { Authorization: `Bearer ${t}` } });
      setCart(res.data);
    } catch (err) {
      console.error("Error fetching cart", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCart(token);
    } else {
      const localCart = localStorage.getItem('guestCart');
      if (localCart) {
        setCart(JSON.parse(localCart));
      } else {
        setCart({ items: [] });
      }
    }
  }, [token]);

  const addToCart = async (productId, quantity = 1) => {
    const activeToken = sessionStorage.getItem('token') || token;
    if (!activeToken) {
      setLoading(true);
      try {
        const res = await api.get(`/gallery/${productId}`);
        const product = res.data;

        const localCart = localStorage.getItem('guestCart');
        let currentCart = localCart ? JSON.parse(localCart) : { items: [] };

        const existingItemIndex = currentCart.items.findIndex(item => item.product?._id === productId);
        if (existingItemIndex > -1) {
          currentCart.items[existingItemIndex].quantity = 1; // Force quantity to exactly 1
        } else {
          currentCart.items.push({ product, quantity: 1 });
        }

        localStorage.setItem('guestCart', JSON.stringify(currentCart));
        setCart(currentCart);
        setIsCartOpen(true);
      } catch (err) {
        console.error("Error adding to guest cart", err);
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/cart/add', { productId, quantity: 1 }, { headers: { Authorization: `Bearer ${activeToken}` } });
      setCart(res.data);
      setIsCartOpen(true);
    } catch (err) {
      console.error("Error adding to cart", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    const activeToken = sessionStorage.getItem('token') || token;
    if (!activeToken) {
      const localCart = localStorage.getItem('guestCart');
      if (localCart) {
        let currentCart = JSON.parse(localCart);
        const existingItemIndex = currentCart.items.findIndex(item => item.product?._id === productId);
        if (existingItemIndex > -1) {
          if (quantity <= 0) {
            currentCart.items.splice(existingItemIndex, 1);
          } else {
            currentCart.items[existingItemIndex].quantity = 1; // Force quantity to exactly 1
          }
          localStorage.setItem('guestCart', JSON.stringify(currentCart));
          setCart(currentCart);
        }
      }
      return;
    }
    try {
      const res = await api.put('/cart/update', { productId, quantity: quantity <= 0 ? 0 : 1 }, { headers: { Authorization: `Bearer ${activeToken}` } });
      setCart(res.data);
    } catch (err) {
      console.error("Error updating quantity", err);
    }
  };

  const removeFromCart = async (productId) => {
    const activeToken = sessionStorage.getItem('token') || token;
    if (!activeToken) {
      const localCart = localStorage.getItem('guestCart');
      if (localCart) {
        let currentCart = JSON.parse(localCart);
        currentCart.items = currentCart.items.filter(item => item.product?._id !== productId);
        localStorage.setItem('guestCart', JSON.stringify(currentCart));
        setCart(currentCart);
      }
      return;
    }
    try {
      const res = await api.delete(`/cart/remove/${productId}`, { headers: { Authorization: `Bearer ${activeToken}` } });
      setCart(res.data);
    } catch (err) {
      console.error("Error removing from cart", err);
    }
  };

  const clearCart = () => {
    localStorage.removeItem('guestCart');
    setCart({ items: [] });
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
    if (product.price) return Math.round(Number(product.price) * 1.03);
    if (!rates || !product.weight || !product.purity) return 0;

    let ratePerGram = 0;
    const p = (product.purity || '').toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('92.5') || p.includes('925')) ratePerGram = (rates.silver90 / 1000) * (92.5 / 90);
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
      clearCart,
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
