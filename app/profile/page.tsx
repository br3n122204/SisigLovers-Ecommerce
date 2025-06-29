"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component
import { getAuth, updateProfile } from 'firebase/auth';
import { db } from '@/lib/firebase'; // Import db from firebase
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore'; // Import Firestore functions

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
  phoneCode: string;
  phone: string;
}

export default function ProfilePage() {
  console.log("ProfilePage rendered");
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
    phoneCode: "+63",
    phone: "",
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
      phoneCode: "+63",
      phone: "",
    }); // Clear form on close
  };

  const handleAddressSave = async () => {
    console.log("[DEBUG] handleAddressSave called");
    // Validation: check only required fields (address2 is optional)
    if (
      !newAddress.firstName.trim() ||
      !newAddress.lastName.trim() ||
      !newAddress.address1.trim() ||
      !newAddress.postalCode.trim() ||
      !newAddress.city.trim() ||
      !newAddress.region.trim() ||
      !newAddress.country.trim() ||
      !newAddress.phoneCode.trim() ||
      !newAddress.phone.trim()
    ) {
      console.log("[DEBUG] Validation failed: missing required fields");
      alert("Please fill out all the fields.");
      return;
    }

    // Additional validation for +63 phone numbers
    if (newAddress.phoneCode === '+63' && !newAddress.phone.startsWith('0')) {
      console.log("[DEBUG] Validation failed: +63 phone does not start with 0");
      alert('For Philippine numbers (+63), the phone number must start with 0.');
      return;
    }

    if (!user) {
      console.log("[DEBUG] No user found");
      alert('You must be logged in to save an address.');
      return;
    }

    try {
      const addressToSave = {
        firstName: newAddress.firstName,
        lastName: newAddress.lastName,
        address1: newAddress.address1,
        address2: newAddress.address2 || '',
        city: newAddress.city,
        region: newAddress.region,
        country: newAddress.country,
        postalCode: newAddress.postalCode,
        phone: newAddress.phoneCode === '+63'
          ? `+63${newAddress.phone.replace(/^0/, '')}`
          : `${newAddress.phoneCode}${newAddress.phone}`,
        isDefault: newAddress.isDefault,
        createdAt: serverTimestamp(),
      };
      console.log("[DEBUG] About to write to Firestore:", addressToSave);
      const userAddressesCollection = collection(db, `users/${user.uid}/addresses`);
      await addDoc(userAddressesCollection, addressToSave);
      console.log("[DEBUG] Firestore write successful");
      handleAddressModalClose();
      console.log("[DEBUG] Modal closed after save");
      await fetchAddresses();
      console.log("[DEBUG] fetchAddresses called after save");
    } catch (error) {
      console.error('[DEBUG] Error saving address:', error);
      alert('Failed to save address. Please try again.');
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
      console.log('Fetched addresses:', fetchedAddresses);
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

  useEffect(() => {
    if (isAddingAddress) {
      console.log('Add Address Modal mounted');
    }
  }, [isAddingAddress]);

  // Set selected address as default and unset others
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;
    try {
      const addressesCollection = collection(db, `users/${user.uid}/addresses`);
      const q = query(addressesCollection);
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        const ref = doc(db, `users/${user.uid}/addresses/${docSnap.id}`);
        batch.update(ref, { isDefault: docSnap.id === addressId });
      });
      await batch.commit();
      await fetchAddresses();
    } catch (error) {
      alert('Failed to set default address.');
      console.error(error);
    }
  };

  // Remove address handler
  const handleRemoveAddress = async (addressId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/addresses/${addressId}`));
      await fetchAddresses();
    } catch (error) {
      alert('Failed to remove address.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA]">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-8">
        <div className="bg-[#19223a] rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-extrabold mb-8 text-[#60A5FA]">Profile</h1>
          <div className="bg-[#101828] rounded-xl p-6 mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#60A5FA] mb-1">Your Name</h2>
              <p className="text-[#60A5FA]">Email: {userEmail}</p>
            </div>
            <button className="flex items-center gap-2 text-[#60A5FA] border border-[#60A5FA] px-4 py-2 rounded-lg font-semibold hover:bg-[#60A5FA] hover:text-[#101828] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.183L7.5 20.213l-4.243 1.06 1.06-4.243 12.545-12.543z" />
              </svg>
              Edit
            </button>
          </div>
          <div className="bg-[#101828] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#60A5FA]">Addresses</h2>
              <button className="flex items-center gap-2 text-[#60A5FA] border border-[#60A5FA] px-4 py-2 rounded-lg font-semibold hover:bg-[#60A5FA] hover:text-[#101828] transition-colors">
                <span className="text-lg font-bold">+</span> Add
              </button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-[#60A5FA]">No addresses added</p>
            ) : (
              <div className="space-y-4">
                {[...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map((addr) => (
                  <div key={addr.id} className="border p-4 rounded-md">
                    <p className="font-semibold">{addr.firstName} {addr.lastName}</p>
                    <p>{addr.address1}</p>
                    {addr.address2 && <p>{addr.address2}</p>}
                    <p>{addr.city}, {addr.postalCode}</p>
                    <p>{addr.region}, {addr.country}</p>
                    <p>Phone: {addr.phone}</p>
                    {addr.isDefault && <span className="text-xs text-blue-600">Default Address</span>}
                    <div className="flex items-center space-x-4 mt-2">
                      {!addr.isDefault && (
                        <button
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                          onClick={() => handleSetDefaultAddress(addr.id!)}
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        className="text-xs text-red-600 underline hover:text-red-800"
                        onClick={() => handleRemoveAddress(addr.id!)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 