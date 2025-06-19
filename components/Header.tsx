"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, X, ChevronDown } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useCart } from '@/context/CartContext';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

// All products data - In a real application, this would come from a database or a shared utility
const allProducts = [
  {
    id: 1,
    name: "Strap White Tee",
    price: "₱550.00",
    image: "/images/products/strap-white-tee.jpg",
    backImage: "/images/products/strap-white-tee-back.jpg",
    category: "T-Shirts",
    brand: "Strap",
    color: "White",
  },
  {
    id: 2,
    name: "Richboyz White Tee",
    price: "₱550.00",
    image: "/images/products/richboyz-white-tee.jpg",
    backImage: "/images/products/richboyz-white-tee-back.jpg",
    category: "T-Shirts",
    brand: "Richboyz",
    color: "White",
  },
  {
    id: 3,
    name: "Charlotte Folk White Tee",
    price: "₱550.00",
    image: "/images/products/charlottefolk-white-tee.jpg",
    backImage: "/images/products/charlottefolk-white-tee-back.jpg",
    category: "T-Shirts",
    brand: "Charlotte Folk",
    color: "White",
  },
  {
    id: 4,
    name: "Strap Black Tee",
    price: "₱550.00",
    image: "/images/products/strap-black-tee.jpg",
    backImage: "/images/products/strap-black-tee-back.jpg",
    category: "T-Shirts",
    brand: "Strap",
    color: "Black",
  },
  {
    id: 5,
    name: "MN+LA Black Tee",
    price: "₱550.00",
    image: "/images/products/mnla-black-tee.jpg",
    backImage: "/images/products/mnla-black-tee-back.jpg",
    category: "T-Shirts",
    brand: "MN+LA",
    color: "Black",
  },
  {
    id: 6,
    name: "Richboyz Black Tee",
    price: "₱550.00",
    image: "/images/products/richboyz-black-tee.jpg",
    backImage: "/images/products/richboyz-black-tee-back.jpg",
    category: "T-Shirts",
    brand: "Richboyz",
    color: "Black",
  },
  {
    id: 7,
    name: "MN+LA White Tee",
    price: "₱550.00",
    image: "/images/products/mnla-white-tee.jpg",
    backImage: "/images/products/mnla-white-tee-back.jpg",
    category: "T-Shirts",
    brand: "MN+LA",
    color: "White",
  },
  {
    id: 8,
    name: "Charlotte Folk Black Tee",
    price: "₱550.00",
    image: "/images/products/charlottefolk-black-tee.jpg",
    backImage: "/images/products/charlottefolk-black-tee-back.jpg",
    category: "T-Shirts",
    brand: "Charlotte Folk",
    color: "Black",
  },
];

export default function Header() {
  const { cartItems } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const pathname = usePathname();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSuggestions(true);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Left Section: Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="Sisig Lovers Logo"
              width={60}
              height={60}
              className="h-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex space-x-6 text-sm font-medium text-gray-700">
            {/* Shop by Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="flex items-center space-x-1 hover:text-gray-900 focus:outline-none"
              >
                <span>Shop by Brand</span>
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div className={`absolute ${isBrandDropdownOpen ? 'block' : 'hidden'} bg-white shadow-lg rounded-md py-1 mt-2 w-40 z-20`}>
                <Link href="/search?brand=MN%2BLA" className="block px-4 py-2 hover:bg-gray-100">MN+LA</Link>
                <Link href="/search?brand=Charlotte%20Folk" className="block px-4 py-2 hover:bg-gray-100">Charlotte Folk</Link>
                <Link href="/search?brand=Strap" className="block px-4 py-2 hover:bg-gray-100">Strap</Link>
                <Link href="/search?brand=Richboyz" className="block px-4 py-2 hover:bg-gray-100">Richboyz</Link>
              </div>
            </div>
            {user && (
              <Link href="/orders" className="hover:text-gray-900">Orders</Link>
            )}
          </nav>
        </div>

        {/* Center Section: Search Bar (hidden on /profile and /cart) */}
        {!(pathname === '/profile' || pathname === '/cart' || pathname === '/settings') && (
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                className="w-full px-5 py-2.5 pl-12 pr-5 border-2 border-gray-300 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 ease-in-out shadow-md"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-700 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Search Suggestions Dropdown (Desktop) */}
              {showSuggestions && searchQuery.length > 0 && searchResults.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                  <p className="px-4 py-2 text-xs text-gray-500 uppercase font-bold">Products</p>
                  {searchResults.map((product) => (
                    <Link href={`/products/${product.id}`} key={product.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <Image src={product.image} alt={product.name} width={40} height={40} className="mr-3 rounded" />
                      <span className="text-sm font-medium text-gray-800">{product.name}</span>
                    </Link>
                  ))}
                  <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="block px-4 py-3 bg-gray-50 text-blue-600 hover:bg-gray-100 text-sm font-medium text-center border-t border-gray-200">
                    Search for "{searchQuery}"
                  </Link>
                </div>
              )}
            </form>
          </div>
        )}

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

      {/* Mobile Search Bar (hidden on /profile and /cart) */}
      {isSearchOpen && !(pathname === '/profile' || pathname === '/cart' || pathname === '/settings') && (
        <div className="md:hidden px-4 py-3 border-t border-gray-200">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              className="w-full px-5 py-2.5 pl-12 pr-5 border-2 border-gray-300 rounded-full bg-gray-100 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 transition-all duration-300 ease-in-out shadow-md"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600" />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-blue-700 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Search Suggestions Dropdown (Mobile) */}
            {showSuggestions && searchQuery.length > 0 && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                <p className="px-4 py-2 text-xs text-gray-500 uppercase font-bold">Products</p>
                {searchResults.map((product) => (
                  <Link href={`/products/${product.id}`} key={product.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <Image src={product.image} alt={product.name} width={40} height={40} className="mr-3 rounded" />
                    <span className="text-sm font-medium text-gray-800">{product.name}</span>
                  </Link>
                ))}
                <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="block px-4 py-3 bg-gray-50 text-blue-600 hover:bg-gray-100 text-sm font-medium text-center border-t border-gray-200">
                  Search for "{searchQuery}"
                </Link>
              </div>
            )}
          </form>
        </div>
      )}
    </header>
  );
} 