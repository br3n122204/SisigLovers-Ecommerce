"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

function deepCleanUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepCleanUndefined);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, deepCleanUndefined(v)])
    );
  }
  return obj;
}

function generateFakeQR(text: string) {
  // Use a free QR code API for demo (not real payment)
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`;
}

export default function GCashFakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  let orderInfo: any = null;
  try {
    orderInfo = searchParams.get("orderInfo") ? JSON.parse(decodeURIComponent(searchParams.get("orderInfo")!)) : null;
  } catch (e) { orderInfo = null; }
  const amount = orderInfo?.amount || searchParams.get("amount") || "0.00";
  const { user } = useAuth();
  const { cartItems, removeFromCartByIds } = useCart();
  const { toast } = useToast();
  const [reference, setReference] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use selected items and details from orderInfo if present
  const selectedCartItems = orderInfo?.selectedIds
    ? cartItems.filter(item => orderInfo.selectedIds.includes(item.id))
    : cartItems;
  const deliveryDetails = orderInfo?.deliveryDetails || {
    firstName: user?.displayName?.split(" ")[0] || "",
    lastName: user?.displayName?.split(" ").slice(1).join(" ") || "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    region: "Cebu",
    phone: user?.phoneNumber || "+63",
    email: user?.email || "",
    emailOffers: false,
  };
  const billingDetails = orderInfo?.billingDetails || deliveryDetails;
  const shippingMethod = orderInfo?.shippingMethod || "standard";
  const getShippingPrice = () => 0;

  useEffect(() => {
    // Generate a fake reference number
    const ref = "GCASH-" + Math.floor(100000000 + Math.random() * 900000000);
    setReference(ref);
  }, []);

  const handlePay = async () => {
    if (!user) {
      toast({ title: "Error", description: "Please log in to place an order" });
      return;
    }
    if (selectedCartItems.length === 0) {
      toast({ title: "Error", description: "Your cart is empty" });
      return;
    }
    setIsProcessing(true);
    try {
      const subtotal = selectedCartItems.reduce((total, item) => {
        let price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : Number(item.price);
        return total + (price * item.quantity);
      }, 0);
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        orderNumber: `ORD-${Date.now()}`,
        dateOrdered: serverTimestamp(),
        status: 'pending',
        total: subtotal + getShippingPrice(),
        subtotal,
        shipping: getShippingPrice(),
        tax: 0,
        items: selectedCartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: typeof item.price === "string"
            ? parseFloat(item.price.replace(/[^\d.]/g, ''))
            : item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.selectedSize,
          color: item.color || 'N/A'
        })),
        shippingAddress: deliveryDetails,
        billingAddress: billingDetails,
        paymentMethod: 'gcash',
        paymentStatus: 'paid',
        shippingMethod: shippingMethod,
        notes: ''
      };
      const cleanOrderData = deepCleanUndefined(orderData);
      cleanOrderData.dateOrdered = serverTimestamp();
      const adminProductId = cleanOrderData.items[0]?.id;
      if (!adminProductId) throw new Error('No adminProductId found in order items');
      const productsOrderRef = collection(db, 'adminProducts', adminProductId, 'productsOrder');
      const globalOrderDoc = await addDoc(productsOrderRef, {
        ...cleanOrderData,
        userId: user.uid,
      });
      for (const item of cleanOrderData.items) {
        await addDoc(collection(db, 'adminProducts', adminProductId, 'productsOrder', globalOrderDoc.id, 'orderDetails'), {
          ...item,
          dateOrdered: cleanOrderData.dateOrdered,
        });
      }
      const userOrdersRef = collection(db, 'users', user.uid, 'orders');
      const userOrderDoc = await addDoc(userOrdersRef, {
        ...cleanOrderData,
        globalOrderId: globalOrderDoc.id,
      });
      await updateDoc(doc(db, 'adminProducts', adminProductId, 'productsOrder', globalOrderDoc.id), {
        userOrderId: userOrderDoc.id,
      });
      // Remove only checked-out items from cart
      removeFromCartByIds(selectedCartItems.map(item => item.id));
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/orders");
      }, 1800);
    } catch (error) {
      toast({ title: "Error", description: "Error saving order: " + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101828] text-[#60A5FA] px-4">
      <div className="bg-[#19223a] p-0 rounded-xl shadow-lg max-w-md w-full text-center relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 bg-[#60A5FA] text-[#101828] py-4 rounded-t-xl">
          {/* Custom GCash-like icon */}
          <div className="bg-white rounded-full p-2 shadow">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#60A5FA"/><path d="M10 18c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="18" r="2" fill="#fff"/></svg>
          </div>
          <span className="font-bold text-xl tracking-wide">GCash</span>
        </div>
        {/* Main Card */}
        <div className="p-8">
          <div className="mb-4">
            <div className="text-lg font-semibold mb-1">Amount to Pay</div>
            <div className="text-3xl font-bold text-[#38bdf8]">₱{amount}</div>
          </div>
          {/* QR Code */}
          <div className="flex flex-col items-center mb-4">
            <img src={generateFakeQR(reference + amount)} alt="Fake QR" className="rounded-lg border border-[#60A5FA] bg-white" width={120} height={120} />
            <div className="text-xs text-[#93c5fd] mt-1">Scan to pay (demo only)</div>
          </div>
          {/* Recipient Details */}
          <div className="mb-4 text-left">
            <div className="font-medium">Merchant:</div>
            <div className="text-[#93c5fd]">Sisig Lovers</div>
            <div className="font-medium mt-2">Reference #:</div>
            <div className="text-[#93c5fd] select-all">{reference}</div>
            <div className="font-medium mt-2">Shipping Address:</div>
            <div className="text-[#93c5fd] whitespace-pre-line">
              {deliveryDetails.firstName} {deliveryDetails.lastName}
              {deliveryDetails.address1 && <><br />{deliveryDetails.address1}</>}
              {deliveryDetails.address2 && <><br />{deliveryDetails.address2}</>}
              {deliveryDetails.city && <><br />{deliveryDetails.city}, {deliveryDetails.region}</>}
              {deliveryDetails.postalCode && <><br />{deliveryDetails.postalCode}</>}
              <br />{deliveryDetails.phone}
            </div>
          </div>
          {/* Instructions */}
          <div className="mb-6 text-left">
            <div className="font-semibold mb-1">How to Pay:</div>
            <ol className="list-decimal list-inside text-sm text-[#93c5fd]">
              <li>Open your GCash app (this is a demo).</li>
              <li>Scan the QR or enter the reference number.</li>
              <li>Enter the amount and confirm.</li>
            </ol>
          </div>
          {/* Pay Button */}
          <Button className="w-full text-base font-bold py-2 rounded-lg bg-[#60A5FA] text-[#101828] hover:bg-[#38bdf8] transition" onClick={handlePay} disabled={showSuccess || isProcessing}>
            {isProcessing ? "Processing..." : "Pay"}
          </Button>
        </div>
        {/* Success Modal/Animation */}
        {showSuccess && (
          <div className="absolute inset-0 bg-[#101828cc] flex flex-col items-center justify-center z-10 animate-fade-in">
            <div className="bg-white rounded-full p-4 mb-4 shadow-lg">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#60A5FA"/><path d="M16 25l6 6 10-12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-xl font-bold text-white mb-2">Payment Successful!</div>
            <div className="text-[#93c5fd]">Redirecting to your orders...</div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s; }
      `}</style>
    </div>
  );
} 