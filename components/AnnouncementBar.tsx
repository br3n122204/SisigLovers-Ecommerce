"use client";

import React from 'react';

const phrases = [
  'Welcome to your ultimate destination!',
  'Enjoy fast shipping on all Cebu City orders!',
  'Exclusive deals available every week!',
  'DPT ONE: Quality you can taste, service you can trust.',
  'Support hours: 9am-6pm, Mon-Sat.',
  'Follow us for the latest updates and promos!',
];

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-[var(--sidebar)] text-[var(--accent)] overflow-hidden whitespace-nowrap border-b border-[var(--card)]">
      <div className="animate-marquee flex items-center" style={{ minWidth: '100%' }}>
        {phrases.map((phrase, idx) => (
          <span key={idx} className="mx-8 text-sm font-medium tracking-wide text-[var(--accent)]">
            {phrase}
          </span>
        ))}
        {/* Repeat for seamless loop */}
        {phrases.map((phrase, idx) => (
          <span key={phrases.length + idx} className="mx-8 text-sm font-medium tracking-wide text-[var(--accent)]">
            {phrase}
          </span>
        ))}
      </div>
      <style jsx>{`
        .animate-marquee {
          display: inline-flex;
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
} 