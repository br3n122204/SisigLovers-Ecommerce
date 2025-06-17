import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from "@/context/AuthContext"
import Header from "@/components/Header"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <Header />
            {children}
          </CartProvider>
        </AuthProvider>
        <footer className="w-full bg-neutral-900 text-white border-t border-neutral-800 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left: Logo and Brand */}
            <div className="flex flex-col items-center md:items-start space-y-2">
              <a href="/" className="flex flex-col items-center md:items-start">
                <img src="/dptone-logo.png" alt="DPT ONE Logo" width={48} height={48} className="object-contain mb-1" />
                <span className="text-xl font-bold tracking-wider">DPT ONE</span>
              </a>
            </div>
            {/* Center: Value Statement */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-2">Why Shop With Us?</h3>
              <p className="text-sm text-neutral-300">
                Discover the best in local streetwear. DPT ONE brings you curated collections, exclusive drops, and a seamless shopping experience—right from Cebu to your doorstep.
              </p>
            </div>
            {/* Right: Contact Info */}
            <div className="flex flex-col items-center md:items-end space-y-2">
              <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
              <div className="flex items-center space-x-2 text-sm text-neutral-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07-1.42-1.42M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
                <span>sisiglovers@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 21 16.91z"/></svg>
                <span>+639828286212</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-neutral-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
                <span>Cebu, Philippines</span>
              </div>
            </div>
          </div>
          <div className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} DPT ONE. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
