"use client";

import { DarkMetaMaskConnector } from "@/components/DarkMetaMaskConnector";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      // Redirect to playground when wallet is connected
      router.push("/playground");
    }
  }, [isConnected, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0f0f0f" }}
    >
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-black rounded-full"></div>
            </div>
            <span className="text-3xl font-bold text-white">Base0</span>
          </div>
        </div>

        {/* Title */}
        {/*<div className="text-center mb-12">
        </div>*/}

        {/* Main Action Button */}
        <div className="mb-8">
          <div className="relative">
            <DarkMetaMaskConnector />
            <div className="absolute -top-2 -right-2">
              <span
                className="text-xs px-2 py-1 rounded-full text-black"
                style={{ backgroundColor: "#EBEBEB" }}
              >
                Last used
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
