"use client";
import { useState, useEffect, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import DPTOneFashion from '../page';
import { useCart, CartItem } from '@/context/CartContext';

const supabaseUrl = 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const { user, loading } = useAuth();
  const { addToCart, cartItems, cartLoading } = useCart();
  const [processingCart, setProcessingCart] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);
  const retryCount = useRef(0);
  const [pendingAdded, setPendingAdded] = useState(false);

  useEffect(() => {
    console.log('[Login Effect] user:', user, 'loading:', loading, 'cartItems:', cartItems, 'cartLoading:', cartLoading, 'pendingAdded:', pendingAdded);
    if (loading) return; // Wait for loading to finish

    if (user) {
      // Only run this block when user is set
      const pending = localStorage.getItem('pendingCartItem');
      console.log('[Login Effect] pendingCartItem:', pending);
      if (pending) {
        try {
          const cartItem = JSON.parse(pending);
          if (cartItem && cartItem.id && cartItem.selectedSize) {
            console.log('[Login Effect] Adding to cart:', cartItem);
            addToCart(cartItem);
            localStorage.removeItem('pendingCartItem');
            setPendingAdded(true);
            router.push('/cart');
            return;
          }
        } catch (e) { console.error('[Login Effect] Error parsing pendingCartItem:', e); }
        localStorage.removeItem('pendingCartItem');
      }
      router.push("/");
    }
    const signupParam = searchParams.get('signup');
    setIsRegistering(signupParam === 'true');
  }, [searchParams, router, user, loading, cartItems, cartLoading, addToCart, pendingAdded]);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showModal, router]);

  useEffect(() => {
    if (pendingCartItem) {
      console.log('[Redirect Effect] pendingCartItem:', pendingCartItem, 'cartItems:', cartItems);
      const found = cartItems.find(item => {
        console.log('[Redirect Effect] comparing:', item, pendingCartItem);
        return (
          String(item.id).trim() === String(pendingCartItem.id).trim() &&
          String(item.selectedSize).trim() === String(pendingCartItem.selectedSize).trim()
        );
      });
      if (found) {
        setPendingCartItem(null);
        router.push('/cart');
      }
    }
  }, [pendingCartItem, cartItems, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (isRegistering && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        const userDoc = {
          email: auth.currentUser?.email || email,
          emailVerified: auth.currentUser?.emailVerified || false,
          uid: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", auth.currentUser?.uid || ""), userDoc);
        if (auth.currentUser?.uid) {
          await setDoc(doc(db, "users", auth.currentUser.uid, "details", "info"), {
            gmail: auth.currentUser.email,
            uid: auth.currentUser.uid
          });
        }
        let attempts = 0;
        while (!auth.currentUser && attempts < 5) {
          await new Promise(res => setTimeout(res, 200));
          attempts++;
        }
        if (auth.currentUser) {
          try {
            const activityDoc = {
              type: "user_created",
              email: auth.currentUser.email || email,
              uid: auth.currentUser.uid,
              timestamp: serverTimestamp()
            };
            await addDoc(collection(db, "activities"), activityDoc);
          } catch (activityErr) {
            console.error('Failed to log activity:', activityErr);
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowModal(true);
    } catch (err: any) {
      // Only log unexpected errors
      if (!(
        err &&
        typeof err === "object" &&
        err.code &&
        (
          err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
        )
      )) {
        console.error("Authentication error details:", err);
      }
      let errorMsg = "Authentication failed. Please check your credentials and try again.";
      if (err && typeof err === "object" && err.code) {
        if (
          err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
        ) {
          errorMsg = "Invalid email or password.";
        }
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* Blurred homepage background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0">
          <div className="w-full h-full">
            <div className="w-full h-full backdrop-blur-sm">
              <DPTOneFashion />
            </div>
          </div>
        </div>
      </div>
      {/* Overlay for dimming */}
      <div className="fixed inset-0 bg-black/10 -z-10" />
      {/* Login form container (centered) */}
      <div className="w-full max-w-md p-10 space-y-6 bg-[#101828] rounded-2xl shadow-2xl border border-[#60A5FA] relative text-[#60A5FA]">
        <button onClick={() => router.push('/')} className="absolute top-4 right-4 text-[#60A5FA] hover:text-white text-2xl font-bold">&times;</button>
        <div className="flex justify-center mb-2">
          <Image src="/images/footer-logo.png" alt="Brand Logo" width={90} height={90} className="rounded-full shadow-lg" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-[#60A5FA] tracking-tight">{isRegistering ? "Sign Up" : "Sign In"}</h2>
        <p className="text-center text-[#60A5FA] mb-6 text-base">{isRegistering ? "Create your account to get started." : "Log in to your account."}</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-3 border-2 border-[#60A5FA] rounded-lg focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] bg-[#19223a] text-[#60A5FA] placeholder-[#60A5FA]"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <input
            id="password"
            type="password"
            required
            className="w-full px-4 py-3 border-2 border-[#60A5FA] rounded-lg focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] bg-[#19223a] text-[#60A5FA] placeholder-[#60A5FA]"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {isRegistering && (
            <input
              id="confirm-password"
              type="password"
              required
              className="w-full px-4 py-3 border-2 border-[#60A5FA] rounded-lg focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] bg-[#19223a] text-[#60A5FA] placeholder-[#60A5FA]"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          )}
          {error && (
            <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <button
            type="submit"
            className={`w-full bg-[#60A5FA] text-[#101828] py-3 px-4 rounded-lg font-bold border-2 border-[#60A5FA] shadow-md hover:bg-[#3380c0] hover:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:ring-offset-2 transition-colors duration-200 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (isRegistering ? "Registering..." : "Logging In...") : (isRegistering ? "Sign Up" : "Sign In")}
          </button>
        </form>
        <div className="text-center text-sm mt-4">
          {isRegistering ? (
            <>Already have an account? <button onClick={() => { setIsRegistering(false); }} className="text-[#60A5FA] font-semibold hover:underline">Sign In</button></>
          ) : (
            <>Don't have an account? <button onClick={() => { setIsRegistering(true); }} className="text-[#60A5FA] font-semibold hover:underline">Sign Up</button></>
          )}
        </div>
        <p className="text-center text-xs text-[#60A5FA] mt-4">By continuing, you agree to our <span className="font-semibold underline">Terms of Service</span></p>
      </div>
    </div>
  );
} 