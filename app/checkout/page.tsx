"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { collection, getDocs, query, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
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
  const { cartItems, calculateTotal, clearCart, removeFromCartByIds } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Get selected item IDs from query string (treat as strings)
  const selectedIdsParam = searchParams.get('selected');
  const selectedIds = selectedIdsParam ? selectedIdsParam.split(',') : cartItems.map(item => String(item.id));
  const selectedCartItems = cartItems.filter(item => selectedIds.includes(String(item.id)));

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
        billingAddress: sameAsShipping ? deliveryDetails : billingDetails,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        shippingMethod: shippingMethod,
        notes: ''
      };

      // Clean undefined values deeply
      console.log('orderData before cleaning:', orderData);
      const cleanOrderData = deepCleanUndefined(orderData);
      // Guarantee dateOrdered is always set after cleaning
      cleanOrderData.dateOrdered = serverTimestamp();
      console.log('orderData after cleaning:', cleanOrderData);

      // Save to global productsOrder collection (for admin/global view)
      const adminProductId = cleanOrderData.items[0]?.id;
      if (!adminProductId) throw new Error('No adminProductId found in order items');
      const productsOrderRef = collection(db, 'adminProducts', adminProductId, 'productsOrder');
      // Always include userId in the global order
      const globalOrderDoc = await addDoc(productsOrderRef, {
        ...cleanOrderData,
        userId: user.uid, // <-- ensure userId is always present
      });
      console.log("Order saved to adminProducts/" + adminProductId + "/productsOrder with ID:", globalOrderDoc.id);

      // Save each cart item as a document in the orderDetails subcollection
      for (const item of cleanOrderData.items) {
        await addDoc(collection(db, 'adminProducts', adminProductId, 'productsOrder', globalOrderDoc.id, 'orderDetails'), {
          ...item,
          dateOrdered: cleanOrderData.dateOrdered,
        });
      }

      // Save to per-user users/{userId}/orders/{orderId} (append order to subcollection, do not create new user doc)
      const userOrdersRef = collection(db, 'users', user.uid, 'orders');
      // Always include globalOrderId in the user order
      const userOrderDoc = await addDoc(userOrdersRef, {
        ...cleanOrderData,
        globalOrderId: globalOrderDoc.id, // <-- ensure globalOrderId is always present
      });
      console.log("Order saved to users/{userId}/orders with ID:", userOrderDoc.id);

      // Update the global order with the userOrderId
      await updateDoc(doc(db, 'adminProducts', adminProductId, 'productsOrder', globalOrderDoc.id), {
        userOrderId: userOrderDoc.id,
      });

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
        }
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

    if (selectedCartItems.length === 0) {
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
          // Remove only checked-out items from cart
          removeFromCartByIds(selectedCartItems.map(item => item.id));
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

  // Calculate total for only selectedCartItems
  const calculateSelectedTotal = () => {
    return selectedCartItems.reduce((total, item) => {
      let price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : Number(item.price);
      return total + (price * item.quantity);
    }, 0).toFixed(2);
  };
  const totalAmount = (parseFloat(calculateSelectedTotal()) + getShippingPrice()).toFixed(2);

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Delivery and Payment */}
        <div className="bg-[#19223a] p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-[#60A5FA]">Checkout</h1>

          {/* Account Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#60A5FA] mb-4">Account</h2>
            <div className="flex items-center space-x-2 mb-4">
              <span className="font-medium text-[#60A5FA]">{deliveryDetails.email}</span>
            </div>
          </div>

          {/* Address Selector */}
          {addresses.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#60A5FA]">Select Address</label>
              <select
                className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
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
                  <option key={addr.id} value={addr.id}>
                    {addr.isDefault ? "[Default] " : ""}
                    {addr.address1}, {addr.city}, {addr.region}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Delivery Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#60A5FA] mb-4">Delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#60A5FA]">First name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={deliveryDetails.firstName}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#60A5FA]">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={deliveryDetails.lastName}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="address1" className="block text-sm font-medium text-[#60A5FA]">Address (Please do not forget to include your Barangay)</label>
              <input
                type="text"
                id="address1"
                name="address1"
                className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                value={deliveryDetails.address1}
                onChange={handleInputChange}
                required
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address2" className="block text-sm font-medium text-[#60A5FA]">Apartment, suite, etc. (optional)</label>
              <input
                type="text"
                id="address2"
                name="address2"
                className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                value={deliveryDetails.address2}
                onChange={handleInputChange}
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-[#60A5FA]">Postal code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={deliveryDetails.postalCode}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-[#60A5FA]">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={deliveryDetails.city}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="region" className="block text-sm font-medium text-[#60A5FA]">Region</label>
              <Select value={deliveryDetails.region} onValueChange={value => setDeliveryDetails(prev => ({ ...prev, region: value }))}>
                <SelectTrigger className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm px-4 py-2 h-12 flex items-center justify-between text-base bg-[#101828] text-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA]">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cebu">Cebu</SelectItem>
                  {/* Add more regions as needed */}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-[#60A5FA]">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                value={deliveryDetails.phone}
                onChange={handleInputChange}
                required
                autoComplete="off"
              />
            </div>
          </div>

          {/* Shipping Method Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#60A5FA] mb-4">Shipping method</h2>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-2">
              {shippingOptions.map(option => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <RadioGroupItem value={option.value} id={`shipping-${option.value}`} className="accent-[#60A5FA] focus:ring-[#60A5FA] border-[#60A5FA]" />
                  <span className="ml-2">{option.label} ({option.time}) — ₱{option.price.toFixed(2)}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-[#60A5FA] mb-4">Payment</h2>
            <p className="text-[#60A5FA] mb-2">All transactions are secure and encrypted.</p>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <RadioGroupItem value="gcash" id="payment-gcash" className="accent-[#60A5FA] focus:ring-[#60A5FA] border-[#60A5FA]" />
                <span className="ml-2 flex items-center">
                  GCash
                  <img
                    src="https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/GCash_Logo.jpg"
                    alt="GCash Logo"
                    className="ml-2 h-6 w-6 object-contain"
                  />
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <RadioGroupItem value="cod" id="payment-cod" className="accent-[#60A5FA] focus:ring-[#60A5FA] border-[#60A5FA]" />
                <span className="ml-2">Cash on delivery (COD)</span>
              </label>
            </RadioGroup>
          </div>

          {/* Billing Address */}
          <h2 className="text-xl font-semibold text-[#60A5FA] mb-4">Billing address</h2>
          <RadioGroup value={sameAsShipping ? "same" : "different"} onValueChange={v => setSameAsShipping(v === "same")} className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <RadioGroupItem value="same" id="billing-same" className="accent-[#60A5FA] focus:ring-[#60A5FA] border-[#60A5FA]" />
              <span className="ml-3 block text-sm font-medium text-[#60A5FA]">Same as shipping address</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <RadioGroupItem value="different" id="billing-different" className="accent-[#60A5FA] focus:ring-[#60A5FA] border-[#60A5FA]" />
              <span className="ml-3 block text-sm font-medium text-[#60A5FA]">Use a different billing address</span>
            </label>
          </RadioGroup>
          {!sameAsShipping && (
            <div className="mt-4 p-4 border border-[#60A5FA] rounded-md bg-[#101828]">
              <div className="mb-4">
                <label htmlFor="savedAddresses" className="block text-sm font-medium text-[#60A5FA]">Saved addresses</label>
                <Select value={selectedAddressId || undefined} onValueChange={value => {
                  setSelectedAddressId(value);
                  const addr = savedAddresses.find(a => a.id === value);
                  if (addr) {
                    setBillingDetails(addr);
                  }
                }}>
                  <SelectTrigger className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm px-4 py-2 h-12 flex items-center justify-between text-base bg-[#101828] text-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA]">
                    <SelectValue placeholder="Select a saved address" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedAddresses.map(addr => (
                      <SelectItem key={addr.id} value={addr.id}>{addr.address}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label htmlFor="countryBilling" className="block text-sm font-medium text-[#60A5FA]">Country/Region</label>
                <Select value={billingDetails.country} onValueChange={value => setBillingDetails(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm px-4 py-2 h-12 flex items-center justify-between text-base bg-[#101828] text-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA]">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="firstNameBilling" className="block text-sm font-medium text-[#60A5FA]">First name (optional)</label>
                  <input
                    type="text"
                    id="firstNameBilling"
                    name="firstName"
                    className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                    value={billingDetails.firstName}
                    onChange={handleBillingInputChange}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="lastNameBilling" className="block text-sm font-medium text-[#60A5FA]">Last name</label>
                  <input
                    type="text"
                    id="lastNameBilling"
                    name="lastName"
                    className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                    value={billingDetails.lastName}
                    onChange={handleBillingInputChange}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="address1Billing" className="block text-sm font-medium text-[#60A5FA]">Address</label>
                <input
                  type="text"
                  id="address1Billing"
                  name="address1"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={billingDetails.address1}
                  onChange={handleBillingInputChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="address2Billing" className="block text-sm font-medium text-[#60A5FA]">Apartment, suite, etc. (optional)</label>
                <input
                  type="text"
                  id="address2Billing"
                  name="address2"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={billingDetails.address2}
                  onChange={handleBillingInputChange}
                  autoComplete="off"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="postalCodeBilling" className="block text-sm font-medium text-[#60A5FA]">Postal code</label>
                  <input
                    type="text"
                    id="postalCodeBilling"
                    name="postalCode"
                    className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                    value={billingDetails.postalCode}
                    onChange={handleBillingInputChange}
                    required
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="cityBilling" className="block text-sm font-medium text-[#60A5FA]">City</label>
                  <input
                    type="text"
                    id="cityBilling"
                    name="city"
                    className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                    value={billingDetails.city}
                    onChange={handleBillingInputChange}
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="regionBilling" className="block text-sm font-medium text-[#60A5FA]">Region</label>
                <Select value={billingDetails.region} onValueChange={value => setBillingDetails(prev => ({ ...prev, region: value }))}>
                  <SelectTrigger className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm px-4 py-2 h-12 flex items-center justify-between text-base bg-[#101828] text-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA]">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cebu">Cebu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label htmlFor="phoneBilling" className="block text-sm font-medium text-[#60A5FA]">Phone</label>
                <input
                  type="text"
                  id="phoneBilling"
                  name="phone"
                  className="mt-1 block w-full border border-[#60A5FA] rounded-md shadow-sm p-2 focus:ring-[#60A5FA] focus:border-[#60A5FA] sm:text-sm bg-[#101828] text-[#60A5FA]"
                  value={billingDetails.phone}
                  onChange={handleBillingInputChange}
                  required
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {/* Pay Now Button */}
          <Button
            className="w-full bg-[#60A5FA] text-[#101828] py-3 rounded-md hover:bg-[#3380c0] transition-colors"
            onClick={handleProceedToPayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Checkout"}
          </Button>
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-[#19223a] p-8 rounded-lg shadow-md sticky top-8 h-fit">
          <h2 className="text-xl font-bold text-[#60A5FA] mb-4">Your order</h2>
          {selectedCartItems.length === 0 ? (
            <p className="text-[#60A5FA]">Your cart is empty.</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                
                {selectedCartItems.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex items-center space-x-4">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={96} height={96} className="object-contain" />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-[#19223a] text-[#60A5FA] text-xs">No Image</div>
                      )}
                      <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-[#60A5FA]">{item.name}</h3>
                      {item.selectedSize && (
                        <p className="text-sm text-[#60A5FA]">
                          Size: {typeof item.selectedSize === 'object' && item.selectedSize !== null && 'size' in item.selectedSize
                            ? (item.selectedSize as any).size
                            : item.selectedSize}
                        </p>
                      )}
                    </div>
                    <p className="text-md font-medium text-[#60A5FA]">
                      ₱{
                        ((typeof item.price === "string"
                          ? parseFloat(item.price.replace(/[^\d.]/g, ''))
                          : item.price) * item.quantity
                        ).toFixed(2)
                      }
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-[#60A5FA] pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₱{calculateSelectedTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₱{getShippingPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 border-gray-200">
                  <span>Total</span>
                  <span>₱{totalAmount}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}