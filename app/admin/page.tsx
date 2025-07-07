"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, Timestamp, where, setDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/AdminSidebar";
import AddProductPage from "./add-product/page";
import AdminProductsPage from "./products/page";
import AdminOrdersPage from "./orders/page";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Menu, ChevronLeft } from "lucide-react";
import { getDocs as fsGetDocs } from "firebase/firestore";

interface User {
  id: string;
  email: string;
  createdAt: Timestamp;
}

interface Activity {
  id: string;
  type: string;
  email: string;
  uid: string;
  timestamp: Timestamp;
  orderId?: string;
  total?: number;
  items?: any[];
}

interface ActivitiesSectionProps {
  recentActivities: Activity[];
  isLoadingActivities: boolean;
  fetchRecentActivities: () => void;
}

// Separate LoginForm component to isolate input handling
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<boolean> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    const success = await onLogin(email, password);
    if (!success) {
      setError("Wrong admin user or password.");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#161e2e]">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-[#161e2e] rounded-2xl shadow-2xl border border-[#22304a]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-[#3390ff]">DPT ONE Admin</h2>
            <p className="text-[#8ec0ff]">Administrator Access Required</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                className="w-full px-4 py-2 bg-[#22304a] border border-[#22304a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3390ff] text-white placeholder-[#8ec0ff]"
                placeholder="Admin Email"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="w-full px-4 py-2 bg-[#22304a] border border-[#22304a] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3390ff] text-white placeholder-[#8ec0ff]"
                placeholder="Admin Password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm text-center p-2 bg-[#2a1a1a] rounded-md">
                {error}
              </div>
            )}
            <button
              type="submit"
              className={`w-full bg-[#3390ff] text-white py-3 px-4 rounded-md font-semibold hover:bg-[#2360b7] focus:outline-none focus:ring-2 focus:ring-[#3390ff] focus:ring-offset-2 transition-colors duration-200 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
            </button>
          </form>
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-[#8ec0ff] hover:underline text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function AnalyticsSection() {
  const [chartType, setChartType] = React.useState<'sales' | 'quantity' | 'inventory' | 'feedback' | 'weekly' | 'monthly'>('sales');
  const [salesData, setSalesData] = React.useState<{ month: string; sales: number; quantity: number }[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = React.useState<any[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = React.useState<any[]>([]);
  const [bestSellingTshirts, setBestSellingTshirts] = React.useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = React.useState(false);
  const { recentUsers = [], totalProducts = 0, totalSalesAmount = 0 } = React.useContext(AdminAnalyticsContext) || {};
  const [weeklySalesData, setWeeklySalesData] = React.useState<{ day: string; sales: number }[]>([]);
  const [selectedMonth, setSelectedMonth] = React.useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });
  const [monthlySalesData, setMonthlySalesData] = React.useState<{ day: string; sales: number }[]>([]);
  const [availableMonths, setAvailableMonths] = React.useState<{ month: number; year: number }[]>([]);

  React.useEffect(() => {
    // Fetch sales data grouped by month from the 'sales' collection
    async function fetchSalesData() {
      const salesRef = collection(db, 'sales');
      const q = query(salesRef);
      const querySnapshot = await getDocs(q);
      const salesByMonth: { [month: string]: { sales: number; quantity: number } } = {};
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && (data.total || data.quantity || data.items)) {
          const date = data.timestamp.toDate();
          const month = date.toLocaleString('default', { month: 'short' });
          if (!salesByMonth[month]) salesByMonth[month] = { sales: 0, quantity: 0 };
          if (typeof data.total === 'number') salesByMonth[month].sales += data.total;
          else if (typeof data.total === 'string') {
            const parsed = parseFloat(data.total.replace(/[^0-9.]/g, ''));
            if (!isNaN(parsed)) salesByMonth[month].sales += parsed;
          }
          let quantity = 0;
          if (typeof data.quantity === 'number') {
            quantity = data.quantity;
          } else if (Array.isArray(data.items)) {
            quantity = data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
          }
          salesByMonth[month].quantity += quantity;
        }
      });
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const salesArr = months.map(month => ({
        month,
        sales: salesByMonth[month]?.sales || 0,
        quantity: salesByMonth[month]?.quantity || 0,
      }));
      setSalesData(salesArr);
    }
    fetchSalesData();
  }, []);

  // Inventory analytics logic
  React.useEffect(() => {
    if (chartType !== 'inventory') return;
    setLoadingInventory(true);
    async function fetchInventoryAnalytics() {
      // Fetch all products
      const q = query(collection(db, 'adminProducts'));
      const querySnapshot = await getDocs(q);
      const allProducts: any[] = [];
      querySnapshot.forEach((docSnap) => {
        allProducts.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(allProducts);
      // Low stock: any size with stock > 0 and <= 5, or totalStock > 0 and <= 5
      const lowStock = allProducts
        .map(p => {
          if (Array.isArray(p.sizes)) {
            // Find all sizes with stock > 0 and <= 5
            const lowSizes = p.sizes.filter((size: any) => Number(size.stock) > 0 && Number(size.stock) <= 5);
            if (lowSizes.length > 0) {
              return { ...p, lowStockSizes: lowSizes };
            }
            return null;
          } else if (typeof p.totalStock === 'number') {
            if (p.totalStock > 0 && p.totalStock <= 5) {
              return { ...p, lowStockSizes: null };
            }
            return null;
          } else if (typeof p.stock === 'number') {
            if (p.stock > 0 && p.stock <= 5) {
              return { ...p, lowStockSizes: null };
            }
            return null;
          }
          return null;
        })
        .filter(Boolean);
      setLowStockProducts(lowStock);
      // Out of stock: totalStock === 0, or all sizes stock === 0, or stock === 0
      const outOfStock = allProducts.filter(p => {
        if (typeof p.totalStock === 'number') {
          return p.totalStock === 0;
        } else if (Array.isArray(p.sizes)) {
          return !p.sizes.some((size: any) => Number(size.stock) > 0);
        } else {
          return !p.stock || Number(p.stock) === 0;
        }
      });
      setOutOfStockProducts(outOfStock);
      // Only consider t-shirts/shirts from adminProducts that have been purchased >= 20 times (using purchasedCount)
      const tshirtSales = allProducts
        .filter(p => p.name && p.name.toLowerCase().includes('shirt') && (p.purchasedCount || 0) >= 20)
        .map(p => ({
          name: p.name,
          quantity: p.purchasedCount || 0,
          imageUrl: Array.isArray(p.imageUrls) && p.imageUrls.length > 0 ? p.imageUrls[0] : (p.imageUrl || p.image || null),
          productId: p.id
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      setBestSellingTshirts(tshirtSales);

      // Update AdminAnalytics/bestSellingShirts subcollection
      try {
        const analyticsDocRef = doc(db, "AdminAnalytics", "main");
        const bestSellingShirtsColRef = collection(analyticsDocRef, "bestSellingShirts");
        // Remove previous docs in the subcollection
        const prevDocs = await fsGetDocs(bestSellingShirtsColRef);
        for (const d of prevDocs.docs) {
          await deleteDoc(d.ref);
        }
        // Add new top t-shirts
        for (const shirt of tshirtSales) {
          await setDoc(doc(bestSellingShirtsColRef, shirt.productId), shirt);
        }
      } catch (err) {
        console.error("Failed to update bestSellingShirts subcollection:", err);
      }

      // Update purchasedCount for all products in adminProducts
      try {
        for (const product of allProducts) {
          const sales = salesMap[product.name];
          const purchasedCount = sales ? sales.quantity : 0;
          const productRef = doc(db, "adminProducts", product.id);
          await updateDoc(productRef, { purchasedCount });
        }
      } catch (err) {
        console.error("Failed to update purchasedCount in adminProducts:", err);
      }
      setLoadingInventory(false);
    }
    fetchInventoryAnalytics();
  }, [chartType]);

  // Fetch weekly and monthly sales data
  React.useEffect(() => {
    async function fetchWeeklyAndMonthlySales() {
      const salesRef = collection(db, 'sales');
      const q = query(salesRef);
      const querySnapshot = await getDocs(q);
      const now = new Date();
      // Weekly
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Sunday
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekly: { [day: string]: number } = {};
      weekDays.forEach(day => (weekly[day] = 0));
      // Monthly
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysInMonth = monthEnd.getDate();
      const monthly: { [day: string]: number } = {};
      for (let i = 1; i <= daysInMonth; i++) monthly[i] = 0;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && (data.total || data.quantity || data.items)) {
          const date = data.timestamp.toDate();
          // Weekly
          if (date >= weekStart && date <= weekEnd) {
            const day = weekDays[date.getDay()];
            let sale = 0;
            if (typeof data.total === 'number') sale = data.total;
            else if (typeof data.total === 'string') {
              const parsed = parseFloat(data.total.replace(/[^0-9.]/g, ''));
              if (!isNaN(parsed)) sale = parsed;
            }
            weekly[day] += sale;
          }
          // Monthly
          if (date >= monthStart && date <= monthEnd) {
            const day = date.getDate();
            let sale = 0;
            if (typeof data.total === 'number') sale = data.total;
            else if (typeof data.total === 'string') {
              const parsed = parseFloat(data.total.replace(/[^0-9.]/g, ''));
              if (!isNaN(parsed)) sale = parsed;
            }
            monthly[day] += sale;
          }
        }
      });
      setWeeklySalesData(weekDays.map(day => ({ day, sales: weekly[day] })));
      setMonthlySalesData(Array.from({ length: daysInMonth }, (_, i) => ({ day: (i + 1).toString(), sales: monthly[i + 1] })));
    }
    fetchWeeklyAndMonthlySales();
  }, []);

  // Fetch available months and monthly sales data for the selected month
  React.useEffect(() => {
    async function fetchAvailableMonthsAndSales() {
      const salesRef = collection(db, 'sales');
      const q = query(salesRef);
      const querySnapshot = await getDocs(q);
      // Find all unique months with sales
      const monthsSet = new Set<string>();
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          monthsSet.add(`${date.getFullYear()}-${date.getMonth()}`);
        }
      });
      let monthsArr = Array.from(monthsSet).map(str => {
        const [year, month] = str.split('-').map(Number);
        return { month, year };
      });
      // Sort descending (latest first)
      monthsArr = monthsArr.sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
      // Limit to last 12 months
      monthsArr = monthsArr.slice(0, 12);
      setAvailableMonths(monthsArr);
      // If current selectedMonth is not in available, default to latest
      if (!monthsArr.some(m => m.month === selectedMonth.month && m.year === selectedMonth.year) && monthsArr.length > 0) {
        setSelectedMonth(monthsArr[0]);
      }
      // Prepare monthly sales data for selected month
      const { month, year } = monthsArr.find(m => m.month === selectedMonth.month && m.year === selectedMonth.year) || monthsArr[0] || { month: (new Date()).getMonth(), year: (new Date()).getFullYear() };
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const daysInMonth = monthEnd.getDate();
      const monthly: { [day: string]: number } = {};
      for (let i = 1; i <= daysInMonth; i++) monthly[i] = 0;
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && (data.total || data.quantity || data.items)) {
          const date = data.timestamp.toDate();
          if (date >= monthStart && date <= monthEnd) {
            const day = date.getDate();
            let sale = 0;
            if (typeof data.total === 'number') sale = data.total;
            else if (typeof data.total === 'string') {
              const parsed = parseFloat(data.total.replace(/[^0-9.]/g, ''));
              if (!isNaN(parsed)) sale = parsed;
            }
            monthly[day] += sale;
          }
        }
      });
      setMonthlySalesData(Array.from({ length: daysInMonth }, (_, i) => ({ day: (i + 1).toString(), sales: monthly[i + 1] })));
    }
    if (chartType === 'monthly') {
      fetchAvailableMonthsAndSales();
    }
  }, [chartType, selectedMonth]);

  return (
    <div className="w-full h-full flex flex-col gap-8 text-[#8ec0ff]">
      {/* Top Stats */}
      <div className="flex flex-wrap gap-6 justify-center mb-8">
        <div className="bg-[#22304a] rounded-lg p-6 min-w-[180px] text-center shadow">
          <div className="text-lg font-semibold">Customers</div>
          <div className="text-3xl font-bold mt-2">{recentUsers.length}</div>
        </div>
        <div className="bg-[#22304a] rounded-lg p-6 min-w-[180px] text-center shadow">
          <div className="text-lg font-semibold">Products</div>
          <div className="text-3xl font-bold mt-2">{totalProducts}</div>
        </div>
        <div className="bg-[#22304a] rounded-lg p-6 min-w-[180px] text-center shadow">
          <div className="text-lg font-semibold">Total Sales</div>
          <div className="text-3xl font-bold mt-2">₱{totalSalesAmount.toLocaleString()}</div>
        </div>
      </div>
      {/* Chart Type Selector */}
      <div className="flex justify-end max-w-3xl mx-auto mb-2 gap-2">
        <Select value={chartType} onValueChange={v => setChartType(v as 'sales' | 'quantity' | 'inventory' | 'feedback' | 'weekly' | 'monthly')}>
          <SelectTrigger className="w-56 bg-[#22304a] border border-[#60A5FA] text-[#8ec0ff]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Total Sales (₱)</SelectItem>
            <SelectItem value="quantity">Products Purchased</SelectItem>
            <SelectItem value="weekly">Weekly Sales</SelectItem>
            <SelectItem value="monthly">Monthly Sales</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="feedback">Feedback</SelectItem>
          </SelectContent>
        </Select>
        {/* Month selector, only show for Monthly Sales */}
        {chartType === 'monthly' && (
          <Select
            value={`${selectedMonth.year}-${selectedMonth.month}`}
            onValueChange={v => {
              const [year, month] = v.split('-').map(Number);
              setSelectedMonth({ year, month });
            }}
          >
            <SelectTrigger className="w-40 bg-[#22304a] border border-[#60A5FA] text-[#8ec0ff]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(m => (
                <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{`${new Date(m.year, m.month).toLocaleString('default', { month: 'short', year: 'numeric' })}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {/* Analytics Content */}
      {chartType === 'inventory' ? (
        <div className="bg-[#22304a] rounded-lg p-6 w-full max-w-3xl mx-auto shadow flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Low Stock Alerts */}
            <div className="flex-1 bg-[#19223a] rounded-lg p-4 shadow flex flex-col">
              <div className="text-lg font-semibold mb-2 text-[#8ec0ff]">Low Stock Alerts (≤ 5)</div>
              {loadingInventory ? (
                <div className="text-[#8ec0ff]">Loading...</div>
              ) : lowStockProducts.length === 0 ? (
                <div className="text-[#8ec0ff]">No low stock products.</div>
              ) : (
                <ul className="list-disc pl-6 text-sm">
                  {lowStockProducts.map((p: any) => {
                    const imgSrc = (Array.isArray(p.imageUrls) && p.imageUrls.length > 0)
                      ? p.imageUrls[0]
                      : (p.image || p.imageUrl || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null));
                    return (
                      <li key={p.id} className="mb-1 flex items-center gap-2">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={p.name}
                            className="w-8 h-8 object-cover rounded bg-[#161e2e] border border-[#22304a]"
                            style={{ minWidth: 32, minHeight: 32 }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#22304a] flex items-center justify-center text-xs text-[#8ec0ff] border border-[#22304a]" style={{ minWidth: 32, minHeight: 32 }}>
                            N/A
                          </div>
                        )}
                        <span className="font-semibold text-white">{p.name}</span>
                        {Array.isArray(p.lowStockSizes) && p.lowStockSizes.length > 0 ? (
                          <span className="text-[#60A5FA]"> [
                            {p.lowStockSizes.map((s: any) => `${s.size}: ${s.stock}`).join(', ')}
                          ]</span>
                        ) : p.lowStockSizes === null ? (
                          <span className="text-[#60A5FA]"> ({p.totalStock ?? p.stock} left)</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {/* Out of Stock Products */}
            <div className="flex-1 bg-[#19223a] rounded-lg p-4 shadow flex flex-col">
              <div className="text-lg font-semibold mb-2 text-[#8ec0ff]">Out of Stock Products</div>
              {loadingInventory ? (
                <div className="text-[#8ec0ff]">Loading...</div>
              ) : outOfStockProducts.length === 0 ? (
                <div className="text-[#8ec0ff]">No out of stock products.</div>
              ) : (
                <ul className="list-disc pl-6 text-sm">
                  {outOfStockProducts.map((p: any) => {
                    const imgSrc = (Array.isArray(p.imageUrls) && p.imageUrls.length > 0)
                      ? p.imageUrls[0]
                      : (p.image || p.imageUrl || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null));
                    return (
                      <li key={p.id} className="mb-1 flex items-center gap-2 font-semibold text-white">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={p.name}
                            className="w-8 h-8 object-cover rounded bg-[#161e2e] border border-[#22304a]"
                            style={{ minWidth: 32, minHeight: 32 }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-[#22304a] flex items-center justify-center text-xs text-[#8ec0ff] border border-[#22304a]" style={{ minWidth: 32, minHeight: 32 }}>
                            N/A
                          </div>
                        )}
                        <span>{p.name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          {/* Best Selling T-shirt (full width) */}
          <div className="bg-[#19223a] rounded-lg p-4 shadow flex flex-col items-center">
            <div className="text-lg font-semibold mb-2 text-[#8ec0ff]">Top 5 Best Selling T-shirts (Purchased Count ≥ 20)</div>
            {loadingInventory ? (
              <div className="text-[#8ec0ff]">Loading...</div>
            ) : bestSellingTshirts.length > 0 ? (
              <ul className="w-full max-w-md mx-auto">
                {bestSellingTshirts.map((t, idx) => (
                  <li key={t.productId} className="flex items-center gap-4 mb-2 p-2 rounded bg-[#22304a]">
                    <span className="font-bold text-xl text-[#60A5FA]">{idx + 1}.</span>
                    {t.imageUrl && <img src={t.imageUrl} alt={t.name} className="w-10 h-10 object-contain rounded bg-[#161e2e]" />}
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="text-[#60A5FA] ml-auto">Purchased: {t.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[#8ec0ff]">No t-shirt sales data.</div>
            )}
          </div>
        </div>
      ) : chartType === 'feedback' ? (
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          {/* Top Row: Ratings and Returns */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Average Product Ratings */}
            <div className="flex-1 bg-[#19223a] rounded-lg p-6 shadow flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl text-[#ffe066]">★</span>
                <span className="text-xl font-semibold text-white">Average Product Ratings</span>
              </div>
              <div className="flex flex-col gap-2">
                {/* Mock data */}
                <div className="flex items-center gap-2">
                  <span className="text-[#cbd5e1] font-medium">Premium T-Shirt</span>
                  <span className="text-[#ffe066] flex items-center">{'★'.repeat(5)}</span>
                  <span className="text-white font-semibold ml-1">4.8</span>
                  <span className="text-[#8ec0ff] text-sm">(24 reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#cbd5e1] font-medium">Classic Hoodie</span>
                  <span className="text-[#ffe066] flex items-center">{'★'.repeat(4)}<span className="text-[#334155]">★</span></span>
                  <span className="text-white font-semibold ml-1">4.2</span>
                  <span className="text-[#8ec0ff] text-sm">(18 reviews)</span>
                </div>
              </div>
            </div>
            {/* Returns & Refunds */}
            <div className="flex-1 bg-[#19223a] rounded-lg p-6 shadow flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl text-[#8ec0ff]">↻</span>
                <span className="text-xl font-semibold text-white">Returns & Refunds</span>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#cbd5e1]">Returns This Month</span>
                  <span className="text-2xl font-bold text-[#f87171]">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#cbd5e1]">Refund Rate</span>
                  <span className="text-xl font-bold text-[#fb7185]">0.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#cbd5e1]">Total Refunded</span>
                  <span className="text-2xl font-bold text-[#f87171]">₱1,200</span>
                </div>
              </div>
            </div>
          </div>
          {/* Recent Reviews */}
          <div className="bg-[#19223a] rounded-lg p-6 shadow flex flex-col">
            <div className="text-2xl font-semibold text-white mb-4">Recent Reviews</div>
            {/* Mock reviews */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#22304a] rounded p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Maria S. <span className="text-[#ffe066]">{'★'.repeat(5)}</span></span>
                  <span className="text-[#8ec0ff] text-sm">2 days ago</span>
                </div>
                <div className="text-white">Great quality t-shirt! The fabric is soft and the fit is perfect.</div>
                <div className="text-[#8ec0ff] text-sm">Premium T-Shirt</div>
              </div>
              <div className="bg-[#22304a] rounded p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">John D. <span className="text-[#ffe066]">{'★'.repeat(4)}<span className="text-[#334155]">★</span></span></span>
                  <span className="text-[#8ec0ff] text-sm">1 week ago</span>
                </div>
                <div className="text-white">Good hoodie but runs a bit small. Consider sizing up.</div>
                <div className="text-[#8ec0ff] text-sm">Classic Hoodie</div>
              </div>
            </div>
          </div>
        </div>
      ) : chartType === 'weekly' ? (
        <div className="bg-[#22304a] rounded-lg p-6 w-full max-w-3xl mx-auto shadow">
          <div className="text-xl font-semibold mb-4">Weekly Sales</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#8ec0ff" />
              <YAxis 
                stroke="#8ec0ff" 
                tickFormatter={v => {
                  if (v >= 1000) return `₱${v / 1000}K`;
                  if (v === 0) return '₱0';
                  return `₱${v.toLocaleString()}`;
                }}
              />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stroke="#60A5FA" fill="rgba(96,165,250,0.1)" />
              <Line type="monotone" dataKey="sales" stroke="#60A5FA" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartType === 'monthly' ? (
        <div className="bg-[#22304a] rounded-lg p-6 w-full max-w-3xl mx-auto shadow">
          <div className="text-xl font-semibold mb-4">Monthly Sales</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#8ec0ff" />
              <YAxis 
                stroke="#8ec0ff" 
                tickFormatter={v => {
                  if (v >= 1000) return `₱${v / 1000}K`;
                  if (v === 0) return '₱0';
                  return `₱${v.toLocaleString()}`;
                }}
              />
              <Tooltip />
              <Area type="monotone" dataKey="sales" stroke="#60A5FA" fill="rgba(96,165,250,0.1)" />
              <Line type="monotone" dataKey="sales" stroke="#60A5FA" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-[#22304a] rounded-lg p-6 w-full max-w-3xl mx-auto shadow">
          <div className="text-xl font-semibold mb-4">{chartType === 'sales' ? 'Sales Over Time' : 'Products Purchased Over Time'}</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="#8ec0ff" />
              <YAxis 
                stroke="#8ec0ff" 
                tickFormatter={v => {
                  if (chartType === 'sales') {
                    if (v >= 1000) return `₱${v / 1000}K`;
                    if (v === 0) return '₱0';
                    return `₱${v.toLocaleString()}`;
                  } else {
                    return v;
                  }
                }}
              />
              <Tooltip />
              <Area type="monotone" dataKey={chartType} stroke="#60A5FA" fill="rgba(96,165,250,0.1)" />
              <Line type="monotone" dataKey={chartType} stroke="#60A5FA" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ActivitiesSection({ recentActivities, isLoadingActivities, fetchRecentActivities }: ActivitiesSectionProps) {
  return (
    <div className="w-full h-full flex flex-col bg-[#161e2e] rounded-lg shadow-lg p-6 border border-[#22304a] mt-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#8ec0ff]">Recent Activity</h2>
        <button
          onClick={fetchRecentActivities}
          disabled={isLoadingActivities}
          className="text-[#3390ff] hover:text-[#8ec0ff] text-sm font-medium disabled:opacity-50"
        >
          {isLoadingActivities ? "Loading..." : "Refresh"}
        </button>
      </div>
      <div className="space-y-4 flex-1 overflow-y-auto">
        {isLoadingActivities ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3390ff] mx-auto"></div>
            <p className="text-[#8ec0ff] mt-2">Loading recent activities...</p>
          </div>
        ) : recentActivities.length > 0 ? (
          recentActivities.map((activity: Activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-[#22304a] rounded-lg">
              <div>
                {activity.type === "user_created" ? (
                  <>
                    <p className="font-medium text-white">User account created</p>
                    <p className="text-sm text-[#8ec0ff]">Email: {activity.email}</p>
                  </>
                ) : activity.type === "purchase" ? (
                  <>
                    <p className="font-medium text-white">Purchase made</p>
                    <p className="text-sm text-[#8ec0ff]">Email: {activity.email}</p>
                    <p className="text-sm text-[#8ec0ff]">Order ID: {activity.orderId}</p>
                    <p className="text-sm text-[#8ec0ff]">Total: ₱{activity.total}</p>
                  </>
                ) : null}
              </div>
              <span className="text-sm text-[#8ec0ff]">
                {activity.timestamp ? (
                  new Date(activity.timestamp.toDate()).toLocaleString()
                ) : (
                  "Just now"
                )}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-[#8ec0ff]">No recent activities.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Provide AdminAnalyticsContext to AnalyticsSection
const AdminAnalyticsContext = React.createContext<any>(null);

export default function AdminDashboardSinglePage() {
  const { user, loading } = useAuth();
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("add-product");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((open) => !open);

  const ADMIN_UID = "1BeqoY3h5gTa4LBUsAiaDLHHhnT2";

  const handleLogin = async (email: string, password: string) => {
    try {
      // Check for hardcoded admin credentials
      if (email === "sisiglovers@gmail.com" && password === "msadsisiglovers2025") {
        // Optionally, you can sign in with Firebase as well if needed
        // await signInWithEmailAndPassword(auth, email, password);
        return true;
      }
      // Otherwise, proceed with normal sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.uid !== ADMIN_UID) {
        toast({
          title: "Unauthorized",
          description: "You are not authorized to access the admin panel.",
        });
        await signOut(auth);
        return false;
      }
      return true;
    } catch (error: any) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/too-many-requests"
      ) {
        // Do not show toast, let the form show the error
        return false;
      } else {
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login.",
        });
        if (!(error && typeof error === "object" && error.code)) {
          console.error("Login error:", error);
        }
        return false;
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRecentUsers([]);
      setRecentActivities([]);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Fetch recent users from Firestore
  const fetchRecentUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          email: doc.data().email,
          createdAt: doc.data().createdAt
        });
      });
      setRecentUsers(users);
    } catch (error) {
      console.error("Error fetching recent users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch total orders (purchase activities)
  const fetchTotalOrders = async () => {
    const activitiesRef = collection(db, "activities");
    const q = query(activitiesRef, where("type", "==", "purchase"));
    const querySnapshot = await getDocs(q);
    setTotalOrders(querySnapshot.size);
  };

  // Fetch recent activities from Firestore
  const fetchRecentActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const activitiesRef = collection(db, "activities");
      const q = query(activitiesRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const activities: Activity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === "user_created" || data.type === "purchase") {
          activities.push({
            id: doc.id,
            type: data.type,
            email: data.email,
            uid: data.uid,
            timestamp: data.timestamp,
            orderId: data.orderId,
            total: data.total,
            items: data.items,
          });
        }
      });
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Fetch total products from Firestore
  const fetchTotalProducts = async () => {
    const productsRef = collection(db, "adminProducts");
    const querySnapshot = await getDocs(productsRef);
    setTotalProducts(querySnapshot.size);
  };

  // Fetch total completed sales from Firestore
  const fetchTotalSales = async () => {
    const activitiesRef = collection(db, "activities");
    const q = query(activitiesRef, where("type", "==", "purchase"), where("status", "==", "completed"));
    const querySnapshot = await getDocs(q);
    setTotalSales(querySnapshot.size);
  };

  // Fetch total sales amount from sales collection
  const fetchTotalSalesAmount = async () => {
    const salesRef = collection(db, "sales");
    const q = query(salesRef);
    const querySnapshot = await getDocs(q);
    let sum = 0;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (typeof data.total === 'number') {
        sum += data.total;
      } else if (typeof data.total === 'string') {
        const parsed = parseFloat(data.total.replace(/[^\d.]/g, ''));
        if (!isNaN(parsed)) sum += parsed;
      }
    });
    setTotalSalesAmount(sum);
  };

  // Fetch users when authenticated
  useEffect(() => {
    if (user && user.uid === ADMIN_UID) {
      fetchRecentUsers();
      fetchRecentActivities();
      fetchTotalOrders();
      fetchTotalProducts();
      fetchTotalSales();
      fetchTotalSalesAmount();
    }
  }, [user]);

  // Prevent background scroll when sidebar is open (mobile)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sidebarOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    }
    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        document.body.classList.remove('overflow-hidden');
      }
    };
  }, [sidebarOpen]);

  let content;
  switch (activeSection) {
    case "add-product":
      content = <AddProductPage />;
      break;
    case "manage-products":
      content = <AdminProductsPage />;
      break;
    case "manage-orders":
      content = <AdminOrdersPage />;
      break;
    case "view-analytics":
      content = <AnalyticsSection />;
      break;
    case "recent-activities":
      content = <ActivitiesSection recentActivities={recentActivities} isLoadingActivities={isLoadingActivities} fetchRecentActivities={fetchRecentActivities} />;
      break;
    default:
      content = <AddProductPage />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }
  const isAdmin = user && user.uid === ADMIN_UID;
  return isAdmin ? (
    <div className="min-h-screen w-full bg-[#161e2e] flex sm:flex-row flex-col">
      {/* Sidebar: Desktop only (flex child) */}
      <div className="hidden sm:block">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            setSidebarOpen(false); // close sidebar on mobile after navigation
          }}
          onLogout={handleLogout}
        />
      </div>
      {/* Main content: always full width on mobile */}
      <div className="flex-1 w-full bg-[#161e2e] px-2 sm:px-8 py-10 flex flex-col transition-all duration-300">
        {/* Mobile sidebar toggle button */}
        <button
          className="block sm:hidden mb-4 text-[#8ec0ff] self-start z-50"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className="h-7 w-7" />
        </button>
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="h-full overflow-y-auto">
              <AdminSidebar
                activeSection={activeSection}
                onSectionChange={(section) => {
                  setActiveSection(section);
                  setSidebarOpen(false);
                }}
                onLogout={handleLogout}
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
              />
            </div>
            {/* Overlay background to close sidebar */}
            <div className="flex-1 bg-black bg-opacity-40" onClick={toggleSidebar} />
          </div>
        )}
        <AdminAnalyticsContext.Provider value={{ recentUsers, totalProducts, totalSalesAmount }}>
          {content}
        </AdminAnalyticsContext.Provider>
      </div>
    </div>
  ) : <LoginForm onLogin={handleLogin} />;
} 