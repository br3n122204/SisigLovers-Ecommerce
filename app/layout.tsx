import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from "@/context/AuthContext"
import Header from "@/components/Header"
import AnnouncementBar from "@/components/AnnouncementBar"
import Image from "next/image"

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
            <AnnouncementBar />
            <Header />
            {children}
          </CartProvider>
        </AuthProvider>
        <footer className="bg-black text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-0">
            <div className="flex flex-col items-center md:items-start w-full md:w-1/3 mb-8 md:mb-0">
              <Image src="/images/footer-logo.png" alt="Sisig Lovers Footer Logo" width={90} height={90} className="mb-4" />
            </div>
            <div className="w-full md:w-1/3 text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-xl font-bold mb-2">Why Shop With Us?</h2>
              <p className="text-gray-300">Discover the best in local streetwear. DPT ONE brings you curated collections, exclusive drops, and a seamless shopping experience right from Cebu to your doorstep.</p>
            </div>
            <div className="w-full md:w-1/3 text-center md:text-right">
              <h2 className="text-xl font-bold mb-2">Contact Us</h2>
              <div className="flex flex-col items-center md:items-end gap-1 text-gray-300">
                <span>✉️ sisiglovers@gmail.com</span>
                <span>📞 +639828282612</span>
                <span>📍 Cebu, Philippines</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 text-center py-4 text-gray-400 text-sm">
            © 2025. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
