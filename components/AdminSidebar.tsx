import { Plus, ShoppingCart, List, Activity, BarChart2, Home } from "lucide-react";
import React from "react";

const navItems = [
  { label: "Add Product", icon: <Plus className="w-4 h-4 mr-2" />, section: "add-product" },
  { label: "Manage Products", icon: <List className="w-4 h-4 mr-2" />, section: "manage-products" },
  { label: "Manage Orders", icon: <ShoppingCart className="w-4 h-4 mr-2" />, section: "manage-orders" },
  { label: "Recent Activities", icon: <Activity className="w-4 h-4 mr-2" />, section: "recent-activities" },
  { label: "View Analytics", icon: <BarChart2 className="w-4 h-4 mr-2" />, section: "view-analytics" },
];

export default function AdminSidebar({ activeSection, onSectionChange }: {
  activeSection: string;
  onSectionChange: (section: string) => void;
}) {
  return (
    <aside className="bg-[#1a2233] text-[var(--accent)] w-60 min-h-screen flex flex-col py-6 px-3 font-sans shadow-lg">
      <div className="flex items-center mb-10 px-2">
        <img
          src="/images/dpt-one-logo.png"
          alt="DPT ONE Logo"
          className="w-14 h-14 object-contain mr-3 bg-white rounded shadow"
        />
        <span className="text-lg font-bold text-[var(--accent)] tracking-wide">DPT ONE</span>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onSectionChange(item.section)}
            className={`flex items-center px-4 py-2 rounded-md transition-colors font-medium text-base w-full text-left ${activeSection === item.section ? "bg-[var(--accent)] text-white" : "hover:bg-[#232c43] text-[var(--accent)]"}`}
          >
            {React.cloneElement(item.icon, { className: 'w-4 h-4 mr-2', color: activeSection === item.section ? 'white' : 'var(--accent)' })}
            {item.label}
          </button>
        ))}
        {/* Return to Homepage Button */}
        <a
          href="/"
          className="flex items-center px-4 py-2 rounded-md transition-colors font-medium text-base w-full text-left hover:bg-[#232c43] text-[var(--accent)] mt-0"
          style={{ textDecoration: 'none' }}
        >
          <Home className="w-4 h-4 mr-2" color="var(--accent)" />
          Return to Homepage
        </a>
      </nav>
    </aside>
  );
} 