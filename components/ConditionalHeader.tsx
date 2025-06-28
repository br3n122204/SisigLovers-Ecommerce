"use client";

import { usePathname } from 'next/navigation';
import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return null;
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
    </>
  );
} 