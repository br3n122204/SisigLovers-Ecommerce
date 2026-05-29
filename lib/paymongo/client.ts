import axios, { AxiosError } from "axios";
import type { OnlinePaymentApiPayload } from "@/lib/checkout/types";

const CREATE_PAYMENT_ENDPOINT = "/api/create-payment";

export interface CreateOnlineCheckoutSuccess {
  checkout_url: string;
  reference_number: string;
  payment_method: string;
}

/**
 * Creates a PayMongo hosted checkout (QR Ph, GCash, etc. depending on your account).
 */
export async function createOnlineCheckout(
  payload: OnlinePaymentApiPayload & {
    referenceNumber?: string;
    metadata?: Record<string, string>;
  }
): Promise<CreateOnlineCheckoutSuccess> {
  const { data } = await axios.post<CreateOnlineCheckoutSuccess>(
    CREATE_PAYMENT_ENDPOINT,
    payload,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 30_000,
    }
  );

  if (!data?.checkout_url) {
    throw new Error("Payment link was not returned. Please try again.");
  }

  return data;
}

/** @deprecated Use createOnlineCheckout */
export const createGcashCheckout = createOnlineCheckout;

export function getPayMongoErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      error?: string;
      details?: string;
      code?: string;
    }>;
    const data = axiosError.response?.data;
    return data?.error ?? data?.details ?? axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return "Failed to start online payment.";
}
