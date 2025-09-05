"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask } from "wagmi/connectors";
import Image from "next/image";

export function DarkMetaMaskConnector() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect({ connector: metaMask() });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isPending}
      className={`w-full flex flex-col items-center justify-center space-y-4 px-6 py-8 rounded-lg border transition-all duration-200 text-white border-gray-600 hover:opacity-90 ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      style={{ backgroundColor: "#2A2A28" }}
    >
      {/* MetaMask Logo - Larger */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-16 h-16 relative">
          <Image
            src="/metamask-logo.svg"
            alt="MetaMask"
            width={64}
            height={64}
            className="w-full h-full"
          />
        </div>

        {/* Base Logo - Smaller and positioned below */}
        <div className="w-5 h-5 relative">
          <Image
            src="/base-logo.svg"
            alt="Base"
            width={20}
            height={20}
            className="w-full h-full"
          />
        </div>
      </div>

      <div className="text-center">
        <span className="font-medium text-lg">
          {isPending ? (
            "Connecting..."
          ) : isConnected ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
              <span className="text-sm font-mono text-gray-300">
                {formatAddress(address!)}
              </span>
            </div>
          ) : (
            "Continue with MetaMask"
          )}
        </span>
      </div>
    </button>
  );
}
