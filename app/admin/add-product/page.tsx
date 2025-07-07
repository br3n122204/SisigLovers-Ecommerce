"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Modal from 'react-modal';


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
  const [sizes, setSizes] = useState([{ size: '', stock: '' }]);
  const [color, setColor] = useState("");
  const brandOptions = ["Strap", "Richboyz", "Charlotte Folk", "MN+LA"];
  const router = useRouter();
  const { user } = useAuth();
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropConfig, setCropConfig] = useState<Crop>({ unit: '%', x: 0, y: 0, width: 100, height: 100 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [cropImageRef, setCropImageRef] = useState<HTMLImageElement | null>(null);
  const [croppingIdx, setCroppingIdx] = useState<number | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

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
      const filteredSizes = sizes.filter(s => s.size && s.stock !== '').map(s => ({ size: s.size, stock: Number(s.stock) }));
      const totalStock = filteredSizes.reduce((sum, s) => sum + Number(s.stock), 0);
      const productData: any = {
        name,
        description,
        price: Number(price),
        color,
        imageUrls: selectedImages.filter(Boolean),
        brand: brand || null,
        isFeaturedProduct: isFeatured,
        createdAt: new Date(),
        sizes: filteredSizes,
        totalStock,
      };
      Object.keys(productData).forEach(
        (key) => productData[key] === undefined && delete productData[key]
      );
      await addDoc(collection(db, "adminProducts"), productData);
      alert("Product added successfully!");
      // Clear all form fields
      setName("");
      setDescription("");
      setPrice("");
      setStock("");
      setColor("");
      setSelectedImages([]);
      setBrand("");
      setIsFeatured(false);
      setSizes([{ size: '', stock: '' }]);
      router.push("/admin");
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
    const fullCrop: Crop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };
    setCropConfig(fullCrop);
    setCompletedCrop(fullCrop);
    setCropModalOpen(true);
  };

  const handleCropComplete = async () => {
    if (cropImageRef && completedCrop && croppingIdx !== null && brand) {
      // Check if crop region is the full image (no cropping needed)
      const isFullImage =
        completedCrop.x === 0 &&
        completedCrop.y === 0 &&
        Math.round(completedCrop.width) === 100 &&
        Math.round(completedCrop.height) === 100 &&
        completedCrop.unit === '%';
      if (isFullImage) {
        // Just use the original image as selected
        setSelectedImages((prev) => [...prev, cropImage!]);
        setCroppedImageUrl(cropImage!);
      } else {
        const croppedUrl = await getCroppedImg(cropImageRef, completedCrop);
        if (croppedUrl) {
          // Convert the croppedUrl (object URL) to a Blob
          const response = await fetch(croppedUrl);
          const blob = await response.blob();
          // Generate a unique filename
          const fileName = typeof crypto !== 'undefined' && crypto.randomUUID
            ? `cropped_${crypto.randomUUID()}.jpg`
            : `cropped_${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
          // Use the new folder structure
          const folder = `DEPLOYED IMAGES/${brandFolderMap[brand] || brand}`;
          const filePath = `${folder}/${fileName}`;
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage.from('product-images').upload(filePath, blob, { contentType: 'image/jpeg' });
          if (!error) {
            const publicUrl = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
            setSelectedImages((prev) => [...prev, publicUrl]);
            setCroppedImageUrl(publicUrl);
          } else {
            alert('Image upload failed. ' + (error.message || JSON.stringify(error) || 'Please try again.'));
          }
        }
      }
    }
    setCropModalOpen(false);
    setCropImage(null);
    setCroppingIdx(null);
    setCropImageRef(null);
  };

  return (
    <div className="h-screen bg-darkBlue overflow-y-auto">
      <div className="w-full bg-[#161e2e] px-8 py-10 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#3390ff]">Add New Product</h2>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8ec0ff] mb-1">Product Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-[#22304a] border border-[#22304a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3390ff] text-white placeholder-[#8ec0ff]"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8ec0ff] mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-[#22304a] border border-[#22304a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3390ff] text-white placeholder-[#8ec0ff]"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8ec0ff] mb-1">Price (₱)</label>
            <input
              type="number"
              className="w-full px-4 py-2 bg-[#22304a] border border-[#22304a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3390ff] text-white placeholder-[#8ec0ff]"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8ec0ff] mb-1">Sizes & Stock</label>
            {sizes.map((s, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select
                  className="w-1/2 px-3 py-2 bg-[#22304a] border border-[#22304a] rounded-md text-white placeholder-[#8ec0ff]"
                  value={s.size}
                  onChange={e => {
                    const newSizes = [...sizes];
                    newSizes[idx].size = e.target.value;
                    setSizes(newSizes);
                  }}
                  required
                >
                  <option value="">Select size</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="2XL">2XL</option>
                </select>
                <input
                  type="number"
                  placeholder="Stock"
                  className="w-1/2 px-3 py-2 bg-[#22304a] border border-[#22304a] rounded-md text-white placeholder-[#8ec0ff]"
                  value={s.stock}
                  onChange={e => {
                    const newSizes = [...sizes];
                    newSizes[idx].stock = e.target.value;
                    setSizes(newSizes);
                  }}
                />
                {sizes.length > 1 && (
                  <button type="button" onClick={() => setSizes(sizes.filter((_, i) => i !== idx))} className="text-red-400 font-bold px-2">×</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setSizes([...sizes, { size: '', stock: '' }])} className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold">+ Add Size</button>
          </div>
          <div className="mb-4">
            <label htmlFor="color" className="block text-[#60A5FA] font-medium mb-2">Color</label>
            <input
              id="color"
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#101828] text-[#60A5FA] border border-[#22304a] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
              placeholder="Enter product color (e.g. Black, Red)"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8ec0ff] mb-1">Brand</label>
            <select
              className="w-full px-4 py-2 bg-[#22304a] border border-[#22304a] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3390ff]"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              required
            >
              <option value="">Select a brand</option>
              {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8ec0ff] mb-1">Select Product Images</label>
            <p className="text-xs text-[#8ec0ff] mb-2">Please select a brand to view images.</p>
            {loadingImages ? (
              <div className="text-gray-500 text-sm">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-gray-500 text-sm">Please select a brand to view images.</div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {images.map((img, idx) => (
                  <img
                    key={img}
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className={`w-20 h-20 object-contain rounded-md border-2 cursor-pointer ${selectedImages.includes(img) ? 'border-blue-500' : 'border-gray-200'}`}
                    onClick={() => handleImageClick(img, idx)}
                  />
                ))}
              </div>
            )}
          </div>
          {selectedImages.length > 0 && (
            <div className="mt-4 border border-blue-200 rounded-md p-2 bg-blue-50">
              <div className="text-xs font-semibold text-blue-700 mb-2">Image Selected</div>
              <div className="flex gap-2 overflow-x-auto">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative inline-block">
                    <img src={img} alt="Selected" className="w-16 h-16 object-contain rounded border border-blue-400" />
                    <button
                      type="button"
                      onClick={() => setSelectedImages(selectedImages.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 shadow"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              className="accent-[#3390ff] w-4 h-4"
            />
            <span className="text-[#8ec0ff] text-sm">Featured Product (also show in homepage featured section)</span>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="flex-1 bg-[#3390ff] hover:bg-[#2360b7] text-white py-3 px-4 rounded-md font-semibold text-lg shadow"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Product"}
            </button>
            <button
              type="button"
              className="flex-1 bg-[#22304a] hover:bg-[#2a3a5a] text-[#8ec0ff] py-3 px-4 rounded-md font-semibold text-lg shadow"
              onClick={() => router.push('/admin/products')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
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
          <button
            onClick={() => setCropConfig({ unit: '%', x: 0, y: 0, width: 100, height: 100 })}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Fit to Image
          </button>
          <button onClick={handleCropComplete} className="px-4 py-2 bg-blue-600 text-white rounded">Crop & Select</button>
        </div>
      </Modal>
    </div>
  );
} 