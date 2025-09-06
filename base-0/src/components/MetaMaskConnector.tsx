'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

export function MetaMaskConnector() {
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
      className={`shadow-sm shadow-black/10 text-sm px-4 py-2 rounded transition-colors ${
        isConnected
          ? "bg-white text-black border border-black hover:bg-black/5"
          : "bg-black text-white hover:bg-black/90"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isPending ? (
        "Connecting..."
      ) : isConnected ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          {formatAddress(address!)}
        </span>
      ) : (
        "Connect MetaMask"
      )}
    </button>
  );
}
