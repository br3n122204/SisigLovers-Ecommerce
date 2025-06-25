"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loadingImages, setLoadingImages] = useState(true);
  const [brand, setBrand] = useState("");
  const brandOptions = ["Strap", "Richboyz", "Charlotte Folk", "MN+LA"];
  const router = useRouter();

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      const { data, error } = await supabase.storage.from('product-images').list('', { limit: 100 });
      console.log('Supabase list data:', data);
      console.log('Supabase list error:', error);
      if (error) {
        setImages([]);
        setLoadingImages(false);
        setImages([]);
        setLoadingImages(false);
        (window as any).supabaseListError = error; // for easy inspection
        return;
      }
      const urls = data?.filter(file => file.name.match(/\.(jpg|jpeg|png|gif)$/i)).map(file =>
        `${supabase.storage.from('product-images').getPublicUrl(file.name).data.publicUrl}`
      ) || [];
      setImages(urls);
      setLoadingImages(false);
      // Show the data structure in the UI for debugging
      (window as any).supabaseListData = data;
    };
    fetchImages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "products"), {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        imageUrl: selectedImage,
        brand,
        createdAt: new Date(),
      });
      alert("Product added successfully!");
      router.push("/"); // Redirect to home or product list
    } catch (error) {
      alert("Failed to add product. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Add New Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Product Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Price (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Stock</label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stock}
              onChange={e => setStock(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Brand</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              required
            >
              <option value="" disabled>Select a brand</option>
              {brandOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Select Product Image</label>
            {loadingImages ? (
              <div className="text-gray-500">Loading images...</div>
            ) : images.length === 0 ? (
              <>
                <div className="text-gray-500">No images found in storage.</div>
                {typeof window !== 'undefined' && (window as any).supabaseListData && (
                  <pre className="text-xs text-gray-400 mt-2">{JSON.stringify((window as any).supabaseListData, null, 2)}</pre>
                )}
                {typeof window !== 'undefined' && (window as any).supabaseListError && (
                  <div className="text-red-500 text-xs mt-2">Error: {(window as any).supabaseListError.message}</div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {images.map((url, idx) => (
                  <div
                    key={url}
                    className={`border-2 rounded-md cursor-pointer p-1 ${selectedImage === url ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(url)}
                  >
                    <img src={url} alt={`Product ${idx}`} className="w-full h-20 object-cover rounded" />
                  </div>
                ))}
              </div>
            )}
            {selectedImage && (
              <div className="mt-2 text-sm text-green-700">Selected image: <span className="break-all">{selectedImage}</span></div>
            )}
          </div>
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Add Product"}
          </button>
          <button
            type="button"
            className="w-full mt-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-semibold hover:bg-gray-300"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
} 