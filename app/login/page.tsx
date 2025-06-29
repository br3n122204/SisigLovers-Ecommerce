"use client";
import { useState, useEffect } from "react";
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
    const signupParam = searchParams.get('signup');
    setIsRegistering(signupParam === 'true');
  }, [searchParams, router, user]);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showModal, router]);

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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#101726]">
      {/* Blurred homepage background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0">
          <div className="w-full h-full">
            <div className="w-full h-full backdrop-blur-md">
              <DPTOneFashion />
            </div>
          </div>
        </div>
      </div>
      {/* Overlay for dimming */}
      <div className="fixed inset-0 bg-black/40 -z-10" />
      {/* Login form container (centered) */}
      <div className="w-full max-w-md p-10 space-y-6 bg-[#1a2233] rounded-2xl shadow-2xl border border-[#232c43] relative">
        <button onClick={() => router.push('/')} className="absolute top-4 right-4 text-white hover:text-[var(--accent)] text-2xl font-bold">&times;</button>
        <div className="flex justify-center mb-2">
          <div className="w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center mb-2">
            <Image src="/images/footer-logo.png" alt="Brand Logo" width={70} height={70} className="object-contain" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-black tracking-tight">Sign In</h2>
        <p className="text-center text-gray-400 mb-6 text-base">Log in to your account.</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-3 border-2 border-white rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[#232c43] text-white placeholder-gray-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <input
            id="password"
            type="password"
            required
            className="w-full px-4 py-3 border-2 border-white rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[#232c43] text-white placeholder-gray-400"
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
              className="w-full px-4 py-3 border-2 border-white rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[#232c43] text-white placeholder-gray-400"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          )}
          {error && (
            <div className="text-red-400 text-sm text-center p-2 bg-red-900/20 rounded-md">
              {error}
            </div>
          )}
          <button
            type="submit"
            className={`w-full bg-transparent text-white py-3 px-4 rounded-lg font-bold border-2 border-white shadow-md hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 transition-colors duration-200 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            Sign In
          </button>
        </form>
        <div className="text-center text-sm mt-4 text-white">
          Don't have an account? <button onClick={() => { setIsRegistering(true); }} className="font-semibold hover:underline text-[var(--accent)]">Sign Up</button>
        </div>
        <div className="text-center text-xs mt-2 text-gray-500">
          By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </div>
  );
} 