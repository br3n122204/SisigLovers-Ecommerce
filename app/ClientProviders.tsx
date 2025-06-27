"use client";
import React from "react";
import WelcomeAnimation from "@/components/WelcomeAnimation";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WelcomeAnimation />
      {children}
    </>
  );
} 