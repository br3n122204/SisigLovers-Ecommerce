import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin h-12 w-12 text-gray-500" />
      <span className="ml-4 text-lg text-gray-700">Loading...</span>
    </div>
  );
}
