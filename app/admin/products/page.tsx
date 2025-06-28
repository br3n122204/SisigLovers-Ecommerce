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
  imageUrl?: string;
  imageUrls?: string[];
  brand?: string;
  sizes?: { size: string; stock: number }[];
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
      const querySnapshot = await getDocs(collection(db, "adminProducts"));
      const items: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name,
          price: data.price,
          stock: data.stock,
          imageUrl: data.imageUrl,
          imageUrls: data.imageUrls,
          brand: data.brand,
          sizes: data.sizes,
        });
      });
      setProducts(items);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({
      name: product.name,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes ? product.sizes.map(s => ({ ...s })) : undefined,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const updateData: any = {
      name: editValues.name,
      price: Number(editValues.price),
      stock: Number(editValues.stock),
    };
    if (editValues.sizes) {
      updateData.sizes = editValues.sizes.map(s => ({ size: s.size, stock: Number(s.stock) }));
    }
    await updateDoc(doc(db, "adminProducts", id), updateData);
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...editValues, price: Number(editValues.price), stock: Number(editValues.stock), sizes: editValues.sizes ? editValues.sizes.map(s => ({ ...s, stock: Number(s.stock) })) : undefined } : p
      )
    );
    setEditingId(null);
    setEditValues({});
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    await deleteDoc(doc(db, 'adminProducts', id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <div className="p-8 text-[#8ec0ff]">Loading products...</div>;

  return (
    <div className="w-full h-screen flex bg-black">
      <div className="w-full h-full bg-[#161e2e] px-8 py-10 flex flex-col">
        <h1 className="text-3xl font-bold mb-8 text-[#3390ff]">Manage Products</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#161e2e] border border-[#22304a] rounded-lg text-white">
            <thead>
              <tr className="bg-[#22304a] text-[#8ec0ff]">
                <th className="p-3 border-b border-[#22304a] text-center">Image</th>
                <th className="p-3 border-b border-[#22304a] text-left">Name</th>
                <th className="p-3 border-b border-[#22304a] text-left">Brand</th>
                <th className="p-3 border-b border-[#22304a] text-left">Price</th>
                <th className="p-3 border-b border-[#22304a] text-left">Stock</th>
                <th className="p-3 border-b border-[#22304a] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[#22304a] hover:bg-[#1e293b] transition-colors">
                  <td className="px-4 py-2 text-center">
                    <img
                      src={Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? product.imageUrls[0] : '/images/placeholder.jpg'}
                      alt={product.name}
                      className="w-12 h-12 object-contain rounded bg-[#22304a]"
                    />
                  </td>
                  <td className="p-3">
                    {editingId === product.id ? (
                      <input
                        className="bg-[#22304a] border border-[#22304a] px-2 py-1 rounded w-32 text-white"
                        value={editValues.name || ""}
                        onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                      />
                    ) : (
                      <span className="font-semibold text-white">{product.name}</span>
                    )}
                  </td>
                  <td className="p-3 text-[#8ec0ff]">{product.brand || "-"}</td>
                  <td className="p-3">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        className="bg-[#22304a] border border-[#22304a] px-2 py-1 rounded w-20 text-white"
                        value={editValues.price ?? ""}
                        onChange={e => setEditValues(v => ({ ...v, price: Number(e.target.value) }))}
                      />
                    ) : (
                      <span className="font-semibold text-[#3390ff]">₱{product.price}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingId === product.id ? (
                      editValues.sizes && editValues.sizes.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {(editValues.sizes || []).map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                className="bg-[#22304a] border border-[#22304a] px-2 py-1 rounded w-12 text-xs font-semibold text-center text-white"
                                value={s.size}
                                placeholder="Size"
                                onChange={e => {
                                  const newSizes = [...(editValues.sizes || [])];
                                  newSizes[i].size = e.target.value.toUpperCase();
                                  setEditValues(v => ({ ...v, sizes: newSizes }));
                                }}
                              />
                              <input
                                type="number"
                                className="bg-[#22304a] border border-[#22304a] px-2 py-1 rounded w-16 text-white"
                                value={s.stock}
                                min={0}
                                placeholder="Stock"
                                onChange={e => {
                                  const newSizes = [...(editValues.sizes || [])];
                                  newSizes[i].stock = Number(e.target.value);
                                  setEditValues(v => ({ ...v, sizes: newSizes }));
                                }}
                              />
                              <button
                                type="button"
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                onClick={() => {
                                  const newSizes = [...(editValues.sizes || [])];
                                  newSizes.splice(i, 1);
                                  setEditValues(v => ({ ...v, sizes: newSizes }));
                                }}
                                disabled={(editValues.sizes || []).length === 1}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="mt-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs w-fit"
                            onClick={() => setEditValues(v => ({ ...v, sizes: [...(v.sizes || []), { size: '', stock: 0 }] }))}
                          >
                            + Add Size
                          </button>
                        </div>
                      ) : (
                        <input
                          type="number"
                          className="bg-[#22304a] border border-[#22304a] px-2 py-1 rounded w-16 text-white"
                          value={editValues.stock ?? ""}
                          onChange={e => setEditValues(v => ({ ...v, stock: Number(e.target.value) }))}
                        />
                      )
                    ) : (
                      product.sizes && product.sizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.map((s, i) => (
                            <span key={i} className="text-xs bg-[#22304a] text-[#8ec0ff] rounded px-2 py-1 inline-block font-semibold">{s.size}: {s.stock}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white">{product.stock}</span>
                      )
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
                          className="border border-[#22304a] text-[#8ec0ff] hover:bg-[#22304a]"
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
    </div>
  );
} 