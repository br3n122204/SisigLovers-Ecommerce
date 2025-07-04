import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function WelcomeCard() {
  const [dismissed, setDismissed] = useState(true); // Start as dismissed
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Show the modal only on the first page load in this session
    const hasShownModal = sessionStorage.getItem('welcomeModalShown');
    if (!hasShownModal) {
      setDismissed(false);
      sessionStorage.setItem('welcomeModalShown', 'true');
    } else {
      setDismissed(true);
    }
    setMounted(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('welcomeCardDismissed', 'true');
  };

  const handleStartShopping = () => {
    handleDismiss();
    router.push("/");
  };

  // Only show on homepage
  console.log('[WelcomeCard] pathname:', pathname, 'mounted:', mounted, 'dismissed:', dismissed);
  if (pathname !== "/" || !mounted || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex w-full max-w-3xl min-h-[340px] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#60A5FA] bg-[#101828]">
        {/* Left: Image */}
        <div className="w-1/2 min-w-[240px] min-h-[340px] bg-[#101828] flex items-center justify-center border-r-2 border-[#60A5FA] relative overflow-hidden">
          <img
            src="https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/Welcome%20Modal%20Image/welcomeModalImage.png"
            alt="Welcome"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span style="color:#60A5FA;font-size:1.2rem;">Image not found</span>'); }}
          />
        </div>
        {/* Right: Content */}
        <div className="w-1/2 flex flex-col justify-center items-center px-8 pt-12 pb-10 bg-[#19223a] text-[#60A5FA] flex-grow">
          {/* Animated Logo */}
          <div className="mb-4 animate-bounce mt-2 flex justify-center items-center">
            <Image
              src="https://ltfzekatcjpltiighukw.supabase.co/storage/v1/object/public/product-images/DPT%20ONE%20LOGO/DPTONELOGO.png"
              alt="DPT ONE Logo"
              width={80}
              height={80}
              className="rounded-full drop-shadow-lg bg-white"
              priority
              style={{ width: "80px", height: "80px" }}
            />
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-center">Welcome to DPT ONE!</h2>
          <p className="text-center mb-6 text-lg">Discover exclusive streetwear, local brands, and the freshest drops. Enjoy a seamless shopping experience—right here, right now.</p>
          <button
            className="w-[80%] bg-[#60A5FA] text-[#101828] font-bold py-4 rounded-lg shadow-md hover:bg-[#3380c0] transition-colors text-xl mb-3"
            onClick={handleStartShopping}
          >
            Start Shopping
          </button>
        </div>
      </div>
    </div>
  );
} 