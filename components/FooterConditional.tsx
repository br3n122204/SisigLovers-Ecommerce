"use client";
import { usePathname } from 'next/navigation';
import Image from "next/image";

export default function FooterConditional() {
  const pathname = usePathname();
  if (pathname === '/admin') return null;
  return (
    <footer className="bg-[var(--sidebar)] text-[var(--foreground)] font-sans mt-16 border-t border-[var(--card)] shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-0">
        <div className="flex flex-col items-center md:items-start w-full md:w-1/3 mb-8 md:mb-0">
          <div className="bg-white rounded-full shadow-lg p-3 mb-4 flex items-center justify-center" style={{ width: 90, height: 90 }}>
            <Image src="/images/footer-logo.png" alt="Sisig Lovers Footer Logo" width={70} height={70} className="object-contain" />
          </div>
        </div>
        <div className="w-full md:w-1/3 text-center md:text-left mb-8 md:mb-0">
          <h2 className="text-xl font-bold mb-2 text-[var(--accent)]">Why Shop With Us?</h2>
          <p className="text-[var(--foreground)] opacity-90">Discover the best in local streetwear. DPT ONE brings you curated collections, exclusive drops, and a seamless shopping experience right from Cebu to your doorstep.</p>
        </div>
        <div className="w-full md:w-1/3 text-center md:text-right">
          <h2 className="text-xl font-bold mb-2 text-[var(--accent)]">Contact Us</h2>
          <div className="flex flex-col items-center md:items-end gap-1 text-[var(--foreground)] opacity-90">
            <span>✉️ sisiglovers@gmail.com</span>
            <span>📞 +639828282612</span>
            <span>📍 Cebu, Philippines</span>
          </div>
        </div>
      </div>
      <div className="bg-[var(--card)] border-t border-[var(--sidebar)] text-center py-4 text-[var(--accent)] text-sm font-medium tracking-wide">
        © 2025. All rights reserved.
      </div>
    </footer>
  );
} 