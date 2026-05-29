export interface CreateGcashPaymentBody {
  productName: string;
  amount: number;
  quantity: number;
  successUrl?: string;
  cancelUrl?: string;
  referenceNumber?: string;
  metadata?: Record<string, string>;
}

export interface CreateGcashPaymentSuccess {
  checkout_url: string;
  session_id: string;
  reference_number: string;
}

export interface PayMongoApiError {
  detail?: string;
  code?: string;
  source?: { pointer?: string };
}
