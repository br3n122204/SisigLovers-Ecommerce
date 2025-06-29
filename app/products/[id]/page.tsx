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

// Black and white style for navigation buttons
const navBtnStyles = `
  absolute top-1/2 -translate-y-1/2 z-10
  w-12 h-12 flex items-center justify-center
  rounded-full shadow-lg
  bg-black border-2 border-white
  text-white text-2xl font-bold
  transition-transform transition-opacity duration-200
  hover:scale-110 hover:bg-white hover:text-[#001F3F] hover:border-black hover:opacity-90
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
      const docRef = doc(db, 'adminProducts', productId);
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
      <div className="min-h-screen flex items-center justify-center bg-[#101828]">
        <p className="text-xl text-[#60A5FA]">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA]">
      {/* Black Side Panels */}
      <div className="fixed left-0 top-0 w-16 h-full bg-black z-10"></div>
      <div className="fixed right-0 top-0 w-16 h-full bg-black z-10"></div>

      {/* Main Content Container */}
      <div className="mx-16 pt-8 pb-16">
        {/* Back to Home Button */}
        <Link href="/" passHref>
          <Button variant="outline" className="mb-8 border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a]">
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
                className="w-full max-w-lg h-auto rounded-lg border border-[#60A5FA] overflow-hidden relative bg-[#19223a]"
                style={{ minHeight: 400 }}
              >
                {/* Current image always visible */}
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-opacity duration-400 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="w-full h-[400px] flex items-center justify-center bg-[#101828] text-[#60A5FA]">No Image</div>
                )}
                {/* Fade in next image */}
                {isFading && fadeNextImage && (
                  <img
                    src={fadeNextImage}
                    alt="Next"
                    className="w-full h-full object-cover transition-opacity duration-400 opacity-100"
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
                    className={`w-20 h-20 object-cover rounded cursor-pointer border ${mainImageIdx === idx ? 'border-[#60A5FA]' : 'border-gray-700'}`}
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
            <span className="text-sm text-[#60A5FA] uppercase font-medium mb-2">{product.brand}</span>
            <h1 className="text-4xl font-extrabold text-[#60A5FA] mb-2">{product.name?.toUpperCase()}</h1>
            <p className="text-xl text-[#60A5FA] font-bold mb-4">₱{product.price}</p>
            <p className="text-[#60A5FA] mb-6 leading-relaxed">{product.description}</p>
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-[#60A5FA] mb-2">SIZES</h3>
                <div className="flex flex-wrap gap-2">
                  {["S", "M", "L", "XL", "2XL"].map(sizeLabel => {
                    const found = product.sizes.find((entry: { size: string, stock: number }) => entry.size === sizeLabel);
                    const isOutOfStock = !found || found.stock === 0;
                    return (
                      <Button
                        key={sizeLabel}
                        variant="outline"
                        onClick={() => !isOutOfStock && setSelectedSize(sizeLabel)}
                        className={`border-[#60A5FA] text-[#60A5FA] transition-colors
                          ${selectedSize === sizeLabel ? 'bg-[#60A5FA] text-[#101828]' : ''}
                          ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-700 text-[#60A5FA]' : 'hover:bg-[#60A5FA] hover:text-[#101828]'}
                        `}
                        disabled={isOutOfStock}
                      >
                        {sizeLabel}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-[#60A5FA] mb-2">Quantity</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => handleQuantityChange(-1)} className="border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a]">-</Button>
                <span className="px-4 py-2 border border-[#60A5FA] rounded-md text-[#60A5FA]">{quantity}</span>
                <Button variant="outline" onClick={() => handleQuantityChange(1)} className="border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a]">+</Button>
              </div>
            </div>
            <div className="space-y-4">
              <Button
                className="w-full bg-[#60A5FA] text-[#101828] py-3 rounded-md hover:bg-[#3380c0] transition-colors"
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
              <Button variant="outline" className="w-full border-2 border-[#60A5FA] text-[#60A5FA] py-3 rounded-md hover:bg-[#19223a] transition-colors">
                Buy it now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}