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
                          className="mr-2" style={{ accentColor: '#A75D43' }}
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
                          className="mr-2" style={{ accentColor: '#A75D43' }}
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
            {/* Show 8 Strap products if Strap brand is selected */}
            {selectedBrand === 'Strap' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Strap Products</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      name: 'STRAP BUBBLE LETTERS LOGO TEE RED',
                      image: '/images/products/STRAP BUBBLE LETTERS LOGO TEE RED.png',
                    },
                    {
                      name: 'STRAP EMBROIDERED LOGO POLO SHIRT GREY',
                      image: '/images/products/STRAP EMBROIDERED LOGO POLO SHIRT GREY.png',
                    },
                    {
                      name: 'STRAP FLORAL LOGO TEE BLACK',
                      image: '/images/products/STRAP FLORAL LOGO TEE BLACK.png',
                    },
                    {
                      name: 'STRAP GUARDIAN TEE MOSS GREEN',
                      image: '/images/products/STRAP GUARDIAN TEE MOSS GREEN.png',
                    },
                    {
                      name: 'STRAP PILIPINAS JERSEY S STRIPE',
                      image: '/images/products/STRAP PILIPINAS JERSEY S STRIPE.png',
                    },
                    {
                      name: 'STRAP STONE LOGO TEE BROWN',
                      image: '/images/products/STRAP STONE LOGO TEE BROWN.png',
                    },
                    {
                      name: 'STRAP TFI RIDERS JERSEY',
                      image: '/images/products/STRAP TFI RIDERS JERSEY.png',
                    },
                    {
                      name: 'STRAP THORNS LOGO TEE BLACK',
                      image: '/images/products/STRAP THORNS LOGO TEE BLACK.png',
                    },
                  ].map((product, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300" />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <p className="text-gray-600 mb-2">₱550.00</p>
                          <Button
                            className="w-full mt-2 bg-black text-white hover:bg-gray-800"
                            onClick={() => handleAddToCart({
                              id: 2000 + idx,
                              name: product.name,
                              price: '₱550.00',
                              image: product.image,
                              backImage: product.image,
                              category: 'T-Shirts',
                              brand: 'Strap',
                              color: 'N/A',
                              quantity: 1
                            })}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {/* Show 8 placeholders for other brands */}
            {/* Removed: {selectedBrand && selectedBrand !== 'Strap' && selectedBrand !== 'MN+LA' && selectedBrand !== 'Richboyz' && selectedBrand !== 'Charlotte Folk' && ( ... )} */}
            {/* Show 8 MN+LA products if MN+LA brand is selected */}
            {selectedBrand === 'MN+LA' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">MN+LA Products</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      name: 'CHOKE TEE IN GRAPESANTHRACITE',
                      image: '/images/products/CHOKE TEE IN GRAPESANTHRACITE.png',
                    },
                    {
                      name: 'CHOP CHOP WAFFLE TEE IN FOSSIL',
                      image: '/images/products/CHOP CHOP WAFFLE TEE IN FOSSIL.png',
                    },
                    {
                      name: 'LEAVE ME ALONE TEE IN STONECASTLETON',
                      image: '/images/products/LEAVE ME ALONE TEE IN STONECASTLETON.png',
                    },
                    {
                      name: 'LINEAR TEE IN CANOPY',
                      image: '/images/products/LINEAR TEE IN CANOPY.png',
                    },
                    {
                      name: 'M+ LONGSLEEVE TEEIN OLIVE',
                      image: '/images/products/M+ LONGSLEEVE TEEIN OLIVE.png',
                    },
                    {
                      name: "NAUGHTY N' NICE COCKTAILS LITE TEE IN GLACIER",
                      image: '/images/products/NAUGHTY N\' NICE COCKTAILS LITE TEE IN GLACIER.png',
                    },
                    {
                      name: "UntitledM'$ PAISLEY PATCHWORK MILITIA MOCK NECK",
                      image: "/images/products/UntitledM'$ PAISLEY PATCHWORK MILITIA MOCK NECK.png",
                    },
                    {
                      name: 'YEAR OF THE SNAKE BOX TEE IN ANTHRACITE',
                      image: '/images/products/YEAR OF THE SNAKE BOX TEE IN ANTHRACITE.png',
                    },
                  ].map((product, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300" />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold">MN+LA {product.name}</h3>
                          <p className="text-gray-600 mb-2">₱550.00</p>
                          <Button
                            className="w-full mt-2 bg-black text-white hover:bg-gray-800"
                            onClick={() => handleAddToCart({
                              id: 3000 + idx,
                              name: `MN+LA ${product.name}`,
                              price: '₱550.00',
                              image: product.image,
                              backImage: product.image,
                              category: 'T-Shirts',
                              brand: 'MN+LA',
                              color: 'N/A',
                              quantity: 1
                            })}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {/* Show 8 Richboyz products if Richboyz brand is selected */}
            {selectedBrand === 'Richboyz' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Richboyz Products</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      name: 'Box Tee - Ringer',
                      image: '/images/products/Box Tee - Ringer.png',
                    },
                    {
                      name: 'Box Tee - Swamp',
                      image: '/images/products/Box Tee - Swamp.png',
                    },
                    {
                      name: 'Club Tee - Bloom',
                      image: '/images/products/Club Tee - Bloom.png',
                    },
                    {
                      name: 'Club Tee - Summer',
                      image: '/images/products/Club Tee - Summer.png',
                    },
                    {
                      name: 'Knitted Polo - Leaf',
                      image: '/images/products/Knitted Polo - Leaf.png',
                    },
                    {
                      name: 'Premium Box Tee - Circuit',
                      image: '/images/products/Premium Box Tee - Circuit.png',
                    },
                    {
                      name: 'Premium Box Tee - Grid White_BLACK',
                      image: '/images/products/Premium Box Tee - Grid White_BLACK.png',
                    },
                    {
                      name: 'Premium Box Tee - Grid White',
                      image: '/images/products/Premium Box Tee - Grid White.png',
                    },
                    {
                      name: 'Relaxed Drop Shoulder Tee - Bone',
                      image: '/images/products/Relaxed Drop Shoulder Tee - Bone.png',
                    },
                  ].slice(0, 8).map((product, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300" />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold">Richboyz {product.name}</h3>
                          <p className="text-gray-600 mb-2">₱550.00</p>
                          <Button
                            className="w-full mt-2 bg-black text-white hover:bg-gray-800"
                            onClick={() => handleAddToCart({
                              id: 4000 + idx,
                              name: `Richboyz ${product.name}`,
                              price: '₱550.00',
                              image: product.image,
                              backImage: product.image,
                              category: 'T-Shirts',
                              brand: 'Richboyz',
                              color: 'N/A',
                              quantity: 1
                            })}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {/* Show 8 Charlotte Folk products if Charlotte Folk brand is selected */}
            {selectedBrand === 'Charlotte Folk' && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Charlotte Folk Products</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    {
                      name: 'Basic Hoodie',
                      image: '/images/products/Basic Hoodie.png',
                    },
                    {
                      name: 'CF City Tee',
                      image: '/images/products/CF City Tee.png',
                    },
                    {
                      name: 'CF2018 Tee',
                      image: '/images/products/CF2018 Tee.png',
                    },
                    {
                      name: 'CFSS22 Tee',
                      image: '/images/products/CFSS22 Tee.png',
                    },
                    {
                      name: 'Cherry Regular Tee',
                      image: '/images/products/Cherry Regular Tee.png',
                    },
                    {
                      name: 'Core Tee',
                      image: '/images/products/Core Tee.png',
                    },
                    {
                      name: 'Football CVC Tee',
                      image: '/images/products/Football CVC Tee.png',
                    },
                    {
                      name: 'Koi Tee',
                      image: '/images/products/Koi Tee.png',
                    },
                  ].map((product, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative aspect-square">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-opacity duration-300"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300" />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold">Charlotte Folk {product.name}</h3>
                          <p className="text-gray-600 mb-2">₱550.00</p>
                          <Button
                            className="w-full mt-2 bg-black text-white hover:bg-gray-800"
                            onClick={() => handleAddToCart({
                              id: 5000 + idx,
                              name: `Charlotte Folk ${product.name}`,
                              price: '₱550.00',
                              image: product.image,
                              backImage: product.image,
                              category: 'T-Shirts',
                              brand: 'Charlotte Folk',
                              color: 'N/A',
                              quantity: 1
                            })}
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
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