"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

// Separate LoginForm component to isolate input handling
function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => void }) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    onLogin(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">DPT ONE Admin</h2>
          <p className="text-gray-600">Administrator Access Required</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Admin Password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className={`w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Access Admin Panel"}
          </button>
        </form>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

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
      }
    } catch (error: any) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
        });
      } else {
        toast({
          title: "Login failed",
          description: error.message || "An error occurred during login.",
        });
      }
      console.error("Login error:", error);
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

  // Fetch users when authenticated
  useEffect(() => {
    if (user && user.uid === ADMIN_UID) {
      fetchRecentUsers();
      fetchRecentActivities();
      fetchTotalOrders();
    }
  }, [user]);

  // Admin Dashboard Content
  const AdminDashboard = () => (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">DPT ONE Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900">Total Orders</h3>
              <p className="text-3xl font-bold text-blue-600">{totalOrders}</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900">Revenue</h3>
              <p className="text-3xl font-bold text-green-600">₱45,678</p>
              <p className="text-sm text-green-700">+8% from last month</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900">Products</h3>
              <p className="text-3xl font-bold text-purple-600">24</p>
              <p className="text-sm text-purple-700">Active products</p>
            </div>
            
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900">Customers</h3>
              <p className="text-3xl font-bold text-orange-600">{recentUsers.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
              <h3 className="font-semibold">Add New Product</h3>
              <p className="text-sm opacity-90">Create a new product listing</p>
            </button>
            
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
              <h3 className="font-semibold">View Orders</h3>
              <p className="text-sm opacity-90">Manage customer orders</p>
            </button>
            
            <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm opacity-90">View sales analytics</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <button
              onClick={fetchRecentActivities}
              disabled={isLoadingActivities}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isLoadingActivities ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div className="space-y-4">
            {isLoadingActivities ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading recent activities...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    {activity.type === "user_created" ? (
                      <>
                        <p className="font-medium">User account created</p>
                        <p className="text-sm text-gray-600">Email: {activity.email}</p>
                      </>
                    ) : activity.type === "purchase" ? (
                      <>
                        <p className="font-medium">Purchase made</p>
                        <p className="text-sm text-gray-600">Email: {activity.email}</p>
                        <p className="text-sm text-gray-600">Order ID: {activity.orderId}</p>
                        <p className="text-sm text-gray-600">Total: ₱{activity.total}</p>
                      </>
                    ) : null}
                  </div>
                  <span className="text-sm text-gray-500">
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
                <p className="text-gray-500">No recent activities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isAdmin = user && user.uid === ADMIN_UID;

  return isAdmin ? <AdminDashboard /> : <LoginForm onLogin={handleLogin} />;
} 