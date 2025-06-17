"use client";
import { useState, useEffect } from "react";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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
      }
    });

    // Check if the URL contains a sign-in link
    const checkSignInLink = async () => {
      try {
        if (typeof window !== "undefined" && isSignInWithEmailLink(auth, window.location.href)) {
          let emailForSignIn = window.localStorage.getItem("emailForSignIn");
          
          // If email is missing from localStorage, prompt user
          if (!emailForSignIn) {
            emailForSignIn = window.prompt("Please provide your email for confirmation");
            if (!emailForSignIn) {
              throw new Error("Email is required to complete sign in.");
            }
          }

          setIsLoading(true);
          await signInWithEmailLink(auth, emailForSignIn, window.location.href);
          window.localStorage.removeItem("emailForSignIn");
          window.location.href = "/"; // Redirect to home page after successful sign in
        }
      } catch (err: any) {
        console.error("Sign in error:", err);
        setError(err.message || "Failed to complete sign in. Please try again.");
        setIsLoading(false);
      }
    };

    checkSignInLink();
    return () => unsubscribe();
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      // Log Firebase configuration
      console.log('Firebase Auth Configuration:', {
        currentDomain: window.location.origin,
        authDomain: auth.config.authDomain,
        apiKey: auth.config.apiKey !== undefined
      });

      const actionCodeSettings = {
        url: window.location.origin + '/login',
        handleCodeInApp: true
      };

      console.log('Current origin:', window.location.origin);
      console.log('Sending sign-in link to:', email);
      console.log('Action code settings:', actionCodeSettings);
      console.log('Auth state:', auth.currentUser);
      
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      
      // Save the email for sign-in completion
      window.localStorage.setItem("emailForSignIn", email);
      setEmailSent(true);
      console.log('Email link sent successfully');
    } catch (err: any) {
      console.error("Send link error details:", {
        code: err.code,
        message: err.message,
        fullError: err
      });
      setError(err.message || "Failed to send sign in link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        {!emailSent ? (
          <>
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Sign in</h2>
            <p className="text-center text-gray-600 mb-6">
              Enter your email and we'll send you a sign-in link
            </p>
            <form onSubmit={handleSendLink} className="space-y-4">
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
                {isLoading ? "Sending..." : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Check your email</h2>
            <p className="text-center text-gray-600">
              We've sent a sign-in link to <span className="font-semibold">{email}</span>
            </p>
            <p className="text-sm text-gray-500 text-center">
              Click the link in your email to sign in. The link will expire after 24 hours.
            </p>
            <button
              onClick={handleTryAgain}
              className="text-sm text-gray-600 hover:text-gray-800 mt-4"
            >
              Try with a different email
            </button>
          </div>
        )}
        <div className="text-xs text-gray-500 text-center mt-4">
          By continuing, you agree to our Terms of Service
        </div>
      </div>
    </div>
  );
} 