'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';

export default function WelcomeAnimation() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only show if not already shown in this session
    const hasSeen = typeof window !== 'undefined' && sessionStorage.getItem('welcomeShown');
    if (!hasSeen) {
      setOpen(true);
      sessionStorage.setItem('welcomeShown', 'true');
    }
  }, []);

  if (!mounted) return null;
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#fff9f3] border-0 shadow-2xl p-0 flex flex-col md:flex-row items-stretch animate-fade-in-scale rounded-3xl max-w-3xl min-h-[420px] overflow-hidden">
        {/* Left: Side Image */}
        <div className="relative w-full md:w-1/2 h-48 md:h-auto">
          <Image src="/images/welcome-side.jpg" alt="Welcome Visual" fill className="object-cover w-full h-full" priority />
        </div>
        {/* Right: Welcome Message */}
        <div className="flex flex-col items-center justify-center w-full md:w-1/2 p-8">
          <div className="mb-6 animate-bounce-slow">
            <Image src="/images/logo.png" alt="Sisig Lovers Logo" width={100} height={100} className="rounded-full shadow-lg" priority />
          </div>
          <DialogTitle asChild>
            <h1 className="text-3xl font-extrabold text-[#001F3F] mb-2 text-center drop-shadow-lg">Welcome to DPT ONE!</h1>
          </DialogTitle>
          <div className="text-center">
            <p className="text-lg text-[#001F3F] mb-6 text-center font-medium">Discover the best local streetwear and exclusive drops. Enjoy shopping with us!</p>
            <div className="flex justify-center">
              <button
                onClick={() => setOpen(false)}
                className="mt-2 px-6 py-2 rounded-full bg-[#A75D43] text-white font-semibold text-lg shadow hover:bg-[#c98a6a] transition-all duration-200"
              >
                Start Exploring
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
      <style jsx global>{`
        @keyframes fade-in-scale {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </Dialog>
  );
} 