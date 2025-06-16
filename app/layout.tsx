import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SisigLovers E-commerce",
  description: "Your one-stop shop for delicious sisig",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
