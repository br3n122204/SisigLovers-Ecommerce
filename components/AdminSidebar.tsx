import { Plus, ShoppingCart, List, Activity, BarChart2, Home, LogOut, X } from "lucide-react";
import React from "react";

const navItems = [
  { label: "Add Product", icon: <Plus className="w-4 h-4 mr-2" />, section: "add-product" },
  { label: "Manage Products", icon: <List className="w-4 h-4 mr-2" />, section: "manage-products" },
  { label: "Manage Orders", icon: <ShoppingCart className="w-4 h-4 mr-2" />, section: "manage-orders" },
  { label: "Recent Activities", icon: <Activity className="w-4 h-4 mr-2" />, section: "recent-activities" },
  { label: "View Analytics", icon: <BarChart2 className="w-4 h-4 mr-2" />, section: "view-analytics" },
];

export default function AdminSidebar({ activeSection, onSectionChange, onLogout, sidebarOpen, toggleSidebar }: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  sidebarOpen?: boolean;
  toggleSidebar?: () => void;
}) {
  // Sidebar classes for mobile/desktop
  const sidebarBase =
    "bg-[#101726] text-[#8ec0ff] w-60 h-screen flex flex-col pt-6 px-3 z-40 transition-transform duration-300 relative";
  const sidebarMobile =
    "fixed top-0 left-0 h-full transform sm:translate-x-0 sm:static sm:block" +
    (sidebarOpen ? " translate-x-0" : " -translate-x-full");
  const overlay =
    "fixed inset-0 bg-black bg-opacity-40 z-30 sm:hidden transition-opacity duration-300";

  return (
    <>
      {/* Overlay for mobile */}
      {typeof sidebarOpen === "boolean" && sidebarOpen && (
        <div className={overlay} onClick={toggleSidebar} />
      )}
      <aside
        className={
          sidebarBase +
          " " +
          (typeof sidebarOpen === "boolean"
            ? sidebarMobile
            : "sm:block hidden")
        }
        style={{
          maxWidth: "15rem",
        }}
      >
        {/* Close button for mobile */}
        {typeof sidebarOpen === "boolean" && toggleSidebar && (
          <button
            className="absolute top-4 right-4 sm:hidden text-[#8ec0ff] p-2"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        )}
        <div className="flex items-center mb-10 px-2">
          <img
            src="https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/DPT%20ONE%20LOGO/DPTONELOGO.png"
            alt="DPT ONE Logo"
            width="56"
            height="56"
            className="w-14 h-14 object-contain mr-3 bg-transparent"
            style={{ width: "56px", height: "56px" }}
          />
          <span className="text-lg font-bold text-[#8ec0ff] tracking-wide">DPT ONE</span>
        </div>
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onSectionChange(item.section)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors font-medium text-base w-full text-left ${activeSection === item.section ? "bg-[#1e293b] text-[#3390ff]" : "hover:bg-[#1e293b] text-[#8ec0ff]"}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          {/* Return to Homepage Button */}
          <a
            href="/"
            className="flex items-center px-4 py-2 rounded-md transition-colors font-medium text-base w-full text-left hover:bg-[#1e293b] text-[#8ec0ff] mt-0"
            style={{ textDecoration: 'none' }}
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Homepage
          </a>
        </nav>
        {/* Logout Button */}
        <div className="border-t border-[#22304a] absolute bottom-0 left-0 w-full bg-[#101726]">
          <button
            onClick={onLogout}
            className="flex items-center px-5 py-5 w-full text-left hover:bg-[#1e293b] text-[#8ec0ff] hover:text-[#3390ff]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
} 