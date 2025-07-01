"use client";
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ReturnReasonPage() {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you could send the reason to your backend or Firestore
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-green-700">Thank you!</h1>
          <p className="mb-6">Your return/refund request for order <span className="font-semibold">{orderId}</span> has been submitted.</p>
          <Button onClick={() => router.push('/orders')}>Back to My Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-red-700">Return / Refund Request</h1>
        <p className="mb-4">Please tell us why you want to return this item:</p>
        <textarea
          className="w-full border border-gray-300 rounded p-2 mb-4"
          rows={5}
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
          placeholder="Enter your reason here..."
        />
        <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">Submit Request</Button>
      </form>
    </div>
  );
} 