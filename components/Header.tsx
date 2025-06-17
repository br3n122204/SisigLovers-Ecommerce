"use client";

import Link from 'next/link';
import { ShoppingCart } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { cartItems } = useCart();

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Left Section: Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-black tracking-wider">DPT ONE</Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
            <Link href="/shop" className="hover:text-gray-900">Shop</Link>
            <Link href="/orders" className="hover:text-gray-900">Orders</Link>
          </nav>
        </div>

        {/* Right Section: UserProfile and Cart Icon */}
        <div className="flex items-center space-x-4">
          <UserProfile />
          {/* Cart Icon */}
          <Link href="/cart" className="relative flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-gray-900 transition-colors" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
} 