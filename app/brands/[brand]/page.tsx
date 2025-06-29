"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from "next/image";
import Link from "next/link";

const sortOptions = [
  { label: "Date, new to old", value: "date-desc" },
  { label: "Date, old to new", value: "date-asc" },
  { label: "Price, low to high", value: "price-asc" },
  { label: "Price, high to low", value: "price-desc" },
];

const availabilityOptions = [
  { label: "All", value: "all" },
  { label: "In Stock", value: "in-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
];

export default function BrandPage() {
  const params = useParams();
  let brandParam = params.brand;
  const brand = decodeURIComponent(Array.isArray(brandParam) ? brandParam[0] : brandParam || "");
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("date-desc");
  const [availability, setAvailability] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const q = query(collection(db, 'adminProducts'), where('brand', '==', brand));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(items);
      setLoading(false);
    };
    if (brand) fetchProducts();
  }, [brand]);

  useEffect(() => {
    let filtered = [...products];
    // Filter by availability
    if (availability === "in-stock") {
      filtered = filtered.filter(p => p.stock && p.stock > 0);
    } else if (availability === "out-of-stock") {
      filtered = filtered.filter(p => !p.stock || p.stock === 0);
    }
    // Sort
    if (sort === "price-asc") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "date-asc") {
      filtered.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    } else if (sort === "date-desc") {
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    setFilteredProducts(filtered);
  }, [products, sort, availability]);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full pt-8 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">{brand.toUpperCase()}</h1>
          <div className="flex items-center gap-4">
            {/* Filter: Availability */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Filter:</span>
              <select
                className="border border-gray-300 bg-gray-50 rounded px-2 py-1 text-sm focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]"
                value={availability}
                onChange={e => setAvailability(e.target.value)}
              >
                {availabilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Sort by:</span>
              <select
                className="border border-gray-300 bg-gray-50 rounded px-2 py-1 text-sm focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]"
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <span className="text-[#001F3F] text-sm">{filteredProducts.length} products</span>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-20 text-lg">Loading products...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {filteredProducts.map(product => (
              <div key={product.id} className="flex flex-col items-center">
                <Link href={`/products/${product.id}`}>
                  <Image src={product.imageUrls?.[0] || product.image || "/placeholder.jpg"} alt={product.name} width={250} height={250} className="object-contain rounded-lg bg-gray-100" />
                </Link>
                <div className="mt-4 text-center">
                  <div className="font-medium text-[#001F3F]">{product.name}</div>
                  <div className="text-[#A75D43] font-semibold mt-1">₱{Number(product.price).toLocaleString()} PHP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 