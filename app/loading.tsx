import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin h-12 w-12 text-[#001F3F]" />
      <span className="ml-4 text-lg text-[#001F3F]">Loading...</span>
    </div>
  );
}
