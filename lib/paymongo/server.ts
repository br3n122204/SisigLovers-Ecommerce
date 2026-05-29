import axios, { AxiosError } from "axios";

const PAYMONGO_API_BASE = "https://api.paymongo.com";

/** PayMongo types we use for hosted checkout (merchant may only have some enabled) */
export type PaymongoCheckoutMethod = "qrph" | "gcash" | "card" | "paymaya";

const CHECKOUT_METHOD_PRIORITY: PaymongoCheckoutMethod[] = [
  "qrph",
  "gcash",
  "card",
  "paymaya",
];

export function getPayMongoSecretKey(): string | undefined {
  return (
    process.env.PAYMONGO_SECRET_KEY?.trim() ||
    process.env.PAYMONGO_SECRET?.trim() ||
    undefined
  );
}

export function getPayMongoAuthHeader(secretKey: string): string {
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export function paymongoClient(secretKey: string) {
  return axios.create({
    baseURL: PAYMONGO_API_BASE,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      Authorization: getPayMongoAuthHeader(secretKey),
    },
  });
}

type MerchantPaymentMethodsResponse = {
  data?: Array<{ attributes?: { type?: string } }>;
};

/**
 * Returns payment method types enabled on the merchant account
 * (e.g. ["qrph"]).
 */
export async function getMerchantPaymentMethods(
  secretKey: string
): Promise<string[]> {
  const client = paymongoClient(secretKey);
  const { data } = await client.get<MerchantPaymentMethodsResponse | string[]>(
    "/v1/merchants/capabilities/payment_methods"
  );

  if (Array.isArray(data)) {
    return data.filter((t): t is string => typeof t === "string");
  }

  if (Array.isArray((data as MerchantPaymentMethodsResponse)?.data)) {
    return (data as MerchantPaymentMethodsResponse).data!
      .map((item) => item?.attributes?.type)
      .filter((t): t is string => Boolean(t));
  }

  return [];
}

/**
 * Picks the best online payment method for this merchant.
 * QR Ph is preferred when available (works with GCash, Maya, banks via scan).
 */
export function resolveOnlinePaymentMethod(
  enabledMethods: string[]
): PaymongoCheckoutMethod | null {
  for (const method of CHECKOUT_METHOD_PRIORITY) {
    if (enabledMethods.includes(method)) {
      return method;
    }
  }
  if (enabledMethods.length > 0) {
    return enabledMethods[0] as PaymongoCheckoutMethod;
  }
  return null;
}

export function extractPayMongoErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      errors?: Array<{ detail?: string; code?: string }>;
    }>;
    const apiErrors = axiosError.response?.data?.errors;
    if (apiErrors?.length) {
      return apiErrors
        .map((e) => e.detail || e.code || "PayMongo request failed")
        .join(" ");
    }
    return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return "PayMongo request failed";
}

export const NO_ONLINE_PAYMENT_MESSAGE =
  "No online payment method is enabled on your PayMongo account. Open PayMongo Dashboard → Settings → Payment Methods and enable QR Ph (or another method).";
