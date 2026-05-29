"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CheckoutProcessingState, PaymentMethod } from "@/lib/checkout/types";
import { cn } from "@/lib/utils";

interface CheckoutSubmitButtonProps {
  paymentMethod: PaymentMethod;
  processingState: CheckoutProcessingState;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

function getButtonLabel(
  paymentMethod: PaymentMethod,
  processingState: CheckoutProcessingState
): string {
  if (processingState === "cod") return "Placing order...";
  if (processingState === "qrph") return "Continue to QR Ph payment...";
  return paymentMethod === "qrph" ? "Pay with QR Ph" : "Place order (COD)";
}

export function CheckoutSubmitButton({
  paymentMethod,
  processingState,
  onClick,
  disabled = false,
  className,
}: CheckoutSubmitButtonProps) {
  const isLoading = processingState !== "idle";

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-live="polite"
      className={cn(
        "w-full min-h-[48px] bg-[#60A5FA] text-[#101828] py-3 rounded-md",
        "hover:bg-[#3380c0] transition-colors",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2 text-sm sm:text-base font-semibold",
        className
      )}
    >
      {isLoading && (
        <Loader2
          className="h-5 w-5 shrink-0 animate-spin text-[#101828]"
          aria-hidden="true"
        />
      )}
      <span>{getButtonLabel(paymentMethod, processingState)}</span>
    </Button>
  );
}
