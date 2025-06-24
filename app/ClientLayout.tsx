"use client";
import FooterConditional from "@/components/FooterConditional";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FooterConditional />
    </>
  );
} 