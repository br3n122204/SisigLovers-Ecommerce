"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, calculateTotal } = useCart();

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

  const handleProceedToPayment = () => {
    // Here you would typically process the order,
    // save delivery details, and handle payment.
    // For this example, we'll just log the details.
    console.log("Delivery Details:", deliveryDetails);
    console.log("Payment Method:", paymentMethod);
    console.log("Same as Shipping for Billing:", sameAsShipping);
    if (!sameAsShipping) {
      console.log("Billing Details:", billingDetails);
    }
    // In a real app, you'd navigate to a payment gateway or order confirmation page.
    alert("Order Submitted (Check console for details)");
  };

  const totalAmount = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Delivery and Payment */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Checkout</h1>

          {/* Account Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account</h2>
            <div className="flex items-center space-x-2 mb-4">
              <span className="font-medium">{deliveryDetails.email}</span>
            </div>
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                name="emailOffers"
                className="form-checkbox h-4 w-4 text-blue-600 mr-2"
                checked={deliveryDetails.emailOffers}
                onChange={handleInputChange}
              />
              Email me with news and offers
            </label>
          </div>

          {/* Delivery Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={deliveryDetails.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={deliveryDetails.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="address1" className="block text-sm font-medium text-gray-700">Address (Please do not forget to include your Barangay)</label>
              <input
                type="text"
                id="address1"
                name="address1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={deliveryDetails.address1}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address2" className="block text-sm font-medium text-gray-700">Apartment, suite, etc. (optional)</label>
              <input
                type="text"
                id="address2"
                name="address2"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={deliveryDetails.address2}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal code</label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={deliveryDetails.postalCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={deliveryDetails.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
              <select
                id="region"
                name="region"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={deliveryDetails.region}
                onChange={handleInputChange}
                required
              >
                <option value="Cebu">Cebu</option>
                {/* Add more regions as needed */}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={deliveryDetails.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Shipping Method Section */}
          <div className="mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping method</h2>
            <div className="bg-gray-50 p-4 rounded-md text-gray-700">
              Enter your shipping address to view available shipping methods.
            </div>
          </div>

          {/* Payment Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment</h2>
            <p className="text-sm text-gray-600 mb-4">All transactions are secure and encrypted.</p>

            {/* Payment Options */}
            <div className="border border-gray-300 rounded-md p-4 mb-4">
              <div className="flex items-center mb-4">
                <input
                  type="radio"
                  id="gcash"
                  name="paymentMethod"
                  value="gcash"
                  checked={paymentMethod === "gcash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="gcash" className="ml-3 block text-base font-medium text-gray-900">
                  GCash
                </label>
                <img src="/images/gcash-logo.png" alt="GCash" className="ml-auto h-6" />
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="cod"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="cod" className="ml-3 block text-base font-medium text-gray-900">
                  Cash on delivery (COD)
                </label>
              </div>
            </div>

            {/* Billing Address */}
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing address</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="sameAsShipping"
                  name="billingAddress"
                  checked={sameAsShipping}
                  onChange={() => setSameAsShipping(true)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sameAsShipping" className="ml-3 block text-sm font-medium text-gray-700">
                  Same as shipping address
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="differentBilling"
                  name="billingAddress"
                  checked={!sameAsShipping}
                  onChange={() => setSameAsShipping(false)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="differentBilling" className="ml-3 block text-sm font-medium text-gray-700">
                  Use a different billing address
                </label>
              </div>
            </div>
            {!sameAsShipping && (
              <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="mb-4">
                  <label htmlFor="savedAddresses" className="block text-sm font-medium text-gray-700">Saved addresses</label>
                  <select
                    id="savedAddresses"
                    name="savedAddresses"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    onChange={handleSavedAddressChange}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a saved address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="countryBilling" className="block text-sm font-medium text-gray-700">Country/Region</label>
                  <select
                    id="countryBilling"
                    name="country"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={billingDetails.country}
                    onChange={handleBillingInputChange}
                    required
                  >
                    <option value="Philippines">Philippines</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstNameBilling" className="block text-sm font-medium text-gray-700">First name (optional)</label>
                    <input
                      type="text"
                      id="firstNameBilling"
                      name="firstName"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={billingDetails.firstName}
                      onChange={handleBillingInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastNameBilling" className="block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      type="text"
                      id="lastNameBilling"
                      name="lastName"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={billingDetails.lastName}
                      onChange={handleBillingInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="address1Billing" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    id="address1Billing"
                    name="address1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={billingDetails.address1}
                    onChange={handleBillingInputChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="address2Billing" className="block text-sm font-medium text-gray-700">Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    id="address2Billing"
                    name="address2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={billingDetails.address2}
                    onChange={handleBillingInputChange}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="postalCodeBilling" className="block text-sm font-medium text-gray-700">Postal code</label>
                    <input
                      type="text"
                      id="postalCodeBilling"
                      name="postalCode"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={billingDetails.postalCode}
                      onChange={handleBillingInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="cityBilling" className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      id="cityBilling"
                      name="city"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={billingDetails.city}
                      onChange={handleBillingInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="regionBilling" className="block text-sm font-medium text-gray-700">Region</label>
                  <select
                    id="regionBilling"
                    name="region"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={billingDetails.region}
                    onChange={handleBillingInputChange}
                    required
                  >
                    <option value="Cebu">Cebu</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="phoneBilling" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    id="phoneBilling"
                    name="phone"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={billingDetails.phone}
                    onChange={handleBillingInputChange}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pay Now Button */}
          <Button
            className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition-colors"
            onClick={handleProceedToPayment}
          >
            Pay now
          </Button>
        </div>

        {/* Right Column: Order Summary */}
        <div className="bg-white p-8 rounded-lg shadow-md sticky top-8 h-fit">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your order</h2>
          {cartItems.length === 0 ? (
            <p className="text-gray-600">Your cart is empty.</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex items-center space-x-4">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                      <Image src={item.image} alt={item.name} width={96} height={96} className="object-contain" />
                      <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                    </div>
                    <p className="text-md font-medium text-gray-700">
                      ₱{(parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-gray-700 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₱{totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₱0.00</span> {/* Assuming free shipping for now */}
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 border-gray-200">
                  <span>Total</span>
                  <span>PHP ₱{totalAmount}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 