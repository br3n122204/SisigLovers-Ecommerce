import type { CartItem } from "@/context/CartContext";
import type { OnlinePaymentApiPayload } from "@/lib/checkout/types";
import {
  createOnlineCheckout,
  getPayMongoErrorMessage,
} from "@/lib/paymongo/client";

export const PENDING_PAYMONGO_ORDER_KEY = "pendingPaymongoOrder";

export interface OnlineCheckoutOptions {
  items: CartItem[];
  totalAmountPhp: number;
  referenceNumber?: string;
  metadata?: Record<string, string>;
  onError?: (message: string) => void;
}

function parseItemPrice(price: CartItem["price"]): number {
  if (typeof price === "string") {
    return parseFloat(price.replace(/[^\d.]/g, "")) || 0;
  }
  return Number(price) || 0;
}

/** Builds productName, amount, quantity for POST /api/create-payment */
export function buildOnlinePaymentPayload(
  items: CartItem[],
  totalAmountPhp: number
): OnlinePaymentApiPayload {
  if (items.length === 1) {
    const item = items[0];
    const unitPrice = parseItemPrice(item.price);
    const lineTotal = unitPrice * item.quantity;

    if (Math.abs(lineTotal - totalAmountPhp) < 0.02) {
      return {
        productName: item.name,
        amount: unitPrice,
        quantity: item.quantity,
      };
    }
  }

  const label =
    items.length === 1
      ? items[0].name
      : `Order (${items.length} items)`;

  return {
    productName: label,
    amount: totalAmountPhp,
    quantity: 1,
  };
}

/**
 * Starts PayMongo online checkout (QR Ph on your account) and redirects
 * to the hosted payment page where the customer scans the QR code.
 */
export async function proceedToOnlineCheckout(
  options: OnlineCheckoutOptions
): Promise<void> {
  const { items, totalAmountPhp, referenceNumber, metadata, onError } =
    options;

  if (!items.length) {
    const message = "Your cart is empty.";
    onError?.(message);
    throw new Error(message);
  }

  if (totalAmountPhp <= 0) {
    const message = "Invalid order total.";
    onError?.(message);
    throw new Error(message);
  }

  const payload = buildOnlinePaymentPayload(items, totalAmountPhp);

  try {
    const { checkout_url } = await createOnlineCheckout({
      ...payload,
      referenceNumber,
      metadata,
    });

    window.location.href = checkout_url;
  } catch (error) {
    const message = getPayMongoErrorMessage(error);
    onError?.(message);
    throw error;
  }
}

/** @deprecated Use proceedToOnlineCheckout */
export const proceedToGcashCheckout = proceedToOnlineCheckout;
export const buildGcashPaymentPayload = buildOnlinePaymentPayload;
