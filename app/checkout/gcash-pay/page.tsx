"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — QR Ph pay page uses your personal GCash QR */
export default function GcashPayRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/checkout/qrph-pay");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA] flex items-center justify-center">
      <p className="text-sm">Redirecting to QR Ph payment...</p>
    </div>
  );
}
