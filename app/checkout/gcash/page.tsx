"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import jsPDF from "jspdf";
import { supabase } from '@/lib/supabase';
import robotoFont from '@/components/roboto-regular.js';
import { getMonthKey, getWeekKey } from '@/lib/utils';

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

// Helper to fetch and cache the logo as a data URL (no Supabase)
let cachedLogoDataUrl: string | null = null;
async function getLogoDataUrl() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  // Use the direct public URL for the logo
  const logoUrl = "https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/RECIEPTLOGO/DPTONELOGO.png";
  const response = await fetch(logoUrl);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      cachedLogoDataUrl = reader.result as string;
      resolve(cachedLogoDataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const [receipt, setReceipt] = useState<any | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [userOrderId, setUserOrderId] = useState<string | null>(null);

  // Use selected items and details from orderInfo if present
  const selectedCartItems = orderInfo?.items
    ? orderInfo.items
    : (orderInfo?.selectedIds
        ? cartItems.filter(item => orderInfo.selectedIds.includes(item.id))
        : cartItems);
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
    console.log("Pay button clicked");
    if (!user) {
      console.log("No user logged in");
      toast({ title: "Error", description: "Please log in to place an order" });
      return;
    }
    if (selectedCartItems.length === 0) {
      console.log("Cart is empty");
      toast({ title: "Error", description: "Your cart is empty" });
      return;
    }
    setIsProcessing(true);
    try {
      console.log("Starting payment process");
      const subtotal = selectedCartItems.reduce((total: number, item: any) => {
        let price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : Number(item.price);
        return total + (price * item.quantity);
      }, 0);
      console.log("Subtotal calculated:", subtotal);
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
        items: selectedCartItems.map((item: any) => {
          let color = item.selectedColor || item.color;
          // Try to infer color from product if missing
          if (!color && item.id) {
            // Try to get the product from cartItems or selectedCartItems
            const product = cartItems.find(p => p.id === item.id) || item;
            if (product && product.color && typeof product.color === 'string') {
              const colorOptions = product.color.split(',').map((c: string) => c.trim()).filter(Boolean);
              if (colorOptions.length === 1) {
                color = colorOptions[0];
              }
            }
          }
          return {
            id: item.id,
            name: item.name,
            price: typeof item.price === "string"
              ? parseFloat(item.price.replace(/[^\d.]/g, ''))
              : item.price,
            quantity: item.quantity,
            image: item.image,
            size: item.selectedSize,
            color: color || 'N/A',
          };
        }),
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
      console.log("adminProductId:", adminProductId);
      const productsOrderRef = collection(db, 'adminProducts', adminProductId, 'productsOrder');
      const globalOrderDoc = await addDoc(productsOrderRef, {
        ...cleanOrderData,
        userId: user.uid,
      });
      console.log("globalOrderDoc.id:", globalOrderDoc.id);
      for (const item of cleanOrderData.items) {
        await addDoc(collection(db, 'adminProducts', adminProductId, 'productsOrder', globalOrderDoc.id, 'orderDetails'), {
          ...item,
          dateOrdered: cleanOrderData.dateOrdered,
        });
        console.log("Added order detail for item:", item.id);
      }
      const userOrdersRef = collection(db, 'users', user.uid, 'orders');
      const userOrderDoc = await addDoc(userOrdersRef, {
        ...cleanOrderData,
        globalOrderId: globalOrderDoc.id,
      });
      console.log("userOrderDoc.id:", userOrderDoc.id);
      await updateDoc(doc(db, 'adminProducts', adminProductId, 'productsOrder', globalOrderDoc.id), {
        userOrderId: userOrderDoc.id,
      });
      console.log("Updated global order with userOrderId");

      // Calculate total quantity purchased
      const totalQuantity = Array.isArray(cleanOrderData.items)
        ? cleanOrderData.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        : 0;
      
      // Add to sales collection for analytics
      await addDoc(collection(db, 'sales'), {
        timestamp: cleanOrderData.dateOrdered || serverTimestamp(),
        total: cleanOrderData.total,
        quantity: totalQuantity,
        userId: user.uid,
        orderId: globalOrderDoc.id,
      });
      console.log("Sales analytics data saved");

      // --- AdminAnalytics Monthly and Weekly Aggregation ---
      try {
        const now = new Date();
        const monthKey = getMonthKey(now);
        const weekKey = getWeekKey(now);
        const dayOfWeek = now.toLocaleString('en-US', { weekday: 'short' }); // 'Sun', 'Mon', ...
        const dayOfMonth = String(now.getDate()); // '1', '2', ...
        // --- Weekly ---
        const weeklyRef = doc(db, 'AdminAnalytics', 'weekly_' + weekKey);
        const weeklySnap = await getDoc(weeklyRef);
        const allWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let weeklyDays = Object.fromEntries(allWeekDays.map(d => [d, 0]));
        let weeklyTotal = cleanOrderData.total;
        let weeklyQuantity = totalQuantity;
        if (weeklySnap.exists()) {
          const data = weeklySnap.data();
          weeklyDays = { ...weeklyDays, ...(data.days || {}) };
          weeklyDays[dayOfWeek] = (weeklyDays[dayOfWeek] || 0) + cleanOrderData.total;
          weeklyTotal = (data.total || 0) + cleanOrderData.total;
          weeklyQuantity = (data.quantity || 0) + totalQuantity;
        } else {
          weeklyDays[dayOfWeek] = cleanOrderData.total;
        }
        await setDoc(weeklyRef, {
          days: weeklyDays,
          total: weeklyTotal,
          quantity: weeklyQuantity,
          updatedAt: serverTimestamp(),
        });
        // --- Monthly ---
        const monthlyRef = doc(db, 'AdminAnalytics', 'monthly_' + monthKey);
        const monthlySnap = await getDoc(monthlyRef);
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        let monthlyDays = Object.fromEntries(Array.from({length: 31}, (_, i) => [String(i+1), 0]));
        let monthlyTotal = cleanOrderData.total;
        let monthlyQuantity = totalQuantity;
        if (monthlySnap.exists()) {
          const data = monthlySnap.data();
          monthlyDays = { ...monthlyDays, ...(data.days || {}) };
          monthlyDays[dayOfMonth] = (monthlyDays[dayOfMonth] || 0) + cleanOrderData.total;
          monthlyTotal = (data.total || 0) + cleanOrderData.total;
          monthlyQuantity = (data.quantity || 0) + totalQuantity;
        } else {
          monthlyDays[dayOfMonth] = cleanOrderData.total;
        }
        // Zero out days not in this month
        for (let d = daysInMonth + 1; d <= 31; d++) monthlyDays[String(d)] = 0;
        await setDoc(monthlyRef, {
          days: monthlyDays,
          total: monthlyTotal,
          quantity: monthlyQuantity,
          updatedAt: serverTimestamp(),
        });
        console.log('AdminAnalytics monthly and weekly sales updated');
      } catch (err) {
        console.error('Error updating AdminAnalytics monthly/weekly sales:', err);
      }

      // Update product stock (totalStock and sizes) for each item
      for (const item of cleanOrderData.items) {
        const productRef = doc(db, 'adminProducts', item.id);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          let updatedSizes = Array.isArray(productData.sizes) ? [...productData.sizes] : [];
          let updatedTotalStock = typeof productData.totalStock === 'number' ? productData.totalStock : null;
          // Update the size stock
          if (item.size) {
            updatedSizes = updatedSizes.map((size: any) => {
              if (size.size === item.size) {
                return { ...size, stock: Math.max(0, Number(size.stock) - Number(item.quantity)) };
              }
              return size;
            });
            // Recalculate totalStock
            updatedTotalStock = updatedSizes.reduce((sum: number, s: any) => sum + Number(s.stock), 0);
          }
          await updateDoc(productRef, {
            sizes: updatedSizes,
            totalStock: updatedTotalStock,
          });
          console.log("Updated stock for product:", item.id);
        }
      }

      // Update purchasedCount for each purchased product
      try {
        for (const item of cleanOrderData.items) {
          const productRef = doc(db, 'adminProducts', item.id);
          const productSnap = await getDoc(productRef);
          let currentCount = 0;
          if (productSnap.exists()) {
            currentCount = productSnap.data().purchasedCount || 0;
          }
          await updateDoc(productRef, { purchasedCount: currentCount + (item.quantity || 1) });
        }
      } catch (err) {
        console.error('Failed to update purchasedCount in adminProducts:', err);
      }

      // Log a 'purchase' activity to Firestore
      await addDoc(collection(db, "activities"), {
        type: "purchase",
        email: user.email,
        uid: user.uid,
        orderId: globalOrderDoc.id,
        timestamp: serverTimestamp(),
        items: cleanOrderData.items,
        total: cleanOrderData.total,
      });
      console.log("Purchase activity logged");

      removeFromCartByIds(selectedCartItems.map((item: any) => item.id));
      console.log("Removed checked-out items from cart");
      const receiptData = {
        orderNumber: cleanOrderData.orderNumber,
        date: new Date().toLocaleString(),
        user: {
          name: `${deliveryDetails.firstName} ${deliveryDetails.lastName}`,
          email: user.email,
          phone: deliveryDetails.phone,
        },
        items: cleanOrderData.items,
        subtotal: cleanOrderData.subtotal,
        shipping: cleanOrderData.shipping,
        total: cleanOrderData.total,
        paymentMethod: cleanOrderData.paymentMethod,
        reference,
        shippingAddress: deliveryDetails,
        billingAddress: billingDetails,
      };
      setReceipt(receiptData);
      setShowReceipt(true);
      setUserOrderId(userOrderDoc.id);
      await addDoc(collection(db, 'users', user.uid, 'orders', userOrderDoc.id, 'receipts'), receiptData);
      console.log("Receipt saved to Firebase");
      setShowSuccess(true);
      toast({
        title: "Successfully ordered.",
        description: "Thank you for purchasing with DPT ONE.",
        variant: "success"
      });
      console.log("Payment process complete, showing receipt");
    } catch (error) {
      console.log("Error occurred:", error);
      toast({ title: "Error", description: "Error saving order: " + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receipt) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'normal');
    // Set dark background
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 210, 297, 'F');
    // FROM section
    doc.setTextColor(100, 150, 255); // blue
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM', 12, 18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text('DPT ONE', 12, 24);
    // TO section
    doc.setTextColor(100, 150, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TO', 12, 34);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.user.name, 12, 40);
    doc.text(receipt.shippingAddress.address1 || '', 12, 45);
    doc.text(`${receipt.shippingAddress.city?.toUpperCase() || ''}, ${receipt.shippingAddress.region} ${receipt.shippingAddress.postalCode}`, 12, 50);
    // RECEIPT title
    doc.setTextColor(100, 150, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('RECEIPT', 198, 22, { align: 'right' });
    // Receipt #: and Date
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Receipt #:', 140, 32);
    doc.text('Receipt Date:', 140, 38);
    doc.setFont('helvetica', 'normal');
    doc.text(receipt.orderNumber, 198, 32, { align: 'right' });
    doc.text(formatDateMMDDYYYY(receipt.date), 198, 38, { align: 'right' });
    // Table header
    let y = 60;
    doc.setFillColor(30, 30, 30);
    doc.setDrawColor(100, 150, 255);
    doc.setTextColor(100, 150, 255);
    doc.setFont('helvetica', 'bold');
    doc.rect(12, y - 6, 186, 8, 'S');
    doc.text('QTY', 16, y);
    doc.text('Description', 36, y);
    doc.text('Unit Price', 120, y, { align: 'right' });
    doc.text('Amount', 196, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(255, 255, 255);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    // Table rows
    receipt.items.forEach((item: any) => {
      doc.text(String(item.quantity), 16, y);
      doc.text(item.name, 36, y);
      doc.text(`PHP ${item.price.toFixed(2)}`, 120, y, { align: 'right' });
      doc.text(`PHP ${(item.price * item.quantity).toFixed(2)}`, 196, y, { align: 'right' });
      y += 7;
    });
    // Subtotal, Shipping Fee, Total
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 150, y, { align: 'right' });
    doc.text(`PHP ${receipt.subtotal.toFixed(2)}`, 196, y, { align: 'right' });
    y += 7;
    doc.text('Shipping Fee:', 150, y, { align: 'right' });
    doc.text(`PHP ${receipt.shipping.toFixed(2)}`, 196, y, { align: 'right' });
    y += 7;
    doc.text('Total:', 150, y, { align: 'right' });
    doc.text(`PHP ${(receipt.subtotal + receipt.shipping).toFixed(2)}`, 196, y, { align: 'right' });
    // Terms and conditions
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 150, 255);
    doc.text('TERMS AND CONDITIONS', 12, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('Payment is due within 14 days of project completion.', 12, y);
    y += 5;
    doc.text('All checks to be made out to DPT ONE.', 12, y);
    y += 5;
    doc.text('Thank you for your business!', 12, y);
    // Footer - Contact Us
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 150, 255);
    doc.text('Contact Us', 12, 285);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('sisiglovers@gmail.com', 12, 290);
    doc.text('+639828282612', 12, 295);
    doc.text('Cebu, Philippines', 60, 295);
    doc.save(`DPTONE_Receipt_${receipt.orderNumber}.pdf`);
  };

  // Format date as MM/DD/YYYY
  function formatDateMMDDYYYY(dateString: string) {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  // Redirect to orders after payment success
  useEffect(() => {
    if (showSuccess && !showReceipt) {
      const timeout = setTimeout(() => {
        router.push("/orders");
      }, 2000); // 2 seconds
      return () => clearTimeout(timeout);
    }
  }, [showSuccess, showReceipt, router]);

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
            <div className="text-3xl font-bold text-[#38bdf8]">PHP{amount}</div>
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
              <li>Press confirm to continue.</li>
            </ol>
          </div>
          {/* Pay Button */}
          <Button
            className="w-full text-base font-bold py-2 rounded-lg bg-[#60A5FA] text-[#101828] hover:bg-[#38bdf8] transition"
            onClick={handlePay}
            disabled={Boolean((showSuccess && !showReceipt) || isProcessing)}
            style={{ zIndex: 10, position: 'relative' }}
          >
            {isProcessing ? "Processing..." : "Confirm"}
          </Button>
        </div>
        {/* Success Modal/Animation */}
        {showSuccess && !showReceipt && (
          <div className="absolute inset-0 bg-[#101828cc] flex flex-col items-center justify-center z-10 animate-fade-in pointer-events-auto">
            <div className="bg-white rounded-full p-4 mb-4 shadow-lg">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#60A5FA"/><path d="M16 25l6 6 10-12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="text-xl font-bold text-white mb-2">Payment Successful!</div>
            <div className="text-[#93c5fd]">Redirecting to your orders...</div>
          </div>
        )}
        {/* Receipt Modal */}
        {showReceipt && receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 pointer-events-auto">
            <div className="bg-white text-black rounded-lg shadow-lg p-8 max-w-2xl w-full relative">
              <button onClick={() => { setShowReceipt(false); router.push("/orders"); }} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
              <div className="flex justify-end mb-2">
                <button onClick={handleDownloadReceipt} className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                  <svg xmlns='http://www.w3.org/2000/svg' className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                  Download Receipt
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center">Payment Receipt</h2>
              <div className="mb-2 text-sm">Order #: <b>{receipt.orderNumber}</b></div>
              <div className="mb-2 text-sm">Date: <b>{formatDateMMDDYYYY(receipt.date)}</b></div>
              <div className="mb-2 text-sm">Reference #: <b>{receipt.reference}</b></div>
              <div className="mb-2 text-sm">Name: <b>{receipt.user.name}</b></div>
              <div className="mb-2 text-sm">Email: <b>{receipt.user.email}</b></div>
              <div className="mb-2 text-sm">Phone: <b>{receipt.user.phone}</b></div>
              <div className="mb-2 text-sm">Shipping Address: <b>{receipt.shippingAddress.address1}, {receipt.shippingAddress.city}, {receipt.shippingAddress.region}, {receipt.shippingAddress.postalCode}</b></div>
              <div className="mb-2 text-sm">Billing Address: <b>{receipt.billingAddress.address1}, {receipt.billingAddress.city}, {receipt.billingAddress.region}, {receipt.billingAddress.postalCode}</b></div>
              <div className="mb-2 text-sm">Payment Method: <b>{receipt.paymentMethod}</b></div>
              <Table className="my-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>PHP {item.price.toFixed(2)}</TableCell>
                      <TableCell>PHP {(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-8 text-lg font-semibold">
                <div>Subtotal: PHP {receipt.subtotal.toFixed(2)}</div>
                <div>Shipping: PHP {receipt.shipping.toFixed(2)}</div>
                <div>Total: PHP {receipt.total.toFixed(2)}</div>
              </div>
              <div className="mt-8 flex flex-col items-center">
                <p className="mb-2 text-blue-600 font-semibold">You can view your order status in your orders page.</p>
                <button
                  onClick={() => router.push("/orders")}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow"
                >
                  Go to My Orders
                </button>
              </div>
            </div>
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