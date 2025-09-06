"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useEffect } from "react";

export const WalletConnect = () => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Auto-switch to Filecoin Calibration if connected to wrong network
  useEffect(() => {
    if (isConnected && chainId && chainId !== 314159 && chainId !== 314) {
      // If not on Filecoin network, suggest switching to Calibration testnet
      console.log(
        `Currently on chain ${chainId}, suggesting switch to Filecoin Calibration`,
      );
    }
  }, [isConnected, chainId]);

  const handleNetworkSwitch = (targetChainId: 314 | 314159) => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 314:
        return "Filecoin Mainnet";
      case 314159:
        return "Filecoin Calibration";
      default:
        return `Chain ${chainId}`;
    }
  };

  const isFilecoinNetwork = (chainId: number) => {
    return chainId === 314 || chainId === 314159;
  };

  if (isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="text-green-400 font-semibold mb-2">
            ✅ Wallet Connected
          </div>
          <div className="text-sm text-gray-300">
            Address:{" "}
            <span className="font-mono text-blue-300">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <div className="text-sm text-gray-300 mt-1">
            Network:{" "}
            <span className="font-semibold">
              {getNetworkName(chainId || 0)}
            </span>
          </div>
        </div>

        {/* Network switching */}
        {chainId && !isFilecoinNetwork(chainId) && (
          <div className="text-center p-3 bg-yellow-800 rounded-lg border border-yellow-600">
            <div className="text-yellow-200 text-sm mb-2">
              ⚠️ Please switch to a Filecoin network to upload files
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => handleNetworkSwitch(314159)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Switch to Calibration
              </button>
              <button
                onClick={() => handleNetworkSwitch(314)}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Switch to Mainnet
              </button>
            </div>
          </div>
        )}

        {chainId && isFilecoinNetwork(chainId) && (
          <div className="text-center p-2 bg-green-800 rounded-lg">
            <div className="text-green-200 text-sm">
              🎉 Ready to upload to Filecoin!
            </div>
          </div>
        )}

        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-400 text-sm">
          Connect to MetaMask or WalletConnect to upload files to Filecoin
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            disabled={!connector.name}
            className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{connector.name}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-800 rounded-lg border border-blue-600 text-sm">
        <div className="text-blue-200 font-semibold mb-1">
          📝 Setup Instructions:
        </div>
        <div className="text-blue-100 text-xs space-y-1">
          <div>1. Connect your wallet (MetaMask recommended)</div>
          <div>2. Switch to Filecoin Calibration testnet</div>
          <div>
            3. Get test FIL from{" "}
            <a
              href="https://faucet.calibration.fildev.network/"
              target="_blank"
              className="text-blue-300 underline"
            >
              faucet
            </a>
          </div>
          <div>4. Get USDFC tokens for storage payments</div>
        </div>
      </div>
    </div>
  );
};
