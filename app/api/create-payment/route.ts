import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { z } from "zod";
import {
  extractPayMongoErrorMessage,
  getMerchantPaymentMethods,
  getPayMongoSecretKey,
  NO_ONLINE_PAYMENT_MESSAGE,
  paymongoClient,
  resolveOnlinePaymentMethod,
  type PaymongoCheckoutMethod,
} from "@/lib/paymongo/server";

const CHECKOUT_SESSIONS_PATH = "/v2/checkout_sessions";

const requestSchema = z.object({
  productName: z.string().min(1).max(500),
  amount: z.number().positive(),
  quantity: z.number().int().positive().max(9999),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  referenceNumber: z.string().max(64).optional(),
  metadata: z.record(z.string()).optional(),
});

type CheckoutSessionResponse = {
  data?: {
    id?: string;
    attributes?: { checkout_url?: string };
  };
};

function getBaseUrl(request: NextRequest): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

function toCentavos(amountPhp: number): number {
  return Math.round(amountPhp * 100);
}

/**
 * Creates a PayMongo hosted checkout for real online payment.
 * Uses QR Ph when that is the only method enabled on the merchant account.
 */
async function createHostedCheckout(params: {
  secretKey: string;
  paymongoMethod: PaymongoCheckoutMethod;
  unitAmountCentavos: number;
  productName: string;
  quantity: number;
  orderRef: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<string> {
  const client = paymongoClient(params.secretKey);

  const { data } = await client.post<CheckoutSessionResponse>(
    CHECKOUT_SESSIONS_PATH,
    {
      data: {
        attributes: {
          line_items: [
            {
              name: params.productName,
              amount: params.unitAmountCentavos,
              currency: "PHP",
              quantity: params.quantity,
            },
          ],
          // QR Ph: customer scans QR with GCash, Maya, or any participating bank app
          payment_method_types: [params.paymongoMethod],
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          reference_number: params.orderRef,
          send_email_receipt: false,
          metadata: {
            ...params.metadata,
            paymongo_method: params.paymongoMethod,
            product_name: params.productName,
          },
        },
      },
    }
  );

  const checkoutUrl = data?.data?.attributes?.checkout_url;
  if (!checkoutUrl) {
    throw new Error("PayMongo did not return a checkout URL.");
  }
  return checkoutUrl;
}

export async function POST(request: NextRequest) {
  try {
    const secretKey = getPayMongoSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "PayMongo secret key is missing. Add PAYMONGO_SECRET_KEY to .env.local and restart npm run dev.",
        },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join("; ") },
        { status: 400 }
      );
    }

    const {
      productName,
      amount,
      quantity,
      successUrl,
      cancelUrl,
      referenceNumber,
      metadata,
    } = parsed.data;

    const unitAmountCentavos = toCentavos(amount);
    const totalCentavos = unitAmountCentavos * quantity;
    if (totalCentavos < 100) {
      return NextResponse.json(
        { error: "Minimum payment amount is PHP 1.00." },
        { status: 400 }
      );
    }

    let enabledMethods: string[] = [];
    try {
      enabledMethods = await getMerchantPaymentMethods(secretKey);
    } catch (err) {
      console.warn("[create-payment] Could not fetch payment methods:", err);
    }

    const paymongoMethod = resolveOnlinePaymentMethod(enabledMethods);
    if (!paymongoMethod) {
      return NextResponse.json(
        {
          error: NO_ONLINE_PAYMENT_MESSAGE,
          code: "no_payment_method_enabled",
          enabled_payment_methods: enabledMethods,
        },
        { status: 422 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const orderRef = referenceNumber ?? `ORD-${Date.now()}`;
    const success =
      successUrl ?? `${baseUrl}/checkout/payment/success?ref=${orderRef}`;
    const cancel = cancelUrl ?? `${baseUrl}/checkout?payment=cancelled`;

    const checkoutUrl = await createHostedCheckout({
      secretKey,
      paymongoMethod,
      unitAmountCentavos,
      productName,
      quantity,
      orderRef,
      successUrl: success,
      cancelUrl: cancel,
      metadata,
    });

    return NextResponse.json({
      checkout_url: checkoutUrl,
      reference_number: orderRef,
      payment_method: paymongoMethod,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = extractPayMongoErrorMessage(error);
      console.error("[create-payment] PayMongo error:", message);
      const status = error.response?.status ?? 502;
      return NextResponse.json(
        { error: message, code: "paymongo_error" },
        { status: status >= 400 && status < 600 ? status : 502 }
      );
    }
    console.error("[create-payment] Unexpected error:", error);
    return NextResponse.json(
      { error: "Could not start online payment." },
      { status: 500 }
    );
  }
}
