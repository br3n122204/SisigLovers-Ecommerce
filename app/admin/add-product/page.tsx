"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import ReactCrop, { centerCrop, makeAspectCrop, Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from 'react-modal';
import { useAuth } from "@/context/AuthContext";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [brand, setBrand] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropConfig, setCropConfig] = useState<Crop>({ unit: '%', width: 100, height: 100, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [cropImageRef, setCropImageRef] = useState<HTMLImageElement | null>(null);
  const [croppingIdx, setCroppingIdx] = useState<number | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const brandOptions = ["Strap", "Richboyz", "Charlotte Folk", "MN+LA"];
  const router = useRouter();
  const { user } = useAuth();

  const brandFolderMap: Record<string, string> = {
    "Charlotte Folk": "CHARLOTTE FOLK PRODUCTS",
    "MN+LA": "MNLA PRODUCTS",
    "Richboyz": "RICHBOYZ PRODUCTS",
    "Strap": "STRAP PRODUCTS"
  };

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      if (!brand) {
        setImages([]);
        setLoadingImages(false);
        return;
      }
      // List images only from the mapped brand's folder
      const folder = brandFolderMap[brand] || brand;
      const { data, error } = await supabase.storage.from('product-images').list(`${folder}/`, { limit: 100 });
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
        `${supabase.storage.from('product-images').getPublicUrl(`${folder}/${file.name}`).data.publicUrl}`
      ) || [];
      setImages(urls);
      setLoadingImages(false);
      // Show the data structure in the UI for debugging
      (window as any).supabaseListData = data;
    };
    fetchImages();
  }, [brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const productData: any = {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        imageUrls: selectedImages.filter(Boolean),
        brand: brand || null,
        isFeatured,
        createdAt: new Date(),
      };
      Object.keys(productData).forEach(
        (key) => productData[key] === undefined && delete productData[key]
      );
      await addDoc(collection(db, "products"), productData);
      alert("Product added successfully!");
      router.push("/"); // Redirect to home or product list
    } catch (error) {
      alert("Failed to add product. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get cropped image as blob using react-image-crop
  async function getCroppedImg(image: HTMLImageElement, crop: Crop) {
    if (!crop.width || !crop.height) return null;
    // Calculate crop area in natural image pixels
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const cropX = Math.round(crop.x * scaleX);
    const cropY = Math.round(crop.y * scaleY);
    const cropWidth = Math.round(crop.width * scaleX);
    const cropHeight = Math.round(crop.height * scaleY);
    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    return new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve('');
        }
      }, 'image/jpeg');
    });
  }

  const handleImageClick = (url: string, idx: number) => {
    setCropImage(url);
    setCroppingIdx(idx);
    setCropConfig({ unit: '%', width: 100, height: 100, aspect: 1 });
    setCompletedCrop(null);
    setCropModalOpen(true);
  };

  const handleCropComplete = async () => {
    if (!user) {
      alert("You must be logged in to upload images.");
      setCropModalOpen(false);
      setCropImage(null);
      setCroppingIdx(null);
      return;
    }
    if (cropImageRef && completedCrop && croppingIdx !== null) {
      const croppedUrl = await getCroppedImg(cropImageRef, completedCrop);
      if (croppedUrl) {
        const response = await fetch(croppedUrl);
        const blob = await response.blob();
        const fileName = typeof crypto !== 'undefined' && crypto.randomUUID
          ? `cropped_${crypto.randomUUID()}.jpg`
          : `cropped_${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
        const folder = brand ? (brandFolderMap[brand] || brand) : 'featured';
        const filePath = `${folder}/${fileName}`;
        const { data, error } = await supabase.storage.from('product-images').upload(filePath, blob, { contentType: 'image/jpeg' });
        if (!error) {
          const publicUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
          setSelectedImages((prev) => {
            const newArr = [...prev];
            newArr[croppingIdx] = publicUrl;
            return newArr;
          });
          setCroppedImageUrl(publicUrl);
        } else {
          console.error('Supabase upload error (full object):', error);
          alert('Image upload failed. ' + (error.message || JSON.stringify(error) || 'Please try again.'));
        }
      }
    }
    setCropModalOpen(false);
    setCropImage(null);
    setCroppingIdx(null);
    setCropImageRef(null);
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
            <label className="block text-gray-700 font-medium mb-1">Select Product Images</label>
            {!brand ? (
              <div className="text-gray-500">Please select a brand to view images.</div>
            ) : loadingImages ? (
              <div className="text-gray-500">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-gray-500">No images found in storage for this brand.</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {images.map((url, idx) => (
                  <div
                    key={url}
                    className={`border-2 rounded-md cursor-pointer p-1 ${selectedImages.includes(url) ? 'border-blue-500' : 'border-transparent'}`}
                    onClick={() => handleImageClick(url, idx)}
                  >
                    <img src={url} alt={`Product ${idx}`} className="w-full h-20 object-cover rounded" />
                  </div>
                ))}
              </div>
            )}
            {selectedImages.length > 0 && (
              <div className="mt-2 text-sm text-green-700 flex flex-wrap gap-2">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative inline-block">
                    <img src={img} alt="Selected" className="w-12 h-12 object-cover rounded border border-green-500" />
                    <button
                      type="button"
                      onClick={() => setSelectedImages(selectedImages.filter((_, idx) => idx !== i))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700"
                      style={{ transform: 'translate(40%, -40%)' }}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Product Type</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isFeatured" className="text-sm text-gray-700">Featured Product (also show in homepage featured section)</label>
            </div>
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
      {/* Cropper Modal */}
      <Modal
        isOpen={cropModalOpen}
        onRequestClose={() => setCropModalOpen(false)}
        contentLabel="Crop Image"
        ariaHideApp={false}
        style={{ content: { maxWidth: 400, margin: 'auto', height: 500 } }}
      >
        {cropImage && (
          <>
            <div style={{ position: 'relative', width: '100%', height: 350 }}>
              <ReactCrop
                crop={cropConfig}
                onChange={c => setCropConfig(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                keepSelection={true}
              >
                <img
                  src={cropImage}
                  alt="Crop"
                  ref={el => setCropImageRef(el)}
                  crossOrigin="anonymous"
                  style={{ maxWidth: '100%', maxHeight: 350, display: 'block', margin: '0 auto' }}
                />
              </ReactCrop>
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setCropModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleCropComplete} className="px-4 py-2 bg-blue-600 text-white rounded">Crop & Select</button>
        </div>
      </Modal>
    </div>
  );
} 