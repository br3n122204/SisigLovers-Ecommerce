"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Menu, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link" // Import Link for navigation
import { useCart } from '@/context/CartContext'; // Import useCart hook

// Sample slider images data
const sliderImages = [
  {
    id: 1,
    image: "/images/slider/image1.jpg",
    title: "Street Culture",
    subtitle: "Authentic streetwear for fashion",
  },
  {
    id: 2,
    image: "/images/slider/image2.jpg",
    title: "Urban Style",
    subtitle: "Express your individuality",
  },
  {
    id: 3,
    image: "/images/slider/image3.jpg",
    title: "Modern Fashion",
    subtitle: "Contemporary designs for today",
  },
  {
    id: 4,
    image: "/images/slider/image4.jpg",
    title: "Street Heat",
    subtitle: "Stay raw. Stay real.",
  },
]

// Sample products data
const featuredProducts = [
  {
    id: 1,
    name: "Strap White Tee",
    price: "₱550.00",
    image: "/images/products/strap-white-tee.jpg",
    backImage: "/images/products/strap-white-tee-back.jpg", // Placeholder back image
  },
  {
    id: 2,
    name: "Richboyz White Tee",
    price: "₱550.00",
    image: "/images/products/richboyz-white-tee.jpg",
    backImage: "/images/products/richboyz-white-tee-back.jpg", // Updated back image
  },
  {
    id: 3,
    name: "Charlotte Folk White Tee",
    price: "₱550.00",
    image: "/images/products/charlottefolk-white-tee.jpg",
    backImage: "/images/products/charlottefolk-white-tee-back.jpg", // Updated back image
  },
  {
    id: 4,
    name: "Strap Black Tee",
    price: "₱550.00",
    image: "/images/products/strap-black-tee.jpg",
    backImage: "/images/products/strap-black-tee-back.jpg",
  },
  {
    id: 5,
    name: "MN+LA Black Tee",
    price: "₱550.00",
    image: "/images/products/mnla-black-tee.jpg",
    backImage: "/images/products/mnla-black-tee-back.jpg",
  },
  {
    id: 6,
    name: "Richboyz Black Tee",
    price: "₱550.00",
    image: "/images/products/richboyz-black-tee.jpg",
    backImage: "/images/products/richboyz-black-tee-back.jpg",
  },
  {
    id: 7,
    name: "MN+LA White Tee",
    price: "₱550.00",
    image: "/images/products/mnla-white-tee.jpg",
    backImage: "/images/products/mnla-white-tee-back.jpg",
  },
  {
    id: 8,
    name: "Charlotte Folk Black Tee",
    price: "₱550.00",
    image: "/images/products/charlottefolk-black-tee.jpg",
    backImage: "/images/products/charlottefolk-black-tee-back.jpg",
  },
]

function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
  }

  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-gray-100">
      {/* Slider Images */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderImages.map((slide) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0">
            {/* Blurred background image */}
            <Image
              src={slide.image}
              alt={slide.title} 
              fill
              className="object-cover blur-md scale-110"
            />
            {/* Overlay to dim the blurred background */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            {/* Main, unblurred image (positioned in upper 70%) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[70%] flex items-center justify-center p-4">
              <Image
                src={slide.image}
                alt={slide.title}
                width={500} 
                height={400} 
                className="object-contain max-w-full max-h-full"
              />
            </div>

            {/* Text Overlay (positioned in lower 30%) */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] flex items-center justify-center text-center p-4 z-20">
              <div>
                <h2 className={`text-4xl font-bold mb-2 text-white`}>{slide.title}</h2>
                <p className={`text-lg opacity-90 text-white`}>{slide.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function DPTOneFashion() {
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null)
  const { cartItems } = useCart(); // Use useCart hook

  return (
    <div className="min-h-screen bg-white">
      {/* Black Side Panels */}
      <div className="fixed left-0 top-0 w-16 h-full bg-black z-10"></div>
      <div className="fixed right-0 top-0 w-16 h-full bg-black z-10"></div>

      {/* Main Content Container */}
      <div className="mx-16">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile Menu Button */}
              <div className="flex items-center">
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-black tracking-wider">DPT ONE</h1>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium">
                  Home
                </a>
                <a href="#" className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium">
                  New Arrivals
                </a>
                <a href="#" className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium">
                  Collections
                </a>
                <a href="#" className="text-gray-900 hover:text-gray-600 px-3 py-2 text-sm font-medium">
                  Sale
                </a>
              </nav>

              {/* Auth Buttons */}
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                    Sign Up
                  </Button>
                </Link>
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
          </div>
        </header>

        {/* Hero Section with Image Slider */}
        <section className="relative">
          <ImageSlider />
        </section>

        {/* Featured Products Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Featured Products</h2>
            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} passHref>
                  <Card key={product.id} className="w-full border-2 border-black shadow-none hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div
                        className="aspect-square relative mb-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-100"
                        onMouseEnter={() => setHoveredProduct(product.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <Image
                          src={hoveredProduct === product.id && product.backImage ? product.backImage : product.image}
                          alt={product.name}
                          fill
                          className="absolute inset-0 object-cover block transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <div className="text-center">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm text-gray-400">© 2025 DPT ONE. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
