"use client"

import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^\d.]/g, '')); // Clean price string
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };

  const handleProceedToCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {cartItems.length === 0 ? (
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold text-gray-900">Your cart is empty</h1>
            <Link href="/" className="text-lg text-blue-600 hover:underline">Continue shopping</Link>
            
            {!user && (
              <div className="border-t border-gray-200 pt-8 mt-8 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Have an account?</h2>
                <p className="text-gray-700">
                  <Link href="/login" className="text-blue-600 hover:underline">Log in</Link> to check out faster.
                </p>
              </div>
            )}

            {!user && (
              <div className="border-t border-gray-200 pt-8 mt-8 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Subscribe to our emails</h2>
                <form className="flex justify-center">
                  <input
                    type="email"
                    placeholder="Email"
                    className="border border-gray-300 px-4 py-2 rounded-l-md w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-r-md hover:bg-gray-900 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </div>
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
                      <span className="mx-2 px-3 py-1 border border-gray-300 rounded-md text-sm">{isNaN(item.quantity) ? 0 : item.quantity}</span>
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
            <div className="md:col-span-1 bg-gray-50 p-6 rounded-lg shadow-sm h-fit sticky top-20">
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
              <Button onClick={handleProceedToCheckout} className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors mt-6">
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 