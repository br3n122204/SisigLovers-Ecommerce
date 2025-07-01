"use client";
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function RateOrderPage() {
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you could send the rating to your backend or Firestore
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-yellow-700">Thank you!</h1>
          <p className="mb-6">Your rating for order <span className="font-semibold">{orderId}</span> has been submitted.</p>
          <Button onClick={() => router.push('/orders')}>Back to My Orders</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-yellow-700">Rate Your Order</h1>
        <p className="mb-4">How would you rate your experience with this order?</p>
        <div className="flex justify-center mb-6">
          {[1,2,3,4,5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-4xl ${selectedRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              onClick={() => setSelectedRating(star)}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
        <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white" disabled={selectedRating === 0}>
          Submit Rating
        </Button>
      </form>
    </div>
  );
} 