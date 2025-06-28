"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, Timestamp, where } from "firebase/firestore";
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
// You can create placeholder components for Analytics and Activities for now

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
    <div className="flex min-h-screen w-full bg-black">
      <AdminSidebar />
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
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-[#8ec0ff]">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      <p>Analytics content goes here.</p>
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

  const ADMIN_UID = "1BeqoY3h5gTa4LBUsAiaDLHHhnT2";

  const handleLogin = async (email: string, password: string) => {
    try {
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

  // Fetch total sales amount from completed sales
  const fetchTotalSalesAmount = async () => {
    const activitiesRef = collection(db, "activities");
    const q = query(activitiesRef, where("type", "==", "purchase"), where("status", "==", "completed"));
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
    <div className="flex min-h-screen w-full bg-black">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 w-full h-screen bg-[#161e2e] px-8 py-10 flex flex-col">
        {content}
      </main>
    </div>
  ) : <LoginForm onLogin={handleLogin} />;
} 