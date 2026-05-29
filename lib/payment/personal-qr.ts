/**
 * Personal GCash QR used for the QR Ph checkout flow.
 * (QR Ph / InstaPay — customer scans with GCash, Maya, or bank apps.)
 */
export const PERSONAL_GCASH_QR_PATH = "/payment/gcash-personal-qr.png";

/** sessionStorage key between checkout and /checkout/qrph-pay */
export const PENDING_QRPH_ORDER_KEY = "pendingQrphOrder";

/** @deprecated Use PENDING_QRPH_ORDER_KEY */
export const PENDING_GCASH_ORDER_KEY = PENDING_QRPH_ORDER_KEY;
