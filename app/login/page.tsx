"use client";
import { useState } from "react";
import Link from "next/link";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to home page after successful login
      window.location.href = "/";
    } catch (error: any) {
      setError("Invalid Credentials!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-950 to-gray-900 relative">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg relative z-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Log In</h2>
        
        {error && (
          <div className="flex justify-center items-center">
            <div className="bg-gray-100 border border-gray-300 text-gray-800 px-6 py-4 rounded-md text-center w-full">
              <span className="text-lg font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200"
        >
          Log In
        </button>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign up here
          </Link>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-2">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </form>
    </div>
  );
} 