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
      </body>
    </html>
  )
}
