import React from "react";

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-black text-white py-2 overflow-hidden border-b border-gray-800">
      <div className="whitespace-nowrap animate-marquee inline-flex items-center">
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">🔥 Savor the Flavor!</span>
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">Fast shipping in Metro Manila & beyond.</span>
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">Support: 9am-6pm, Mon-Sat.</span>
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">Enjoy exclusive deals at DPT ONE!</span>
        {/* Repeat for smooth marquee */}
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">🔥 Savor the Flavor!</span>
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">Fast shipping in Metro Manila & beyond.</span>
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">Support: 9am-6pm, Mon-Sat.</span>
        <span className="mx-6 text-sm font-medium tracking-wide opacity-90">Enjoy exclusive deals at DPT ONE!</span>
      </div>
    </div>
  );
}

// Add the following CSS to your global styles or Tailwind config:
// .animate-marquee {
//   display: inline-block;
//   white-space: nowrap;
//   animation: marquee 20s linear infinite;
// }
// @keyframes marquee {
//   0% { transform: translateX(0); }
//   100% { transform: translateX(-50%); }
// } 