"use client"

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../../../styles/slide-animations.css';

// Sample product data - In a real application, you would fetch this from a database
const allProducts = [
  {
    id: 1,
    name: "Strap White Tee",
    price: "₱850.00", // Updated price for this page to match image
    image: "/images/products/strap-white-tee.jpg",
    backImage: "/images/products/strap-white-tee-back.jpg",
    description: "Our classic white tee features a unique strap design. Made from 100% premium cotton for ultimate comfort and durability.",
    sizes: ["SMALL", "MEDIUM", "LARGE", "XL", "2XL", "3XL"],
  },
  {
    id: 2,
    name: "Richboyz White Tee",
    price: "₱550.00",
    image: "/images/products/richboyz-white-tee.jpg",
    backImage: "/images/products/richboyz-white-tee-back.jpg",
    description: "Show your style with the Richboyz White Tee. A perfect blend of comfort and street fashion.",
    sizes: ["SMALL", "MEDIUM", "LARGE", "XL"],
  },
  {
    id: 3,
    name: "Charlotte Folk White Tee",
    price: "₱550.00",
    image: "/images/products/charlottefolk-white-tee.jpg",
    backImage: "/images/products/charlottefolk-white-tee-back.jpg",
    description: "Embrace the urban vibe with the Charlotte Folk White Tee. Designed for comfort and modern aesthetics.",
    sizes: ["SMALL", "MEDIUM", "LARGE"],
  },
  {
    id: 4,
    name: "Strap Black Tee",
    price: "₱550.00",
    image: "/images/products/strap-black-tee.jpg",
    backImage: "/images/products/strap-black-tee-back.jpg",
    description: "The Strap Black Tee offers a sleek look with durable fabric. A versatile addition to any wardrobe.",
    sizes: ["SMALL", "MEDIUM", "LARGE", "XL"],
  },
  {
    id: 5,
    name: "MN+LA Black Tee",
    price: "₱550.00",
    image: "/images/products/mnla-black-tee.jpg",
    backImage: "/images/products/mnla-black-tee-back.jpg",
    description: "Represent your style with the MN+LA Black Tee. Premium quality for everyday wear.",
    sizes: ["SMALL", "MEDIUM", "LARGE", "2XL"],
  },
  {
    id: 6,
    name: "Richboyz Black Tee",
    price: "₱550.00",
    image: "/images/products/richboyz-black-tee.jpg",
    backImage: "/images/products/richboyz-black-tee-back.jpg",
    description: "The Richboyz Black Tee is designed for a bold statement. Comfortable and stylish for any occasion.",
    sizes: ["SMALL", "MEDIUM", "LARGE"],
  },
  {
    id: 7,
    name: "MN+LA White Tee",
    price: "₱550.00",
    image: "/images/products/mnla-white-tee.jpg",
    backImage: "/images/products/mnla-white-tee-back.jpg",
    description: "A fresh take on urban wear, the MN+LA White Tee combines comfort with contemporary design.",
    sizes: ["SMALL", "MEDIUM", "LARGE", "XL"],
  },
  {
    id: 8,
    name: "Charlotte Folk Black Tee",
    price: "₱550.00",
    image: "/images/products/charlottefolk-black-tee.jpg",
    backImage: "/images/products/charlottefolk-black-tee-back.jpg",
    description: "The Charlotte Folk Black Tee offers a modern fit and feel, perfect for casual or dressed-up looks.",
    sizes: ["SMALL", "MEDIUM", "LARGE", "2XL"],
  },
];

// Black and white style for navigation buttons
const navBtnStyles = `
  absolute top-1/2 -translate-y-1/2 z-10
  w-12 h-12 flex items-center justify-center
  rounded-full shadow-lg
  bg-black border-2 border-white
  text-white text-2xl font-bold
  transition-transform transition-opacity duration-200
  hover:scale-110 hover:bg-white hover:text-black hover:border-black hover:opacity-90
  active:scale-95
  focus:outline-none
`;

export default function ProductDetailPage() {
  const params = useParams();
  const productId = String(params.id);
  const [product, setProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [mainImage, setMainImage] = useState<string>("");
  const [mainImageIdx, setMainImageIdx] = useState<number>(0);
  const [isFading, setIsFading] = useState(false);
  const [fadeNextImage, setFadeNextImage] = useState<string | null>(null);
  const fadeDuration = 400;
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct(data);
        setSelectedSize(data.sizes ? data.sizes[0] : undefined);
        if (data.imageUrls && data.imageUrls.length > 0) {
          setMainImage(data.imageUrls[0]);
          setMainImageIdx(0);
        } else if (data.imageUrl) {
          setMainImage(data.imageUrl);
          setMainImageIdx(0);
        }
      } else {
        setProduct(null);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product && selectedSize) {
      addToCart({
        id: productId,
        name: product.name,
        image: mainImage,
        price: typeof product.price === 'number' ? product.price : Number(product.price),
        quantity: Number(quantity),
        selectedSize: selectedSize,
      });
      alert(`${quantity} ${product.name} (${selectedSize}) added to cart!`);
    } else {
      alert('Please select a size.');
    }
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handlePrevImage = () => {
    if (product?.imageUrls && product.imageUrls.length > 1) {
      const newIdx = (mainImageIdx - 1 + product.imageUrls.length) % product.imageUrls.length;
      setFadeNextImage(product.imageUrls[newIdx]);
      setIsFading(true);
      setTimeout(() => {
        setMainImageIdx(newIdx);
        setMainImage(product.imageUrls[newIdx]);
        setIsFading(false);
        setFadeNextImage(null);
      }, fadeDuration);
    }
  };

  const handleNextImage = () => {
    if (product?.imageUrls && product.imageUrls.length > 1) {
      const newIdx = (mainImageIdx + 1) % product.imageUrls.length;
      setFadeNextImage(product.imageUrls[newIdx]);
      setIsFading(true);
      setTimeout(() => {
        setMainImageIdx(newIdx);
        setMainImage(product.imageUrls[newIdx]);
        setIsFading(false);
        setFadeNextImage(null);
      }, fadeDuration);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Product not found.</p>
      </div>
    );
  }

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

        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
          {/* Image Gallery */}
          <div className="md:w-1/2 flex flex-col items-center">
            <div ref={imageContainerRef} className="relative w-full max-w-lg mb-4 flex items-center justify-center">
              {product.imageUrls && product.imageUrls.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className={navBtnStyles + " left-0"}
                  style={{ left: '8px', top: '50%', transform: 'translateY(-50%)' }}
                  aria-label="Previous image"
                >
                  <span className="drop-shadow-lg">&#8592;</span>
                </button>
              )}
              <div
                className="w-full max-w-lg h-auto rounded-lg border overflow-hidden relative"
                style={{ minHeight: 400 }}
              >
                {/* Current image always visible */}
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className={`w-full h-auto object-contain transition-opacity duration-400 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="w-full h-[400px] flex items-center justify-center bg-gray-100 text-gray-400">No Image</div>
                )}
                {/* Fade in next image */}
                {isFading && fadeNextImage && (
                  <img
                    src={fadeNextImage}
                    alt="Next"
                    className="w-full h-auto object-contain transition-opacity duration-400 opacity-100"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
                )}
              </div>
              {product.imageUrls && product.imageUrls.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className={navBtnStyles + " right-0"}
                  style={{ right: '8px', top: '50%', transform: 'translateY(-50%)' }}
                  aria-label="Next image"
                >
                  <span className="drop-shadow-lg">&#8594;</span>
                </button>
              )}
            </div>
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="flex gap-2 mt-2">
                {product.imageUrls.map((img: string, idx: number) => (
                  <img
                    key={img}
                    src={img}
                    alt={`Thumbnail ${idx}`}
                    className={`w-20 h-20 object-cover rounded cursor-pointer border ${mainImageIdx === idx ? 'border-black' : 'border-gray-300'}`}
                    onClick={() => {
                      setMainImage(img);
                      setMainImageIdx(idx);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Product Info */}
          <div className="md:w-1/2 flex flex-col justify-center">
            <span className="text-sm text-gray-500 uppercase font-medium mb-2">{product.brand}</span>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name?.toUpperCase()}</h1>
            <p className="text-xl text-gray-700 font-bold mb-4">₱{product.price}</p>
            <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-2">SIZES</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <Button
                      key={size}
                      variant="outline"
                      onClick={() => setSelectedSize(size)}
                      className={`border-gray-300 text-gray-700 hover:bg-black hover:text-white transition-colors ${selectedSize === size ? 'bg-black text-white' : ''}`}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Quantity</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => handleQuantityChange(-1)} className="border-gray-300 text-gray-700 hover:bg-gray-50">-</Button>
                <span className="px-4 py-2 border border-gray-300 rounded-md">{quantity}</span>
                <Button variant="outline" onClick={() => handleQuantityChange(1)} className="border-gray-300 text-gray-700 hover:bg-gray-50">+</Button>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors"
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
              <Button variant="outline" className="w-full border-2 border-black text-black py-3 rounded-md hover:bg-gray-100 transition-colors">
                Buy it now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 