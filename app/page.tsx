"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

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

// HERO / SLIDER SECTION
function ImageSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => setCurrentSlide(index)
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length)
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % sliderImages.length)

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] bg-neutral-100 overflow-hidden flex items-center justify-center">
      {/* Slider Images */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full w-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderImages.map((slide) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover scale-105"
              priority={slide.id === 1}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
              <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-4 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl text-white font-medium mb-8 drop-shadow">
                {slide.subtitle}
              </p>
              <Link href="/products" className="inline-block">
                <Button className="px-8 py-3 text-lg font-semibold bg-white text-black hover:bg-neutral-200 shadow-lg rounded-full transition-all">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-60 text-black p-2 rounded-full shadow transition-all z-20"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white bg-opacity-30 hover:bg-opacity-60 text-black p-2 rounded-full shadow transition-all z-20"
        aria-label="Next Slide"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-4 h-4 rounded-full border-2 border-white transition-all ${index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-40'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function DPTOneFashion() {
  const { cartItems, addToCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const [products, setProducts] = useState<any[]>([])
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'))
      const items: any[] = []
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() })
      })
      setProducts(items)
    }
    fetchProducts()
  }, [])

  const handleAddToCart = (product: any) => {
    if (!user) {
      router.push('/login')
      return
    }
    addToCart(product)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content Container */}
      <div className="w-full">
        {/* Hero / Slider Section */}
        <ImageSlider />
        {/* Featured Products Section */}
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            <h2 className="text-4xl font-extrabold text-center mb-12 tracking-tight text-neutral-900">
              Featured Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {products.length === 0 ? (
                <div className="col-span-4 text-center text-gray-500">No products found.</div>
              ) : (
                products.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="w-full">
                    <div
                      className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center cursor-pointer hover:shadow-xl transition"
                      onMouseEnter={() => setHoveredProduct(product.id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                    >
                      <img
                        src={
                          hoveredProduct === product.id && product.imageUrls && product.imageUrls.length > 1
                            ? product.imageUrls[1]
                            : product.imageUrls && product.imageUrls.length > 0
                              ? product.imageUrls[0]
                              : "/images/placeholder.jpg"
                        }
                        alt={product.name}
                        className="w-48 h-48 object-contain mb-4"
                      />
                      <h3 className="font-bold text-lg text-center mb-1">{product.name}</h3>
                      <p className="text-gray-700 font-semibold mb-4">₱{product.price}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}