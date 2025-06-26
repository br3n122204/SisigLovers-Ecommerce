"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Search, X, ChevronDown } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useCart } from '@/context/CartContext';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ADMIN_UID = "1BeqoY3h5gTa4LBUsAiaDLHHhnT2";

export default function Header() {
  const { cartItems } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Check if we're on the admin page
  const isAdminPage = pathname === '/admin';
  const isAdmin = user && user.uid === ADMIN_UID;

  // Fetch all products from Firestore once on mount
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'adminProducts'));
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllProducts(items);
    };
    fetchProducts();
  }, []);

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
        product.name && product.name.toLowerCase().includes(query.toLowerCase())
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
    <header className="bg-[#A75D43] border-b border-[#c98a6a] py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8 w-full md:w-auto md:flex-1">
          <Link href="/" className="flex items-center mr-4">
            <Image
              src="/images/logo.png"
              alt="Sisig Lovers Logo"
              width={60}
              height={60}
              className="h-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-white">
            {/* Shop by Brand Dropdown */}
            {!isAdminPage && (
              <div className="relative">
                <button
                  onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                  className="flex items-center space-x-1 hover:text-[#fff9f3] focus:outline-none"
                >
                  <span>Shop by Brand</span>
                  <ChevronDown
                    className={`h-4 w-4 transform transition-transform duration-200 ${isBrandDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`absolute ${isBrandDropdownOpen ? 'block' : 'hidden'} bg-[#A75D43] shadow-lg rounded-md py-1 mt-2 w-40 z-20`}>
                  <button type="button" className="block w-full text-left px-4 py-2 text-white hover:bg-[#c98a6a] hover:text-white" onClick={() => { router.push('/search?brand=MN%2BLA'); setIsBrandDropdownOpen(false); }}>MN+LA</button>
                  <button type="button" className="block w-full text-left px-4 py-2 text-white hover:bg-[#c98a6a] hover:text-white" onClick={() => { router.push('/search?brand=Charlotte%20Folk'); setIsBrandDropdownOpen(false); }}>Charlotte Folk</button>
                  <button type="button" className="block w-full text-left px-4 py-2 text-white hover:bg-[#c98a6a] hover:text-white" onClick={() => { router.push('/search?brand=Strap'); setIsBrandDropdownOpen(false); }}>Strap</button>
                  <button type="button" className="block w-full text-left px-4 py-2 text-white hover:bg-[#c98a6a] hover:text-white" onClick={() => { router.push('/search?brand=Richboyz'); setIsBrandDropdownOpen(false); }}>Richboyz</button>
                </div>
              </div>
            )}
            {user && !isAdminPage && !isAdmin && (
              <Link href="/orders" className="hover:text-[#fff9f3]">Orders</Link>
            )}
            {!isAdminPage && (
              (!user || user.email === "sisiglovers@gmail.com") && (
                <Link href="/admin" className="hover:text-[#fff9f3] text-white font-semibold">Admin Dashboard</Link>
              )
            )}
          </nav>
        </div>
        {/* Centered Search Bar - improved centering and spacing */}
        <div className="w-full md:w-[600px] flex justify-center my-4 md:my-0 order-2 md:order-none">
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              className="w-full px-5 py-2.5 pl-12 pr-5 border-2 border-[#c98a6a] rounded-full bg-[#f5f2ef] text-[#222] placeholder-[#A75D43] focus:outline-none focus:ring-3 focus:ring-[#A75D43] focus:border-[#A75D43] transition-all duration-300 ease-in-out shadow-md text-base"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#A75D43]" />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A75D43] hover:text-[#fff9f3] transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Search Suggestions Dropdown (Desktop) */}
            {showSuggestions && searchQuery.length > 0 && searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                <p className="px-4 py-2 text-xs text-gray-500 uppercase font-bold">Products</p>
                {searchResults.map((product) => {
                  let productImg = '/images/placeholder.jpg';
                  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
                    productImg = product.imageUrls[0];
                  } else if (product.image) {
                    productImg = product.image;
                  } else if (product.imageUrl) {
                    productImg = product.imageUrl;
                  }
                  return (
                    <Link href={`/products/${product.id}`} key={product.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <Image
                        src={productImg}
                        alt={product.name || 'Product'}
                        width={40}
                        height={40}
                        className="mr-3 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800">{product.name}</span>
                    </Link>
                  );
                })}
                <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="block px-4 py-3 bg-gray-50 text-blue-600 hover:bg-gray-100 text-sm font-medium text-center border-t border-gray-200">
                  Search for "{searchQuery}"
                </Link>
              </div>
            )}
          </form>
        </div>
        {/* Right Section: User/Cart/Profile */}
        {!isAdminPage && !isAdmin && (
          <div className="flex items-center space-x-4">
            <UserProfile />
            <Link href="/cart" className="relative flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-gray-900 transition-colors" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Search Bar (hidden on /profile, /cart, /settings, and /admin) */}
      {isSearchOpen && !(pathname === '/profile' || pathname === '/cart' || pathname === '/settings' || pathname === '/checkout' || isAdminPage) && (
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
                {searchResults.map((product) => {
                  let productImg = '/images/placeholder.jpg';
                  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
                    productImg = product.imageUrls[0];
                  } else if (product.image) {
                    productImg = product.image;
                  } else if (product.imageUrl) {
                    productImg = product.imageUrl;
                  }
                  return (
                    <Link href={`/products/${product.id}`} key={product.id} className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                      <Image
                        src={productImg}
                        alt={product.name || 'Product'}
                        width={40}
                        height={40}
                        className="mr-3 rounded"
                      />
                      <span className="text-sm font-medium text-gray-800">{product.name}</span>
                    </Link>
                  );
                })}
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