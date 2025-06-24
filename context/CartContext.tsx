"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';

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
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from Firestore on login
  React.useEffect(() => {
    if (user) {
      const cartRef = collection(db, 'cartProducts', user.uid, 'items');
      const unsubscribe = onSnapshot(cartRef, (snapshot) => {
        const items: CartItem[] = [];
        snapshot.forEach(doc => items.push(doc.data() as CartItem));
        setCartItems(items);
      });
      return () => unsubscribe();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const syncCartToFirestore = async (items: CartItem[]) => {
    if (!user) return;
    const cartRef = collection(db, 'cartProducts', user.uid, 'items');
    // Remove all docs first (simple sync)
    const existing = await getDocs(cartRef);
    await Promise.all(existing.docs.map(docSnap => deleteDoc(docSnap.ref)));
    // Add all items
    await Promise.all(items.map(item => setDoc(doc(cartRef, `${item.id}-${item.selectedSize || 'default'}`), item)));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d.]/g, '')); // Clean price string
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const addToCart = (productToAdd: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.id === productToAdd.id && item.selectedSize === productToAdd.selectedSize);
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(item =>
          item.id === productToAdd.id && item.selectedSize === productToAdd.selectedSize
            ? { ...item, quantity: item.quantity + productToAdd.quantity }
            : item
        );
      } else {
        newItems = [...prevItems, { ...productToAdd, quantity: productToAdd.quantity || 1 }];
      }
      if (user) syncCartToFirestore(newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.filter(item => item.id !== productId);
      if (user) syncCartToFirestore(newItems);
      return newItems;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      );
      if (user) syncCartToFirestore(newItems);
      return newItems;
    });
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