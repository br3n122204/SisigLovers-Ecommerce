"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  brand?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "products"));
      const items: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name,
          price: data.price,
          stock: data.stock,
          imageUrl: data.imageUrl,
          brand: data.brand,
        });
      });
      setProducts(items);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({ name: product.name, price: product.price, stock: product.stock });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    await updateDoc(doc(db, "products", id), {
      name: editValues.name,
      price: Number(editValues.price),
      stock: Number(editValues.stock),
    });
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...editValues, price: Number(editValues.price), stock: Number(editValues.stock) } : p
      )
    );
    setEditingId(null);
    setEditValues({});
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    await deleteDoc(doc(db, 'products', id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <div className="p-8">Loading products...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Manage Products</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr>
              <th className="p-3 border-b">Image</th>
              <th className="p-3 border-b">Name</th>
              <th className="p-3 border-b">Brand</th>
              <th className="p-3 border-b">Price</th>
              <th className="p-3 border-b">Stock</th>
              <th className="p-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="p-3">
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-contain rounded" />
                </td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <input
                      className="border px-2 py-1 rounded w-32"
                      value={editValues.name || ""}
                      onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                    />
                  ) : (
                    product.name
                  )}
                </td>
                <td className="p-3">{product.brand || "-"}</td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      className="border px-2 py-1 rounded w-20"
                      value={editValues.price ?? ""}
                      onChange={e => setEditValues(v => ({ ...v, price: Number(e.target.value) }))}
                    />
                  ) : (
                    `₱${product.price}`
                  )}
                </td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      className="border px-2 py-1 rounded w-16"
                      value={editValues.stock ?? ""}
                      onChange={e => setEditValues(v => ({ ...v, stock: Number(e.target.value) }))}
                    />
                  ) : (
                    product.stock
                  )}
                </td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <>
                      <Button
                        className="mr-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => saveEdit(product.id)}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white mr-2"
                        onClick={() => startEdit(product)}
                      >
                        Edit
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => deleteProduct(product.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 