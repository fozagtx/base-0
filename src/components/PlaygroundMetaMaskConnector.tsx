'use client';

import { useAccount, useConnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { useState } from 'react';
import { WalletModal } from './WalletModal';

export function PlaygroundMetaMaskConnector() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = () => {
    if (isConnected) {
      setShowModal(true);
    } else {
      connect({ connector: metaMask() });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={isPending}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
          isConnected
            ? "bg-green-600 border-green-500 text-white hover:bg-green-700"
            : "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {/* Connection status indicator */}
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-300' : 'bg-gray-400'
        }`}></div>

        {/* MetaMask Fox Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-orange-400"
        >
          <path
            d="M22.32 2.24L13.68 8.4l1.6-3.76 7.04-2.4z"
            fill="currentColor"
          />
          <path
            d="M1.68 2.24l8.56 6.24-1.52-3.84L1.68 2.24zM19.04 16.64l-2.32 3.52 4.96 1.36 1.44-4.8-4.08-.08zM1.28 16.72l1.44 4.8 4.96-1.36-2.32-3.52-4.08.08z"
            fill="currentColor"
            opacity="0.8"
          />
        </svg>

        <span className="font-medium text-sm">
          {isPending ? (
            "Connecting..."
          ) : isConnected ? (
            formatAddress(address!)
          ) : (
            "Connect MetaMask"
          )}
        </span>

        {/* Dropdown arrow for connected state */}
        {isConnected && !isPending && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
