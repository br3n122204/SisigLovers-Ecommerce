"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import { PENDING_PAYMONGO_ORDER_KEY } from "@/lib/checkout/online-payment";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { removeFromCartByIds } = useCart();
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    setReference(ref);

    try {
      const raw = sessionStorage.getItem(PENDING_PAYMONGO_ORDER_KEY);
      if (raw) {
        const pending = JSON.parse(raw);
        if (Array.isArray(pending?.selectedIds) && pending.selectedIds.length > 0) {
          removeFromCartByIds(pending.selectedIds);
        }
        sessionStorage.removeItem(PENDING_PAYMONGO_ORDER_KEY);
      }
    } catch {
      // Best-effort cart cleanup after PayMongo redirect
    }

    toast({
      title: "Payment received",
      description:
        "Thank you! Your QR Ph payment was submitted. Order details will update once PayMongo confirms payment.",
      variant: "success",
    });
  }, [searchParams, toast, removeFromCartByIds]);

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#19223a] rounded-lg p-8 shadow-md text-center space-y-6">
        <h1 className="text-2xl font-bold">Payment successful</h1>
        <p className="text-sm text-[#93c5fd] leading-relaxed">
          PayMongo has recorded your payment
          {reference ? ` (ref: ${reference})` : ""}. You paid using QR Ph — that
          includes GCash, Maya, and participating banks.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            className="w-full bg-[#60A5FA] text-[#101828] hover:bg-[#3380c0]"
            onClick={() => router.push("/orders")}
          >
            View my orders
          </Button>
          <Button
            variant="outline"
            className="w-full border-[#60A5FA] text-[#60A5FA]"
            asChild
          >
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
