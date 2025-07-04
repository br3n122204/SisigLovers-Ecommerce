import { Plus, ShoppingCart, List, Activity, BarChart2, Home, LogOut } from "lucide-react";

const navItems = [
  { label: "Add Product", icon: <Plus className="w-4 h-4 mr-2" />, section: "add-product" },
  { label: "Manage Products", icon: <List className="w-4 h-4 mr-2" />, section: "manage-products" },
  { label: "Manage Orders", icon: <ShoppingCart className="w-4 h-4 mr-2" />, section: "manage-orders" },
  { label: "Recent Activities", icon: <Activity className="w-4 h-4 mr-2" />, section: "recent-activities" },
  { label: "View Analytics", icon: <BarChart2 className="w-4 h-4 mr-2" />, section: "view-analytics" },
];

export default function AdminSidebar({ activeSection, onSectionChange, onLogout }: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="bg-[#101726] text-[#8ec0ff] w-60 min-h-screen flex flex-col py-6 px-3">
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
      <nav className="flex flex-col gap-2 flex-1">
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
      <div className="mt-auto pt-4 border-t border-[#22304a]">
        <button
          onClick={onLogout}
          className="flex items-center px-4 py-2 rounded-md transition-colors font-medium text-base w-full text-left hover:bg-[#1e293b] text-[#8ec0ff] hover:text-[#3390ff]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </aside>
  );
} 