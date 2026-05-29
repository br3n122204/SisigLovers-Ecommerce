"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Legacy URL — forwards to the QR Ph / online payment success page */
export default function GcashSuccessRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    router.replace(`/checkout/payment/success${query}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA] flex items-center justify-center">
      <p className="text-sm">Confirming payment...</p>
    </div>
  );
}
