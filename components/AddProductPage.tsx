"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    color: "",
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      "2XL": 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSizeChange = (size: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: parseInt(value) || 0
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, "adminProducts"), productData);

      toast({
        title: "Success",
        description: "Product added successfully!",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        color: "",
        sizes: {
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          "2XL": 0
        }
      });

    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#161e2e] rounded-lg shadow-lg p-6 border border-[#22304a]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#8ec0ff] mb-2">Add New Product</h1>
        <p className="text-[#8ec0ff] opacity-75">Add a new product to your inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#8ec0ff]">Product Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="bg-[#22304a] border-[#22304a] text-white placeholder-[#8ec0ff] focus:border-[#3390ff]"
              placeholder="Enter product name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-[#8ec0ff]">Price (₱)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={handleInputChange}
              className="bg-[#22304a] border-[#22304a] text-white placeholder-[#8ec0ff] focus:border-[#3390ff]"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-[#8ec0ff]">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="bg-[#22304a] border-[#22304a] text-white focus:border-[#3390ff]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#22304a] border-[#22304a]">
                <SelectItem value="shirts">Shirts</SelectItem>
                <SelectItem value="pants">Pants</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="shoes">Shoes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-[#8ec0ff]">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              required
              value={formData.imageUrl}
              onChange={handleInputChange}
              className="bg-[#22304a] border-[#22304a] text-white placeholder-[#8ec0ff] focus:border-[#3390ff]"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className="text-[#8ec0ff]">Color</Label>
            <Input
              id="color"
              name="color"
              type="text"
              required
              value={formData.color}
              onChange={handleInputChange}
              className="bg-[#22304a] border-[#22304a] text-white placeholder-[#8ec0ff] focus:border-[#3390ff]"
              placeholder="Enter product color (e.g. Black, Red)"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-[#8ec0ff]">Description</Label>
          <Textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleInputChange}
            className="bg-[#22304a] border-[#22304a] text-white placeholder-[#8ec0ff] focus:border-[#3390ff] min-h-[100px]"
            placeholder="Enter product description..."
          />
        </div>

        <div className="space-y-4">
          <Label className="text-[#8ec0ff]">Sizes & Stock</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(formData.sizes).map(([size, stock]) => (
              <div key={size} className="space-y-2">
                <Label htmlFor={`size-${size}`} className="text-[#8ec0ff] text-sm">{size}</Label>
                <Input
                  id={`size-${size}`}
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => handleSizeChange(size, e.target.value)}
                  className="bg-[#22304a] border-[#22304a] text-white placeholder-[#8ec0ff] focus:border-[#3390ff]"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#3390ff] hover:bg-[#2360b7] text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50"
          >
            {isLoading ? "Adding Product..." : "Add Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: "",
                description: "",
                price: "",
                category: "",
                imageUrl: "",
                color: "",
                sizes: {
                  S: 0,
                  M: 0,
                  L: 0,
                  XL: 0,
                  "2XL": 0
                }
              });
            }}
            className="border-[#22304a] text-[#8ec0ff] hover:bg-[#22304a]"
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  );
} 