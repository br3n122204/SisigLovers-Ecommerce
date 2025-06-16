"use client";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for authentication logic
    if (!username || !password) {
      setError("Please enter both username and password.");
    } else {
      setError("");
      alert(`Logged in as ${username}`);
      // Clear form after successful submission
      setUsername("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-950 to-gray-900 relative">
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm space-y-4 relative z-10">
        <h2 className="text-2xl font-bold mb-4 text-center">Log In</h2>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">Log In</button>
        <div className="text-center mt-4">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm">
            ← Back to Home
          </Link>
        </div>
      </form>
    </div>
  );
} 