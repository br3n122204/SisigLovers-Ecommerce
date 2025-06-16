"use client"

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d.]/g, '')); // Clean price string
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Black Side Panels */}
      <div className="fixed left-0 top-0 w-16 h-full bg-black z-10"></div>
      <div className="fixed right-0 top-0 w-16 h-full bg-black z-10"></div>

      {/* Main Content Container */}
      <div className="mx-16 pt-8 pb-16">
        {/* Back to Home Button */}
        <Link href="/" passHref>
          <Button variant="outline" className="mb-8 border-gray-300 text-gray-700 hover:bg-gray-50">
            ← Back to Home
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-lg text-gray-600">Your cart is empty. <Link href="/" className="text-blue-600 hover:underline">Start shopping!</Link></p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="md:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex items-center space-x-4 border-b border-gray-200 pb-4">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                    {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                    <p className="text-md font-medium text-gray-700">{item.price}</p>
                    <div className="flex items-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        -
                      </Button>
                      <span className="mx-2 px-3 py-1 border border-gray-300 rounded-md text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        +
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="ml-4 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-gray-700">
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
              <Button className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors mt-6">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 