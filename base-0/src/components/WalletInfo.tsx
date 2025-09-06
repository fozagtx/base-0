"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { formatEther } from "viem";

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { filBalance, isLoading } = useBalances();
  const [showModal, setShowModal] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  if (!isConnected || !address) {
    return null;
  }

  const handleClick = () => {
    setShowModal(true);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  // Close modal when clicking outside
  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: bigint) => {
    const ethValue = parseFloat(formatEther(balance));
    return ethValue.toFixed(4);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
        title="Click to manage wallet connection"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{formatAddress(address)}</span>
          <span className="text-xs text-gray-300">
            {isLoading ? "..." : `${formatBalance(filBalance)} FIL`}
          </span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-400"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16,17 21,12 16,7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl transform transition-all duration-200 ease-out scale-100">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-orange-400"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                Disconnect Wallet
              </h3>

              <p className="text-gray-300 mb-4 text-sm">
                Are you sure you want to disconnect your wallet?
              </p>

              <div className="bg-gray-800 rounded-lg p-3 mb-6">
                <div className="text-sm text-gray-200 font-medium">
                  {address}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Balance:{" "}
                  {isLoading
                    ? "Loading..."
                    : `${formatBalance(filBalance)} FIL`}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
