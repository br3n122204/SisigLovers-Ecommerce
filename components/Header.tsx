"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, X } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { cartItems } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

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

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Right Section: Search Icon (Mobile), UserProfile and Cart Icon */}
        <div className="flex items-center space-x-4">
          {/* Mobile Search Toggle */}
          <button
            onClick={toggleSearch}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          
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

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden px-4 py-3 border-t border-gray-200">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
} 