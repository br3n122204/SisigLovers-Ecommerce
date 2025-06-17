"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { getAuth, updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase'; // Import db from firebase
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'; // Import Firestore functions

interface Address {
  id?: string;
  isDefault: boolean;
  country: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  postalCode: string;
  city: string;
  region: string;
  phone: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isAddingAddress, setIsAddingAddress] = useState(false); // New state for address modal
  const [addresses, setAddresses] = useState<Address[]>([]); // State to store addresses

  // State for Add Address Form
  const [newAddress, setNewAddress] = useState<Address>({
    isDefault: false,
    country: "Philippines",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    postalCode: "",
    city: "",
    region: "Abra",
    phone: "+63",
  });

  // For simplicity, email is read-only as per image. Firebase email update is separate.
  const userEmail = user?.email || "N/A";

  const handleEditClick = () => {
    setIsEditing(true);
    // Populate with existing data if available (e.g., from user object or a database fetch)
    if (user?.displayName) {
      const nameParts = user.displayName.split(' ');
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(' ') || "");
    } else {
      setFirstName("");
      setLastName("");
    }
  };

  const handleSave = async () => {
    if (!user) return; // Ensure user is not null

    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        console.error("No authenticated user found.");
        return;
      }
      await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}`,
      });
      await refreshUser(); // Call refreshUser after successful update
      console.log("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      // Handle error, e.g., show an error message to the user
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleAddAddressClick = () => {
    setIsAddingAddress(true);
  };

  const handleAddressModalClose = () => {
    setIsAddingAddress(false);
    setNewAddress({
      isDefault: false,
      country: "Philippines",
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      postalCode: "",
      city: "",
      region: "Abra",
      phone: "+63",
    }); // Clear form on close
  };

  const handleAddressSave = async () => {
    if (!user) return;

    try {
      const userAddressesCollection = collection(db, `users/${user.uid}/addresses`);
      await addDoc(userAddressesCollection, newAddress);
      console.log("Address saved successfully!");
      handleAddressModalClose(); // Close and clear form
      // Optionally, refresh addresses list after saving
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      // Handle error, e.g., show an error message to the user
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const addressesCollection = collection(db, `users/${user.uid}/addresses`);
      const q = query(addressesCollection);
      const querySnapshot = await getDocs(q);
      const fetchedAddresses: Address[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAddresses.push({ id: doc.id, ...doc.data() } as Address);
      });
      setAddresses(fetchedAddresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Fetch addresses on component mount or when user changes
  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Profile</h1>

        {/* Profile Information Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">{user?.displayName || 'Your Name'}</h2>
            <Button variant="ghost" onClick={handleEditClick} className="text-blue-600 hover:text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 18.07a4.5 4.5 0 0 1-1.897 1.13L6 20l1.123-3.723a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Edit
            </Button>
          </div>
          <p className="text-gray-600">Email: {userEmail}</p>
        </div>

        {/* Addresses Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Addresses</h2>
            <Button variant="ghost" onClick={handleAddAddressClick} className="text-blue-600 hover:text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add
            </Button>
          </div>
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No addresses added</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="border p-4 rounded-md">
                  <p className="font-semibold">{addr.firstName} {addr.lastName}</p>
                  <p>{addr.address1}</p>
                  {addr.address2 && <p>{addr.address2}</p>}
                  <p>{addr.city}, {addr.postalCode}</p>
                  <p>{addr.region}, {addr.country}</p>
                  <p>Phone: {addr.phone}</p>
                  {addr.isDefault && <span className="text-xs text-blue-600">Default Address</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit profile</h2>
                <button onClick={handleCancel} className="text-gray-500 hover:text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                  <input
                    type="text"
                    id="firstName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed sm:text-sm"
                    value={userEmail}
                    readOnly
                  />
                  <p className="mt-2 text-sm text-gray-500">Email used for login can't be changed</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancel} className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">Save</Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Address Modal */}
        {isAddingAddress && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-[700px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add address</h2>
                <button onClick={handleAddressModalClose} className="text-gray-500 hover:text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <label className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 mr-2"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  />
                  This is my default address
                </label>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country/region</label>
                  <select
                    id="country"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                  >
                    <option value="Philippines">Philippines</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="addressFirstName" className="block text-sm font-medium text-gray-700">First name</label>
                    <input
                      type="text"
                      id="addressFirstName"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm"
                      value={newAddress.firstName}
                      onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="addressLastName" className="block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      type="text"
                      id="addressLastName"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm"
                      value={newAddress.lastName}
                      onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    id="addressLine1"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm"
                    value={newAddress.address1}
                    onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">Apartment, suite, etc (optional)</label>
                  <input
                    type="text"
                    id="addressLine2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm"
                    value={newAddress.address2}
                    onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal code</label>
                    <input
                      type="text"
                      id="postalCode"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      id="city"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700">Region</label>
                  <select
                    id="region"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newAddress.region}
                    onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                  >
                    <option value="Abra">Abra</option>
                    {/* Add more regions as needed */}
                  </select>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+63</span>
                    {/* Placeholder for flag - requires an icon or image library */}
                    <input
                      type="text"
                      id="phone"
                      className="flex-1 block w-full rounded-none rounded-r-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={handleAddressModalClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
                <Button onClick={handleAddressSave} className="bg-blue-600 text-white hover:bg-blue-700">Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 