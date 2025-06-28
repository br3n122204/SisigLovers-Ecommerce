import type { ReactNode } from "react";
import "../../styles/globals.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-black h-screen w-full flex overflow-hidden">
      {children}
    </div>
  );
} 