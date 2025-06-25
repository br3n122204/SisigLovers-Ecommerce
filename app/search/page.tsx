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
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const initialBrand = searchParams.get('brand') || ''
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [priceRange, setPriceRange] = useState<string>('')
  
  const { cartItems, addToCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      let q = collection(db, 'products');
      let qRef = q;
      if (selectedBrand) {
        qRef = query(q, where('brand', '==', selectedBrand));
      }
      const querySnapshot = await getDocs(qRef);
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(items);
    };
    fetchProducts();
  }, [selectedBrand]);

  // Filter products by search, color, price
  useEffect(() => {
    let results = products;
    // Filter by search query
    if (queryParam) {
      results = results.filter(product =>
        product.name.toLowerCase().includes(queryParam.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(queryParam.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(queryParam.toLowerCase())) ||
        (product.color && product.color.toLowerCase().includes(queryParam.toLowerCase()))
      );
    }
    // Filter by color
    if (selectedColor) {
      results = results.filter(product => product.color === selectedColor)
    }
    // Filter by price range
    if (priceRange) {
      const price = parseFloat(priceRange)
      results = results.filter(product => {
        const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price.replace(/[^\d.]/g, ''))
        return productPrice <= price
      })
    }
    setFilteredProducts(results)
  }, [products, queryParam, selectedColor, priceRange, searchParams])

  // Get unique brands and colors for filters
  const brands = [...new Set(products.map(product => product.brand))]
  const colors = [...new Set(products.map(product => product.color))]

  // Sync selectedBrand with brand query param from URL
  useEffect(() => {
    setSelectedBrand(initialBrand);
  }, [initialBrand]);

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
      {/* Main Content Container */}
      <div className="w-full pt-8 pb-16">
        {/* Back to Home Button */}
        <Link href="/" passHref>
          <Button variant="outline" className="mb-8 border-gray-300 text-gray-700 hover:bg-gray-50">
            ← Back to Home
          </Button>
        </Link>

        {/* Search Header */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">All Products</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>
            <span className="text-gray-500 text-sm">{filteredProducts.length} products found</span>
          </div>
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
                  <input
                    type="number"
                    className="w-full px-2 py-1 border border-gray-300 rounded"
                    value={priceRange}
                    onChange={e => setPriceRange(e.target.value)}
                    placeholder="e.g. 1000"
                  />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product, idx) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="relative aspect-square"
                        onMouseEnter={() => setHoveredProduct(product.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        {/* Only render Image if src is a non-empty string, otherwise use placeholder */}
                        {product.imageUrls && product.imageUrls.length > 0 && product.imageUrls[0] ? (
                          <Image
                            src={product.imageUrls[0]}
                            alt={product.name}
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                        ) : (
                          <Image
                            src="/images/placeholder.jpg"
                            alt="No image"
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300" />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-gray-600 mb-2">₱{product.price}</p>
                        <Button
                          className="w-full mt-2 bg-black text-white hover:bg-gray-800"
                          onClick={() => handleAddToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : "/images/placeholder.jpg",
                            quantity: 1,
                            brand: product.brand
                          })}
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