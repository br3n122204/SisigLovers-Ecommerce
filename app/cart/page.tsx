"use client"

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, isCartSyncing } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [removingItemIds, setRemovingItemIds] = useState<number[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  useEffect(() => {
    // By default, select all items when cart changes
    setSelectedItemIds(cartItems.map(item => item.id));
  }, [cartItems]);

  const handleSelectItem = (id: number) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const selectedCartItems = cartItems.filter(item => selectedItemIds.includes(item.id));

  const calculateTotal = () => {
    return selectedCartItems.reduce((total, item) => {
      let price: number;
      if (typeof item.price === 'string') {
        price = parseFloat(item.price.replace(/[^\d.]/g, ''));
      } else {
        price = Number(item.price);
      }
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleProceedToCheckout = () => {
    if (selectedCartItems.length === 0) return;
    // Pass selected item IDs to checkout page as a query string
    router.push(`/checkout?selected=${selectedItemIds.join(',')}`);
  };

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      // Do nothing if trying to go below 1
      return;
    }
    updateQuantity(id, newQuantity);
  };

  const handleRemoveFromCart = (id: number) => {
    setRemovingItemIds((prev) => [...prev, id]);
    setTimeout(() => {
      removeFromCart(id);
      setRemovingItemIds((prev) => prev.filter((itemId) => itemId !== id));
    }, 300);
  };

  // Determine if all, some, or none are selected
  const allSelected = cartItems.length > 0 && selectedItemIds.length === cartItems.length;
  const someSelected = selectedItemIds.length > 0 && selectedItemIds.length < cartItems.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map(item => item.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA]">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {cartItems.length === 0 && removingItemIds.length === 0 && !isCartSyncing ? (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold text-[#60A5FA]">Your cart is empty</h1>
            <Link href="/" className="text-lg text-[#60A5FA] hover:underline">Continue shopping</Link>
            
            {!user && (
              <div className="border-t border-gray-200 pt-8 mt-8 space-y-4">
                <h2 className="text-xl font-bold text-[#60A5FA]">Have an account?</h2>
                <p className="text-[#60A5FA]">
                  <Link href="/login" className="text-[#60A5FA] hover:underline">Log in</Link> to check out faster.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="md:col-span-2 space-y-6">
              {/* Select All Checkbox */}
              {cartItems.length > 0 && (
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={handleSelectAll}
                    className="mr-2 accent-[#60A5FA] w-5 h-5"
                  />
                  <span className="text-[#60A5FA] font-medium">Select All</span>
                </div>
              )}
              {cartItems.map((item) => (
                <div
                  key={`${item.id}-${typeof item.selectedSize === 'object' && item.selectedSize !== null ? JSON.stringify(item.selectedSize) : item.selectedSize}`}
                  className={`flex items-center space-x-4 border-b border-[#60A5FA] pb-4 transition-opacity duration-300 ${removingItemIds.includes(item.id) ? 'opacity-30 pointer-events-none' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="mr-2 accent-[#60A5FA] w-5 h-5"
                  />
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center bg-[#19223a] text-[#60A5FA] text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-lg font-semibold text-[#60A5FA]">{item.name}</h2>
                    {item.selectedSize && (
                      <p className="text-sm text-[#60A5FA]">
                        Size: {typeof item.selectedSize === 'object' ? ((item.selectedSize as any).size ?? JSON.stringify(item.selectedSize)) : item.selectedSize}
                      </p>
                    )}
                    <p className="text-md font-medium text-[#60A5FA]">{item.price}</p>
                    <div className="flex items-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a]"
                        disabled={removingItemIds.includes(item.id)}
                      >
                        -
                      </Button>
                      <span className="mx-2 px-3 py-1 border border-[#60A5FA] rounded-md text-sm text-[#60A5FA]">{isNaN(item.quantity) ? 0 : item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a]"
                        disabled={removingItemIds.includes(item.id)}
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="ml-4 text-red-600 hover:bg-red-50"
                        disabled={removingItemIds.includes(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="md:col-span-1 bg-[#19223a] p-6 rounded-lg shadow-sm h-fit sticky top-20">
              <h2 className="text-xl font-bold text-[#60A5FA] mb-4">Order Summary</h2>
              <div className="space-y-2 text-[#60A5FA]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₱{calculateTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₱0.00</span> {/* For now, assuming free shipping */}
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 border-gray-200">
                  <span>Total</span>
                  <span>₱{calculateTotal()}</span>
                </div>
              </div>
              <Button onClick={handleProceedToCheckout} className="w-full bg-[#60A5FA] text-[#101828] py-3 rounded-md hover:bg-[#3380c0] transition-colors mt-6">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 