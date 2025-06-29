"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, calculateTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: user?.displayName?.split(" ")[0] || "",
    lastName: user?.displayName?.split(" ").slice(1).join(" ") || "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    region: "Cebu", // Default to Cebu as per image, can be dynamic
    phone: user?.phoneNumber || "+63",
    email: user?.email || "",
    emailOffers: false,
  });

  const [paymentMethod, setPaymentMethod] = useState("gcash"); // 'gcash' or 'cod'
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [billingDetails, setBillingDetails] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    region: "Cebu",
    country: "Philippines",
    phone: "+63",
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([
    {
      id: 1,
      address: "Dapdap carcar city cebu, 6019 Carcar City PH-CEB, Philippines (Brendan emmanuel flores)",
      firstName: "Brendan emmanuel",
      lastName: "flores",
      address1: "Dapdap carcar city cebu",
      address2: "",
      postalCode: "6019",
      city: "Carcar City",
      region: "Cebu",
      country: "Philippines",
      phone: "+639123456789"
    },
  ]); // Dummy saved addresses

  const [shippingMethod, setShippingMethod] = useState('standard');
  const shippingOptions = [
    { value: 'standard', label: 'Standard Shipping', time: '3–5 business days', price: 0 },
    { value: 'express', label: 'Express Shipping', time: '1–2 business days', price: 149 },
    { value: 'sameDay', label: 'Same Day Delivery', time: 'Same day', price: 299 },
  ];

  const getShippingPrice = () => {
    const selected = shippingOptions.find(opt => opt.value === shippingMethod);
    return selected ? selected.price : 0;
  };

  // Fetch addresses from Firestore
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      const addressesCollection = collection(db, `users/${user.uid}/addresses`);
      const q = query(addressesCollection);
      const querySnapshot = await getDocs(q);
      const fetchedAddresses: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAddresses.push({ id: doc.id, ...doc.data() });
      });
      // Sort so default address is first
      fetchedAddresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
      setAddresses(fetchedAddresses);
      // Set default selected address
      const defaultAddr = fetchedAddresses.find(addr => addr.isDefault) || fetchedAddresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setDeliveryDetails((prev) => ({
          ...prev,
          firstName: defaultAddr.firstName,
          lastName: defaultAddr.lastName,
          address1: defaultAddr.address1,
          address2: defaultAddr.address2 || "",
          postalCode: defaultAddr.postalCode,
          city: defaultAddr.city,
          region: defaultAddr.region,
          phone: defaultAddr.phone,
        }));
      }
    };
    fetchAddresses();
  }, [user]);

  // Update delivery details if user changes
  useEffect(() => {
    if (user) {
      setDeliveryDetails((prev) => ({
        ...prev,
        firstName: user.displayName?.split(" ")[0] || prev.firstName,
        lastName: user.displayName?.split(" ").slice(1).join(" ") || prev.lastName,
        phone: user.phoneNumber || prev.phone,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setDeliveryDetails((prev) => ({
      ...prev,
      [name]: inputValue,
    }));
  };

  const handleBillingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBillingDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavedAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAddress = savedAddresses.find(addr => addr.id === parseInt(e.target.value));
    if (selectedAddress) {
      setBillingDetails(selectedAddress);
    }
  };

  const saveOrderToFirebase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to place an order",
      });
      console.error("User not logged in");
      return;
    }

    try {
      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        orderNumber: `ORD-${Date.now()}`,
        orderDate: serverTimestamp(),
        status: 'pending',
        total: parseFloat(calculateTotal()) + getShippingPrice(),
        subtotal: parseFloat(calculateTotal()),
        shipping: getShippingPrice(),
        tax: 0,
        items: cartItems.map(item => ({
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
        billingAddress: sameAsShipping ? deliveryDetails : billingDetails,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        shippingMethod: shippingMethod,
        notes: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Clean undefined values deeply
      console.log('orderData before cleaning:', orderData);
      const cleanOrderData = deepCleanUndefined(orderData);
      console.log('orderData after cleaning:', cleanOrderData);

      // Save to global productsOrder collection (for admin/global view)
      const productsOrderRef = collection(db, 'productsOrder');
      // Always include userId in the global order
      const globalOrderDoc = await addDoc(productsOrderRef, {
        ...cleanOrderData,
        userId: user.uid, // <-- ensure userId is always present
      });
      console.log("Order saved to productsOrder with ID:", globalOrderDoc.id);

      // Save each cart item as a document in the orderDetails subcollection
      for (const item of cleanOrderData.items) {
        await addDoc(collection(db, 'productsOrder', globalOrderDoc.id, 'orderDetails'), item);
      }

      // Save to per-user users/{userId}/orders/{orderId} (append order to subcollection, do not create new user doc)
      const userOrdersRef = collection(db, 'users', user.uid, 'orders');
      // Always include globalOrderId in the user order
      const userOrderDoc = await addDoc(userOrdersRef, {
        ...cleanOrderData,
        globalOrderId: globalOrderDoc.id, // <-- ensure globalOrderId is always present
      });
      console.log("Order saved to users/{userId}/orders with ID:", userOrderDoc.id);

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

      toast({
        title: "Checkout successful",
      });
      return globalOrderDoc.id;
    } catch (error) {
      toast({
        title: "Error",
        description: "Error saving order: " + (error instanceof Error ? error.message : String(error)),
      });
      console.error("Error saving order:", error);
      throw error;
    }
  };

  const handleProceedToPayment = async () => {
    console.log('Checkout button clicked');
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to place an order",
      });
      console.error("User not logged in");
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
      });
      console.error("Cart is empty");
      return;
    }

    // Validate required fields
    if (!deliveryDetails.firstName || !deliveryDetails.lastName || !deliveryDetails.address1 || 
        !deliveryDetails.city || !deliveryDetails.postalCode || !deliveryDetails.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required delivery information",
      });
      console.error("Missing delivery details", deliveryDetails);
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === 'cod') {
        // Save order to Firebase
        const orderId = await saveOrderToFirebase();
        if (orderId) {
          // Show success message
          toast({
            title: "Checkout successful",
          });
          // Clear cart
          clearCart();
          // Navigate to orders page
          router.push('/orders');
        } else {
          toast({
            title: "Error",
            description: "Order was not saved. Please try again.",
          });
          console.error("Order was not saved (no orderId returned)");
        }
      } else {
        toast({
          title: "Info",
          description: "GCash payment processing will be implemented here",
        });
        console.log("GCash payment selected");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error processing order: " + (error instanceof Error ? error.message : String(error)),
      });
      console.error("Error processing order:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = (parseFloat(calculateTotal()) + getShippingPrice()).toFixed(2);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Checkout Form */}
          <div className="md:col-span-2 space-y-10">
            <h1 className="text-3xl font-bold text-[var(--accent)] mb-6">Checkout</h1>
            {/* Account Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[var(--accent)] mb-2">Account</h2>
              <p className="text-[var(--foreground)] font-semibold">{user?.email}</p>
            </div>
            <hr className="border-[var(--sidebar)] my-6" />
            {/* Address Selector */}
            {addresses.length > 0 && (
              <div className="mb-4">
                <label className="block text-[var(--foreground)] mb-1">Select Address</label>
                <select
                  className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none"
                  value={selectedAddressId || ""}
                  onChange={e => {
                    setSelectedAddressId(e.target.value);
                    const addr = addresses.find(a => a.id === e.target.value);
                    if (addr) {
                      setDeliveryDetails(prev => ({
                        ...prev,
                        firstName: addr.firstName,
                        lastName: addr.lastName,
                        address1: addr.address1,
                        address2: addr.address2 || "",
                        postalCode: addr.postalCode,
                        city: addr.city,
                        region: addr.region,
                        phone: addr.phone,
                      }));
                    }
                  }}
                >
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id} className="bg-[var(--card)] text-[var(--foreground)]">
                      {addr.isDefault ? "[Default] " : ""}
                      {addr.address1}, {addr.city}, {addr.region}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Delivery Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[var(--accent)] mb-2">Delivery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--foreground)] mb-1">First name</label>
                  <input name="firstName" value={deliveryDetails.firstName} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[var(--foreground)] mb-1">Last name</label>
                  <input name="lastName" value={deliveryDetails.lastName} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[var(--foreground)] mb-1">Address (Please do not forget to include your Barangay)</label>
                  <input name="address1" value={deliveryDetails.address1} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[var(--foreground)] mb-1">Apartment, suite, etc. (optional)</label>
                  <input name="address2" value={deliveryDetails.address2} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[var(--foreground)] mb-1">Postal code</label>
                  <input name="postalCode" value={deliveryDetails.postalCode} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[var(--foreground)] mb-1">City</label>
                  <input name="city" value={deliveryDetails.city} onChange={handleInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                </div>
              </div>
            </div>
            {/* Shipping Method Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[var(--accent)] mb-2">Shipping method</h2>
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-2">
                {shippingOptions.map(option => (
                  <label key={option.value} className="flex items-center cursor-pointer text-[var(--foreground)]">
                    <RadioGroupItem value={option.value} id={`shipping-${option.value}`} />
                    <span className="ml-2">{option.label} ({option.time}) — ₱{option.price.toFixed(2)}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            {/* Payment Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[var(--accent)] mb-2">Payment</h2>
              <p className="text-[var(--foreground)] mb-2">All transactions are secure and encrypted.</p>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                <label className="flex items-center cursor-pointer text-[var(--foreground)]">
                  <RadioGroupItem value="gcash" id="payment-gcash" />
                  <span className="ml-2 flex items-center">
                    GCash
                    <img
                      src="/GCash_Logo.png"
                      alt="GCash Logo"
                      className="ml-2 h-6 w-6 object-contain"
                    />
                  </span>
                </label>
                <label className="flex items-center cursor-pointer text-[var(--foreground)]">
                  <RadioGroupItem value="cod" id="payment-cod" />
                  <span className="ml-2">Cash on delivery (COD)</span>
                </label>
              </RadioGroup>
            </div>
            {/* Billing Address */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[var(--accent)] mb-2">Billing address</h2>
              <RadioGroup value={sameAsShipping ? "same" : "different"} onValueChange={v => setSameAsShipping(v === "same")} className="space-y-2">
                <label className="flex items-center cursor-pointer text-[var(--foreground)]">
                  <RadioGroupItem value="same" id="billing-same" />
                  <span className="ml-3 block text-sm font-medium">Same as shipping address</span>
                </label>
                <label className="flex items-center cursor-pointer text-[var(--foreground)]">
                  <RadioGroupItem value="different" id="billing-different" />
                  <span className="ml-3 block text-sm font-medium">Use a different billing address</span>
                </label>
              </RadioGroup>
              {!sameAsShipping && (
                <div className="mt-4 p-4 border border-[var(--sidebar)] rounded-md bg-[var(--card)]">
                  <div className="mb-4">
                    <label className="block text-[var(--foreground)] mb-1">Saved addresses</label>
                    <select
                      className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none"
                      value={selectedAddressId || undefined}
                      onChange={e => {
                        setSelectedAddressId(e.target.value);
                        const addr = savedAddresses.find(a => a.id === e.target.value);
                        if (addr) {
                          setBillingDetails(addr);
                        }
                      }}
                    >
                      {savedAddresses.map(addr => (
                        <option key={addr.id} value={addr.id} className="bg-[var(--card)] text-[var(--foreground)]">{addr.address}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[var(--foreground)] mb-1">Country/Region</label>
                    <select
                      className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none"
                      value={billingDetails.country}
                      onChange={e => setBillingDetails(prev => ({ ...prev, country: e.target.value }))}
                    >
                      <option value="Philippines" className="bg-[var(--card)] text-[var(--foreground)]">Philippines</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--foreground)] mb-1">First name (optional)</label>
                      <input name="firstName" value={billingDetails.firstName} onChange={handleBillingInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[var(--foreground)] mb-1">Last name</label>
                      <input name="lastName" value={billingDetails.lastName} onChange={handleBillingInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[var(--foreground)] mb-1">Address</label>
                      <input name="address1" value={billingDetails.address1} onChange={handleBillingInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[var(--foreground)] mb-1">Apartment, suite, etc. (optional)</label>
                      <input name="address2" value={billingDetails.address2} onChange={handleBillingInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[var(--foreground)] mb-1">Postal code</label>
                      <input name="postalCode" value={billingDetails.postalCode} onChange={handleBillingInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[var(--foreground)] mb-1">City</label>
                      <input name="city" value={billingDetails.city} onChange={handleBillingInputChange} className="w-full px-3 py-2 rounded bg-[var(--card)] text-[var(--foreground)] border border-[var(--sidebar)] focus:border-[var(--accent)] focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Place Order Button */}
            <Button
              className="w-full bg-[var(--accent)] text-white py-3 rounded-md hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors mt-6 font-semibold"
              onClick={handleProceedToPayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Place Order"}
            </Button>
          </div>
          {/* Order Summary */}
          <div className="md:col-span-1 bg-[var(--card)] p-6 rounded-lg shadow-sm h-fit sticky top-20 border border-[var(--sidebar)]">
            <h2 className="text-xl font-bold text-[var(--accent)] mb-4">Your order</h2>
            {cartItems.length === 0 ? (
              <div className="text-[var(--foreground)]">No items in cart.</div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b border-[var(--sidebar)] pb-4">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-[var(--sidebar)] bg-[var(--sidebar)]">
                      <Image src={item.image ? item.image : "/images/placeholder.jpg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[var(--foreground)]">{item.name}</div>
                      {item.selectedSize && (
                        <div className="text-sm text-[var(--foreground)]">Size: {item.selectedSize}</div>
                      )}
                    </div>
                    <div className="font-bold text-[var(--accent)]">₱{item.price}</div>
                  </div>
                ))}
                <div className="flex justify-between text-[var(--foreground)] mt-4">
                  <span>Subtotal</span>
                  <span>₱{calculateTotal()}</span>
                </div>
                <div className="flex justify-between text-[var(--foreground)]">
                  <span>Shipping</span>
                  <span>₱{getShippingPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 border-[var(--sidebar)] text-[var(--accent)]">
                  <span>Total</span>
                  <span>₱{totalAmount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 