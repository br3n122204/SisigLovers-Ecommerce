"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddProductRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-[#8ec0ff]">Redirecting to admin dashboard...</div>
    </div>
  );
} 