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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        await setDoc(doc(db, "users", auth.currentUser?.uid || ""), {
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
          uid: auth.currentUser?.uid,
          createdAt: serverTimestamp()
        });
        // Log activity
        await addDoc(collection(db, "activities"), {
          type: "user_created",
          email: auth.currentUser?.email,
          uid: auth.currentUser?.uid,
          timestamp: serverTimestamp()
        });
        console.log('User document written to Firestore:', auth.currentUser?.uid, auth.currentUser?.email);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully');
      }
      router.push("/"); // Redirect to home page after successful auth
    } catch (err: any) {
      console.error("Authentication error details:", {
        code: err.code,
        message: err.message,
        fullError: err
      });
      // Ensure a useful error message is always set
      setError(err instanceof Error ? err.message : "Authentication failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
          {isRegistering ? "Sign Up" : "Sign In"}
        </h2>
        <p className="text-center text-gray-600 mb-6">
          {isRegistering ? "Create your account to get started." : "Log in to your account."}
        </p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <input
            id="password"
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
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
            className={`w-full bg-black text-white py-3 px-4 rounded-md font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (isRegistering ? "Registering..." : "Logging In...") : (isRegistering ? "Sign Up" : "Sign In")}
          </button>
        </form>
        <div className="text-center text-sm mt-4">
          {isRegistering ? (
            <>Already have an account? <button onClick={() => { console.log('Internal Sign In clicked. Setting isRegistering to false'); setIsRegistering(false); }} className="text-blue-600 hover:underline">Sign In</button></>
          ) : (
            <>Don't have an account? <button onClick={() => { console.log('Internal Sign Up clicked. Setting isRegistering to true'); setIsRegistering(true); }} className="text-blue-600 hover:underline">Sign Up</button></>
          )}
        </div>
        <div className="text-xs text-gray-500 text-center mt-4">
          By continuing, you agree to our Terms of Service
        </div>
      </div>
    </div>
  );
} 