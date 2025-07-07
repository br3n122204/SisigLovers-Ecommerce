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
import WelcomeCard from '@/components/WelcomeCard'

// Sample slider images data
const sliderImages = [
  {
    id: 1,
    image: "https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/Image%20Sliders/CharlotteFolk.png",
    title: "Charlotte Folk",
    subtitle: "Fresh streetwear for the bold.",
  },
  {
    id: 2,
    image: "https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/Image%20Sliders/MNLA.png",
    title: "MNLA",
    subtitle: "Urban vibes, modern style.",
  },
  {
    id: 3,
    image: "https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/Image%20Sliders/RichBoyz.png",
    title: "Rich Boyz",
    subtitle: "Elevate your look.",
  },
  {
    id: 4,
    image: "https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/Image%20Sliders/Strap.png",
    title: "Strap",
    subtitle: "Strap in for style.",
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
    <div className="relative w-full max-w-xs mx-auto h-[44vh] min-h-[200px] sm:max-w-full sm:h-[70vh] sm:min-h-[500px] bg-[#101828] overflow-hidden flex items-center justify-center">
      {/* Slider Images */}
      <div
        className="flex transition-transform duration-700 ease-in-out h-full w-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {sliderImages.map((slide) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0 flex items-center justify-center overflow-hidden">
            {/* Blurred Background */}
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover w-full h-full scale-105 blur-lg brightness-75 absolute inset-0 z-0"
              priority={slide.id === 1}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />
            {/* Foreground Image and Button */}
            <div className="relative z-20 flex flex-col items-center justify-center">
              <Image
                src={slide.image}
                alt={slide.title}
                width={480}
                height={480}
                className="rounded-2xl shadow-2xl object-cover w-45 h-45 sm:w-[480px] sm:h-[480px]"
                priority={slide.id === 1}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-[#19223a] bg-opacity-70 hover:bg-opacity-90 text-[#60A5FA] p-2 rounded-full shadow transition-all z-30"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-[#19223a] bg-opacity-70 hover:bg-opacity-90 text-[#60A5FA] p-2 rounded-full shadow transition-all z-30"
        aria-label="Next Slide"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
      {/* Dots Navigation */}
      <div className="absolute left-1/2 -translate-x-1/2 z-30 flex flex-col items-center" style={{ bottom: '1rem' }}>
        <div className="flex space-x-2 mb-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full border border-[#60A5FA] transition-all ${index === currentSlide ? 'bg-[#60A5FA]' : 'bg-[#60A5FA] bg-opacity-40'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
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
    // Always use the first image for cart
    const image = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls[0]
      : product.imageUrl || product.image || '/images/placeholder.jpg';
    addToCart({
      ...product,
      image,
    });
  }

  // Smooth scroll to #featured if hash is present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#featured') {
      const el = document.getElementById('featured');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100); // slight delay to ensure render
      }
    }
  }, []);

  return (
    <>
      <WelcomeCard />
      <div className="min-h-screen bg-[#101828] text-[#60A5FA] flex flex-col">
        {/* Main Content Container */}
        <div className="w-full flex-grow">
          {/* Hero / Slider Section */}
          <ImageSlider />
          {/* Featured Products Section */}
          <section id="featured" className="py-20 bg-[#101828]">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
              <h2 className="text-4xl font-extrabold text-center mb-12 tracking-tight text-[#60A5FA]">
                Featured Products
              </h2>
              {error ? (
                <div className="flex justify-center items-center py-20 text-red-400 font-semibold">
                  {error}
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center py-20">
                  <svg className="animate-spin h-10 w-10 text-[#60A5FA]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  <span className="ml-4 text-lg text-[#60A5FA]">Loading products...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-10 px-2 sm:px-4 md:px-0">
                  {products.length === 0 ? (
                    <div className="col-span-4 text-center text-[#60A5FA]">No products found.</div>
                  ) : (
                    products.map((product) => {
                      // Sold out logic
                      const isSoldOut = (typeof product.totalStock === 'number' && product.totalStock === 0) ||
                        (Array.isArray(product.sizes) && product.sizes.reduce((sum: number, s: { stock: number }) => sum + (s.stock || 0), 0) === 0);
                      return (
                        <Link key={product.id} href={`/products/${product.id}`} className="w-full">
                          <div
                            className="bg-[#19223a] rounded-2xl shadow-lg p-3 sm:p-4 flex flex-col items-center cursor-pointer hover:shadow-xl transition text-[#60A5FA] relative max-w-[170px] sm:max-w-full mx-auto"
                            onMouseEnter={() => setHoveredProduct(product.id)}
                            onMouseLeave={() => setHoveredProduct(null)}
                          >
                            <div className="relative w-full flex justify-center">
                              <img
                                src={
                                  hoveredProduct === product.id && product.imageUrls && product.imageUrls.length > 1
                                    ? product.imageUrls[1]
                                    : product.imageUrls && product.imageUrls.length > 0
                                      ? product.imageUrls[0]
                                      : "/images/placeholder.jpg"
                                }
                                alt={product.name}
                                className="w-[90px] h-[75px] sm:w-48 sm:h-48 object-contain mb-2 sm:mb-4 rounded-lg bg-white"
                              />
                              {isSoldOut && (
                                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full z-10">Sold out</span>
                              )}
                            </div>
                            <h3 className="font-bold text-base sm:text-lg text-center mb-1">{product.name}</h3>
                            <p className="text-[#60A5FA] font-semibold mb-2 sm:mb-4">₱{product.price}</p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <WelcomeCard />
    </>
  )
}