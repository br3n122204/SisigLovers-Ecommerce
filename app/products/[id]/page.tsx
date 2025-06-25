"use client"

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

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

export default function ProductDetailPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  const product = allProducts.find(p => p.id === productId);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(product?.sizes[0]);
  const [quantity, setQuantity] = useState<number>(1);

  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product && selectedSize) {
      addToCart({
        id: product.id,
        name: product.name,
        image: product.image, // Using the front image for cart display
        price: product.price,
        quantity: quantity,
        selectedSize: selectedSize,
      });
      alert(`${quantity} ${product.name} (${selectedSize}) added to cart!`);
    } else {
      alert("Please select a size.");
    }
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
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

        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Image Section */}
          <div className="md:w-1/2 flex items-center justify-center bg-gray-100 rounded-lg p-4">
            <Image
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              className="object-contain max-w-full max-h-full"
            />
          </div>

          {/* Product Details Section */}
          <div className="md:w-1/2 p-4">
            <span className="text-sm text-gray-500 uppercase font-medium">Strap</span> {/* Placeholder brand */}
            <h1 className="text-4xl font-extrabold text-gray-900 mt-2">{product.name.toUpperCase()}</h1>
            <p className="text-xl text-gray-700 mt-4 font-bold">{product.price} PHP</p>

            <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>

            <div className="mt-6">
              <h3 className="text-md font-semibold text-gray-800 mb-2">SIZES</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <Button
                    key={size}
                    variant="outline"
                    onClick={() => setSelectedSize(size)}
                    className={`border-gray-300 text-gray-700 hover:bg-[#A75D43] hover:text-white transition-colors ${
                      selectedSize === size ? "bg-[#A75D43] text-white" : ""
                    }`}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Quantity</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => handleQuantityChange(-1)} className="border-gray-300 text-gray-700 hover:bg-gray-50">-</Button>
                <span className="px-4 py-2 border border-gray-300 rounded-md">{quantity}</span>
                <Button variant="outline" onClick={() => handleQuantityChange(1)} className="border-gray-300 text-gray-700 hover:bg-gray-50">+</Button>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <Button
                className="w-full bg-[#A75D43] text-white py-3 rounded-md hover:bg-[#c98a6a] transition-colors"
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