"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of a product in the cart
interface CartItem {
  id: number;
  name: string;
  image: string;
  price: string; // Or number, depending on how you want to handle currency
  quantity: number;
  selectedSize?: string; // Optional, if products have sizes
}

// Define the shape of the CartContext
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  calculateTotal: () => string;
}

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// CartProvider component to wrap your application
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d.]/g, '')); // Clean price string
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const addToCart = (productToAdd: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.id === productToAdd.id && item.selectedSize === productToAdd.selectedSize);

      if (existingItem) {
        // If item already exists (same ID and size), update quantity
        return prevItems.map(item =>
          item.id === productToAdd.id && item.selectedSize === productToAdd.selectedSize
            ? { ...item, quantity: item.quantity + productToAdd.quantity }
            : item
        );
      } else {
        // Otherwise, add new item
        return [...prevItems, { ...productToAdd, quantity: productToAdd.quantity || 1 }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, quantity) } // Ensure quantity is at least 1
          : item
      )
    );
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, calculateTotal }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the CartContext
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 