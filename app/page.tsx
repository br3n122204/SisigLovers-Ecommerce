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
import FooterConditional from '@/components/FooterConditional'

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
  console.log('DEBUG: Homepage component is rendering');
  const { cartItems, addToCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const [products, setProducts] = useState<any[]>([])
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const querySnapshot = await getDocs(collection(db, 'adminProducts'))
        const items: any[] = []
        querySnapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() })
        })
        setProducts(items)
      } catch (err: any) {
        setError('Failed to load products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Main Content Container */}
      <div className="w-full">
        {/* Hero / Slider Section */}
        <div className="relative">
          <ImageSlider />
          {/* Add a dark overlay for clarity if needed */}
        </div>
        {/* Featured Products Section */}
        <section className="py-20 bg-[var(--card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            <h2 className="text-4xl font-extrabold text-center mb-12 tracking-tight text-[var(--accent)]">
              Featured Products
            </h2>
            {error ? (
              <div className="flex justify-center items-center py-20 text-red-400 font-semibold">
                {error}
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-20">
                <svg className="animate-spin h-10 w-10 text-[var(--accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span className="ml-4 text-lg text-[var(--foreground)]">Loading products...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {products.length === 0 ? (
                  <div className="col-span-4 text-center text-[var(--foreground)] opacity-60">No products found.</div>
                ) : (
                  products.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="w-full">
                      <div
                        className="bg-[var(--sidebar)] rounded-2xl shadow-lg p-4 flex flex-col items-center cursor-pointer hover:shadow-xl transition border border-[var(--card)]"
                        onMouseEnter={() => setHoveredProduct(product.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <img
                          src={
                            hoveredProduct === product.id && product.imageUrls && product.imageUrls.length > 1
                              ? product.imageUrls[1]
                              : product.imageUrls && product.imageUrls.length > 0
                                ? product.imageUrls[0]
                                : '/images/placeholder.jpg'
                          }
                          alt={product.name}
                          className="w-32 h-32 object-contain rounded-lg bg-[var(--card)] border border-[var(--sidebar)] mb-4"
                        />
                        <span className="font-semibold text-lg text-[var(--foreground)] text-center mb-2 truncate w-full">
                          {product.name}
                        </span>
                        <span className="text-[var(--accent)] font-bold text-lg mb-2">
                          ₱{product.price}
                        </span>
                        <Button
                          className="w-full bg-[var(--accent)] text-white font-semibold rounded-md py-2 mt-auto hover:bg-[var(--foreground)] hover:text-[var(--background)] transition"
                          onClick={e => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>
      <FooterConditional />
    </div>
  )
}