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
  color?: string; // Optional, if products have colors
}

// Define the shape of the CartContext
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  calculateTotal: () => string;
  clearCart: () => void;
  isCartSyncing: boolean;
  removeFromCartByIds: (ids: (number | string)[]) => void;
}

// Create the context with a default undefined value
const CartContext = createContext<CartContextType | undefined>(undefined);

// CartProvider component to wrap your application
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartSyncing, setIsCartSyncing] = useState(false);

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

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      let price: number;
      if (typeof item.price === 'string') {
        price = parseFloat(item.price.replace(/[^\d.]/g, ''));
      } else {
        price = Number(item.price);
      }
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
      // Only update the changed item in Firestore
      if (user) {
        const cartRef = collection(db, 'cartProducts', user.uid, 'items');
        const docRef = doc(cartRef, `${productToAdd.id}-${productToAdd.selectedSize || 'default'}`);
        setDoc(docRef, { ...productToAdd, quantity: existingItem ? (existingItem.quantity + productToAdd.quantity) : (productToAdd.quantity || 1) });
      }
      return newItems;
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) => {
      const itemToRemove = prevItems.find(item => item.id === productId);
      const newItems = prevItems.filter(item => item.id !== productId);
      if (user && itemToRemove) {
        const cartRef = collection(db, 'cartProducts', user.uid, 'items');
        const docRef = doc(cartRef, `${itemToRemove.id}-${itemToRemove.selectedSize || 'default'}`);
        deleteDoc(docRef);
      }
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
      // Only update the changed item in Firestore
      if (user) {
        const updatedItem = newItems.find(item => item.id === productId);
        if (updatedItem) {
          const cartRef = collection(db, 'cartProducts', user.uid, 'items');
          const docRef = doc(cartRef, `${updatedItem.id}-${updatedItem.selectedSize || 'default'}`);
          setDoc(docRef, updatedItem);
        }
      }
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      const cartRef = collection(db, 'cartProducts', user.uid, 'items');
      // Remove all docs in the cart
      // (optional: you could optimize this with a batch delete)
      // For now, just rely on onSnapshot to clear UI
    }
  };

  const removeFromCartByIds = (ids: (number | string)[]) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.filter(item => !ids.includes(item.id));
      if (user) {
        const cartRef = collection(db, 'cartProducts', user.uid, 'items');
        prevItems.forEach(item => {
          if (ids.includes(item.id)) {
            const docRef = doc(cartRef, `${item.id}-${item.selectedSize || 'default'}`);
            deleteDoc(docRef);
          }
        });
      }
      return newItems;
    });
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, calculateTotal, clearCart, isCartSyncing, removeFromCartByIds }}>
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