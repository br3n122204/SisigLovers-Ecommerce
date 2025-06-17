"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

// All products data - In a real application, this would come from a database
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
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const initialBrand = searchParams.get('brand') || ''
  const [filteredProducts, setFilteredProducts] = useState(allProducts)
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [priceRange, setPriceRange] = useState<string>('')
  
  const { cartItems, addToCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  // Get unique brands and colors for filters
  const brands = [...new Set(allProducts.map(product => product.brand))]
  const colors = [...new Set(allProducts.map(product => product.color))]

  useEffect(() => {
    let results = allProducts

    // Filter by search query
    if (query) {
      results = results.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.color.toLowerCase().includes(query.toLowerCase())
      )
    }

    // Filter by brand
    if (selectedBrand) {
      results = results.filter(product => product.brand === selectedBrand)
    }

    // Filter by color
    if (selectedColor) {
      results = results.filter(product => product.color === selectedColor)
    }

    // Filter by price range
    if (priceRange) {
      const price = parseFloat(priceRange)
      results = results.filter(product => {
        const productPrice = parseFloat(product.price.replace(/[^\d.]/g, ''))
        return productPrice <= price
      })
    }

    setFilteredProducts(results)
  }, [query, selectedBrand, selectedColor, priceRange, searchParams])

  const handleAddToCart = (product: any) => {
    if (!user) {
      router.push('/login')
      return
    }
    addToCart(product)
  }

  const clearFilters = () => {
    setSelectedBrand('')
    setSelectedColor('')
    setPriceRange('')
  }

  const hasActiveFilters = selectedBrand || selectedColor || priceRange

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

        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {query ? `Search Results for "${query}"` : 'All Products'}
              </h1>
              <p className="text-gray-600 mt-2">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedBrand && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  Brand: {selectedBrand}
                  <button
                    onClick={() => setSelectedBrand('')}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedColor && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  Color: {selectedColor}
                  <button
                    onClick={() => setSelectedColor('')}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {priceRange && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  Max Price: ₱{priceRange}
                  <button
                    onClick={() => setPriceRange('')}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                
                {/* Brand Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Brand</h4>
                  <div className="space-y-2">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="radio"
                          name="brand"
                          value={brand}
                          checked={selectedBrand === brand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Color</h4>
                  <div className="space-y-2">
                    {colors.map(color => (
                      <label key={color} className="flex items-center">
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          checked={selectedColor === color}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Max Price</h4>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Any price</option>
                    <option value="500">₱500 or less</option>
                    <option value="550">₱550 or less</option>
                    <option value="600">₱600 or less</option>
                    <option value="1000">₱1000 or less</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="relative aspect-square"
                        onMouseEnter={() => setHoveredProduct(product.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <Image
                          src={hoveredProduct === product.id ? product.backImage : product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-opacity duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
                        <p className="text-gray-600">{product.price}</p>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full mt-2 bg-black text-white hover:bg-gray-800"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 