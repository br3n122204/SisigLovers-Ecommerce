import React, { useEffect, useState } from "react";
import Image from "next/image";

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
}

export default function AuthModal({ mode, onClose }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(mode);
  // Form state (for demo only, not functional)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center">
      {/* Blurred and dimmed background */}
      <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose} />
      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md p-10 space-y-6 bg-white rounded-2xl shadow-2xl border border-[#f5c16c] mx-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold">&times;</button>
        <div className="flex justify-center mb-2">
          <Image src="/images/footer-logo.png" alt="Brand Logo" width={90} height={90} className="rounded-full shadow-lg" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2 text-center text-[#222] tracking-tight">{authMode === 'signup' ? "Sign Up" : "Sign In"}</h2>
        <p className="text-center text-gray-600 mb-6 text-base">{authMode === 'signup' ? "Create your account to get started." : "Log in to your account."}</p>
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
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
          {authMode === 'signup' && (
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
            {authMode === 'signup' ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="text-center text-sm mt-4">
          {authMode === 'signup' ? (
            <>Already have an account? <button onClick={() => setAuthMode('login')} className="text-[#A75D43] font-semibold hover:underline">Sign In</button></>
          ) : (
            <>Don't have an account? <button onClick={() => setAuthMode('signup')} className="text-[#A75D43] font-semibold hover:underline">Sign Up</button></>
          )}
        </div>
        <div className="text-xs text-gray-500 text-center mt-4">
          By continuing, you agree to our <span className="text-[#A75D43] font-semibold">Terms of Service</span>
        </div>
      </div>
    </div>
  );
} 