"use client"

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import '../../../styles/slide-animations.css';
import { useAuth } from '@/context/AuthContext';
import { Star } from 'lucide-react';

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
  const router = useRouter();
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
  const [ratings, setRatings] = useState<any[]>([]);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | 'all' | 'comments' | 'media' | 'local'>('all');
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);

  // Calculate average rating and total reviews
  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0
    ? (ratings.reduce((sum, review) => sum + review.rating, 0) / totalRatings).toFixed(1)
    : '0.0';

  const filteredRatings = selectedStarFilter === 'all'
    ? ratings
    : ratings.filter(r => r.rating === selectedStarFilter);

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, 'adminProducts', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct(data);
        setSelectedSize(undefined);
        if (data.imageUrls && data.imageUrls.length > 0) {
          setMainImage(data.imageUrls[0]);
          setMainImageIdx(0);
        } else if (data.imageUrl) {
          setMainImage(data.imageUrl);
          setMainImageIdx(0);
        }

        // Fetch ratings for the product
        const ratingsCollectionRef = collection(db, 'adminProducts', productId, 'ratings');
        const q = query(ratingsCollectionRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedRatings = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRatings(fetchedRatings);

      } else {
        setProduct(null);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!user) {
      if (!selectedSize) {
        alert('Please select a size.');
        return;
      }
      let colorToUse = selectedColor;
      if (product.color && !selectedColor) {
        // If only one color, auto-select it
        const colorOptions = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
        if (colorOptions.length === 1) {
          colorToUse = colorOptions[0];
          setSelectedColor(colorToUse);
        } else {
          alert('Please select a color.');
          return;
        }
      }
      // Always use the first image for cart
      const image = product?.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls[0]
        : product?.imageUrl || product?.image || '/images/placeholder.jpg';
      localStorage.setItem('pendingCartItem', JSON.stringify({
        id: productId,
        name: product?.name,
        image,
        price: String(product?.price),
        quantity: Number(quantity),
        selectedSize: String(selectedSize),
        selectedColor: colorToUse ? String(colorToUse) : undefined,
        color: product.color,
      }));
      console.log('Adding to localStorage (pendingCartItem):', {
        id: productId,
        name: product?.name,
        image,
        price: String(product?.price),
        quantity: Number(quantity),
        selectedSize: String(selectedSize),
        selectedColor: colorToUse ? String(colorToUse) : undefined,
        color: product.color,
      });
      router.push('/login');
      return;
    }
    if (product && !selectedSize) {
      alert('Please select a size.');
      return;
    }
    let colorToUse = selectedColor;
    if (product.color && !selectedColor) {
      const colorOptions = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
      if (colorOptions.length === 1) {
        colorToUse = colorOptions[0];
        setSelectedColor(colorToUse);
      } else {
        alert('Please select a color.');
        return;
      }
    }
    if (product && selectedSize) {
      // Always use the first image for cart
      const image = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls[0]
        : product.imageUrl || product.image || '/images/placeholder.jpg';
      console.log('Adding to cart:', {
        id: productId,
        name: product.name,
        image,
        price: String(product.price),
        quantity: Number(quantity),
        selectedSize: String(selectedSize),
        selectedColor: colorToUse ? String(colorToUse) : undefined,
        color: product.color,
      });
      addToCart({
        id: productId,
        name: product.name,
        image,
        price: String(product.price),
        quantity: Number(quantity),
        selectedSize: String(selectedSize),
        selectedColor: colorToUse ? String(colorToUse) : undefined,
        color: product.color,
      });
      alert(`${quantity} ${product.name} (${selectedSize}${colorToUse ? ', ' + colorToUse : ''}) added to cart!`);
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

  // Calculate if product is sold out
  const isSoldOut = product && (
    (typeof product.totalStock === 'number' && product.totalStock === 0) ||
    (Array.isArray(product.sizes) && product.sizes.reduce((sum: number, s: { stock: number }) => sum + (s.stock || 0), 0) === 0)
  );

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#101828]">
        <p className="text-xl text-[#60A5FA]">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA]">
      {/* Main Content Container */}
      <div className="px-4 pt-8 pb-16 w-full">
        {/* Back Button: Go to previous page */}
        <button
          onClick={() => router.back()}
          className="mb-8 px-4 py-1 text-sm rounded-full border border-[#60A5FA] text-[#60A5FA] bg-[#101828] hover:bg-[#22304a] transition-all shadow-sm"
          style={{ minWidth: 'unset', width: 'auto', fontWeight: 500 }}
        >
          ← Back
        </button>

        <div className="w-full max-w-7xl mx-auto py-12">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Image Gallery */}
            <div className="md:w-1/2 flex flex-col items-center min-w-[350px]">
              <div className="relative w-full max-w-xl mb-4 flex items-center justify-center">
                {/* Navigation buttons outside the image area */}
                {product.imageUrls && product.imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className={navBtnStyles + ""}
                      style={{ position: 'absolute', left: '-56px', top: '50%', transform: 'translateY(-50%)' }}
                      aria-label="Previous image"
                    >
                      <span className="drop-shadow-lg">&#8592;</span>
                    </button>
                    <button
                      onClick={handleNextImage}
                      className={navBtnStyles + ""}
                      style={{ position: 'absolute', right: '-56px', top: '50%', transform: 'translateY(-50%)' }}
                      aria-label="Next image"
                    >
                      <span className="drop-shadow-lg">&#8594;</span>
                    </button>
                  </>
                )}
                <div
                  ref={imageContainerRef}
                  className="w-full max-w-xl h-auto rounded-lg border border-[#60A5FA] overflow-hidden relative bg-[#19223a]"
                  style={{ minHeight: 400 }}
                >
                  {/* Current image always visible */}
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className={`w-full h-full object-contain transition-opacity duration-400 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#fff' }}
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
              </div>
              {product.imageUrls && product.imageUrls.length > 1 && (
                <div className="flex gap-2 mt-2 max-w-xl">
                  {product.imageUrls.map((img: string, idx: number) => (
                    <img
                      key={img}
                      src={img}
                      alt={`Thumbnail ${idx}`}
                      className={`w-20 h-20 object-contain rounded cursor-pointer border ${mainImageIdx === idx ? 'border-[#60A5FA]' : 'border-gray-700'}`}
                      style={{ background: '#fff' }}
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
            <div className="md:w-1/2 flex flex-col justify-center min-w-[350px]">
              <span className="text-sm text-[#60A5FA] uppercase font-medium mb-2">{product.brand}</span>
              <h1 className="text-4xl font-extrabold text-[#60A5FA] mb-2 flex items-center gap-3">
                {product.name?.toUpperCase()}
                {isSoldOut && (
                  <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full ml-2">Sold out</span>
                )}
              </h1>
              <p className="text-xl text-[#60A5FA] font-bold mb-4">₱{typeof product.price === 'number' ? product.price.toLocaleString() : Number(product.price).toLocaleString()}</p>
              {product.color && (
                <p className="text-md text-[#60A5FA] font-semibold mb-2">Color: {product.color}</p>
              )}
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
                          <span className={isOutOfStock ? 'line-through' : ''}>{sizeLabel}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Color Selection */}
              {product.color && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-[#60A5FA] mb-2">COLOR{product.color.includes(',') ? 'S' : ''}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.color.split(',').map((colorOption: string) => {
                      const colorTrimmed = colorOption.trim();
                      return (
                        <Button
                          key={colorTrimmed}
                          variant="outline"
                          onClick={() => setSelectedColor(colorTrimmed)}
                          className={`border-[#60A5FA] text-[#60A5FA] transition-colors
                            ${selectedColor === colorTrimmed ? 'bg-[#60A5FA] text-[#101828]' : 'hover:bg-[#60A5FA] hover:text-[#101828]'}
                          `}
                        >
                          {colorTrimmed}
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
                {isSoldOut ? (
                  <Button
                    className="w-full bg-[#60A5FA] text-[#101828] py-3 rounded-md opacity-70 cursor-not-allowed"
                    disabled
                  >
                    Sold out
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full bg-[#60A5FA] text-[#101828] py-3 rounded-md hover:bg-[#3380c0] transition-colors"
                      onClick={handleAddToCart}
                    >
                      Add to cart
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-[#60A5FA] text-[#60A5FA] py-3 rounded-md hover:bg-[#19223a] transition-colors"
                      onClick={() => {
                        if (!user) {
                          if (!selectedSize) {
                            alert('Please select a size.');
                            return;
                          }
                          let colorToUse = selectedColor;
                          if (product.color && !selectedColor) {
                            const colorOptions = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
                            if (colorOptions.length === 1) {
                              colorToUse = colorOptions[0];
                              setSelectedColor(colorToUse);
                            } else {
                              alert('Please select a color.');
                              return;
                            }
                          }
                          localStorage.setItem('pendingCartItem', JSON.stringify({
                            id: productId,
                            name: product?.name,
                            image: mainImage,
                            price: String(product?.price),
                            quantity: Number(quantity),
                            selectedSize: String(selectedSize),
                            selectedColor: colorToUse ? String(colorToUse) : undefined,
                            color: product.color,
                          }));
                          console.log('Adding to localStorage (pendingCartItem):', {
                            id: productId,
                            name: product?.name,
                            image: mainImage,
                            price: String(product?.price),
                            quantity: Number(quantity),
                            selectedSize: String(selectedSize),
                            selectedColor: colorToUse ? String(colorToUse) : undefined,
                            color: product.color,
                          });
                          router.push('/login');
                          return;
                        }
                        if (product && !selectedSize) {
                          alert('Please select a size.');
                          return;
                        }
                        let colorToUse = selectedColor;
                        if (product.color && !selectedColor) {
                          const colorOptions = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
                          if (colorOptions.length === 1) {
                            colorToUse = colorOptions[0];
                            setSelectedColor(colorToUse);
                          } else {
                            alert('Please select a color.');
                            return;
                          }
                        }
                        if (product && selectedSize) {
                          // Do NOT add to cart. Instead, pass product info to checkout page (e.g., via localStorage or query string)
                          localStorage.setItem('pendingBuyNowItem', JSON.stringify({
                            id: productId,
                            name: product.name,
                            image: mainImage,
                            price: String(product.price),
                            quantity: Number(quantity),
                            selectedSize: String(selectedSize),
                            selectedColor: colorToUse ? String(colorToUse) : undefined,
                            color: product.color,
                            buyNow: true,
                          }));
                          router.push('/checkout?buyNow=1');
                        }
                      }}
                    >
                      Buy it now
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ratings and Feedback Section */}
          <div className="mt-8 pt-8 border-t border-[#22304a] w-full">
            <h2 className="text-2xl font-bold text-[#60A5FA] mb-4">Product Ratings</h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              {/* Average Rating Display */}
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-orange-400">{averageRating}</div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-6 w-6 ${i < Math.floor(Number(averageRating)) ? 'text-orange-400 fill-orange-400' : 'text-gray-400'}`}
                      />
                    ))}
                  </div>
                  <span className="text-[#60A5FA] text-sm mt-1">({totalRatings} reviews)</span>
                </div>
              </div>
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className={`border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a] ${selectedStarFilter === 'all' ? 'bg-[#60A5FA] text-[#101828]' : ''}`}
                  onClick={() => setSelectedStarFilter('all')}
                >
                  All ({totalRatings})
                </Button>
                {[5, 4, 3, 2, 1].map((star) => (
                  <Button
                    key={star}
                    variant="outline"
                    className={`border-[#60A5FA] text-[#60A5FA] hover:bg-[#19223a] ${selectedStarFilter === star ? 'bg-[#60A5FA] text-[#101828]' : ''} `}
                    onClick={() => setSelectedStarFilter(star)}
                  >
                    {star} Star ({ratings.filter(r => r.rating === star).length})
                  </Button>
                ))}
              </div>
            </div>
            {filteredRatings.length > 0 ? (
              <div className="space-y-6">
                {filteredRatings.map((review, index) => (
                  <div key={index} className="bg-[#19223a] p-4 rounded-lg shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-sm text-white">{
                        review.email ? review.email.charAt(0).toUpperCase() : ''
                      }</div>
                      <span className="font-medium text-[#60A5FA]">{
                        review.email ? review.email.replace(/(.{1}).*(@.*)/, '$1*****$2') : 'Anonymous'
                      }</span>
                      <span className="text-sm text-gray-400">|</span>
                      <span className="text-sm text-gray-400">{review.timestamp?.toDate().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < review.rating ? 'text-orange-400 fill-orange-400' : 'text-gray-400'}`}
                        />
                      ))}
                      <span className="text-sm text-[#60A5FA] ml-2">{review.rating} / 5</span>
                    </div>
                    <p className="text-[#60A5FA] text-base mb-2">{review.feedback}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#60A5FA]">
                {selectedStarFilter === 'all'
                  ? 'No reviews yet. Be the first to review this product!'
                  : 'No reviews for this rating yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}