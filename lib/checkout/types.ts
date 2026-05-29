import type { CartItem } from "@/context/CartContext";

/** Checkout page payment options */
export type PaymentMethod = "cod" | "qrph";

/** Checkout button loading state */
export type CheckoutProcessingState = "idle" | "cod" | "qrph";

/** Order draft for QR Ph pay page (uses your personal GCash QR) */
export interface PendingQrphOrder {
  reference: string;
  deliveryDetails: Record<string, unknown>;
  billingDetails: Record<string, unknown>;
  shippingMethod: string;
  items: CartItem[];
  selectedIds: (string | number)[];
  amount: string;
  buyNow: boolean;
}

/** @deprecated Use PendingQrphOrder */
export type PendingGcashOrder = PendingQrphOrder;
