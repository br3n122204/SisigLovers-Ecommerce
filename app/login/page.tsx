"use client";
import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from "next/image";

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
  // isRegistering is now a state variable
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Log auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      if (user) {
        console.log("User details:", {
          email: user.email,
          emailVerified: user.emailVerified,
          uid: user.uid
        });
        // Redirect to home page if user is already logged in
        router.push("/");
      }
    });

    // Sync isRegistering state with 'signup' URL parameter
    const signupParam = searchParams.get('signup');
    console.log('useEffect: signupParam =', signupParam, 'Setting isRegistering to', signupParam === 'true');
    setIsRegistering(signupParam === 'true');

    return () => unsubscribe();
  }, [searchParams, router]); // Depend on searchParams and router

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
        console.log('User registered and logged in successfully');
        // Main user document
        const userDoc = {
          email: auth.currentUser?.email || email,
          emailVerified: auth.currentUser?.emailVerified || false,
          uid: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", auth.currentUser?.uid || ""), userDoc);
        // Add to 'details' subcollection
        if (auth.currentUser?.uid) {
          await setDoc(doc(db, "users", auth.currentUser.uid, "details", "info"), {
            gmail: auth.currentUser.email,
            uid: auth.currentUser.uid
          });
        }
        // Ensure auth.currentUser is available before logging activity
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
            console.log('Activity logged for user:', activityDoc);
          } catch (activityErr) {
            console.error('Failed to log activity:', activityErr);
          }
        } else {
          console.error('auth.currentUser not available after registration, activity not logged.');
        }
        console.log('User document and details written to Firestore:', userDoc);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully');
      }
      // Instead of redirecting, show the modal
      setShowModal(true);
      // router.push("/"); // Suppressed for modal effect
    } catch (err: any) {
      // Log the error object directly
      console.error("Authentication error details:", err);

      // Try to show a meaningful error message
      let errorMsg = "Authentication failed. Please check your credentials and try again.";
      if (err && typeof err === "object") {
        if (err.code) errorMsg += ` (Code: ${err.code})`;
        if (err.message) errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF9F6] to-[#f5f2ef] font-sans relative">
      {/* Blurred overlay and modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md p-10 space-y-6 bg-white rounded-2xl shadow-2xl border border-[#f5c16c]">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
            <div className="flex justify-center mb-2">
              <Image src="/images/footer-logo.png" alt="Brand Logo" width={90} height={90} className="rounded-full shadow-lg" />
            </div>
            <h2 className="text-3xl font-extrabold mb-2 text-center text-[#222] tracking-tight">{isRegistering ? "Sign Up" : "Sign In"}</h2>
            <p className="text-center text-gray-600 mb-6 text-base">{isRegistering ? "Create your account to get started." : "Log in to your account."}</p>
            {/* Show a success message or the same form, as desired */}
            <div className="text-center text-lg text-[#A75D43] font-semibold">Welcome! You are now signed in.</div>
          </div>
        </div>
      )}
      {/* Main login card (still visible underneath, but blurred when modal is open) */}
      <div className={`w-full max-w-md p-10 space-y-6 bg-white rounded-2xl shadow-2xl border border-[#f5c16c] relative ${showModal ? 'pointer-events-none blur-sm' : ''}`}>
        <div className="flex justify-center mb-2">
          <Image src="/images/footer-logo.png" alt="Brand Logo" width={90} height={90} className="rounded-full shadow-lg" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-[#222] tracking-tight">{isRegistering ? "Sign Up" : "Sign In"}</h2>
        <p className="text-center text-gray-600 mb-6 text-base">{isRegistering ? "Create your account to get started." : "Log in to your account."}</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-3 border border-[#A75D43] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A75D43] focus:border-[#F5C16C] bg-[#FAF9F6] text-[#222] placeholder-[#A75D43]"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <input
            id="password"
            type="password"
            required
            className="w-full px-4 py-3 border border-[#A75D43] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A75D43] focus:border-[#F5C16C] bg-[#FAF9F6] text-[#222] placeholder-[#A75D43]"
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
              className="w-full px-4 py-3 border border-[#A75D43] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A75D43] focus:border-[#F5C16C] bg-[#FAF9F6] text-[#222] placeholder-[#A75D43]"
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
            className={`w-full bg-[#A75D43] text-white py-3 px-4 rounded-lg font-bold border-2 border-[#F5C16C] shadow-md hover:bg-[#c98a6a] hover:border-[#A75D43] focus:outline-none focus:ring-2 focus:ring-[#F5C16C] focus:ring-offset-2 transition-colors duration-200 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (isRegistering ? "Registering..." : "Logging In...") : (isRegistering ? "Sign Up" : "Sign In")}
          </button>
        </form>
        <div className="text-center text-sm mt-4">
          {isRegistering ? (
            <>Already have an account? <button onClick={() => { setIsRegistering(false); }} className="text-[#A75D43] font-semibold hover:underline">Sign In</button></>
          ) : (
            <>Don't have an account? <button onClick={() => { setIsRegistering(true); }} className="text-[#A75D43] font-semibold hover:underline">Sign Up</button></>
          )}
        </div>
        <div className="text-xs text-gray-500 text-center mt-4">
          By continuing, you agree to our <span className="text-[#A75D43] font-semibold">Terms of Service</span>
        </div>
      </div>
    </div>
  );
} 