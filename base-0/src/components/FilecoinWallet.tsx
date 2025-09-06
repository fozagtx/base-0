import React, { useState, useEffect } from 'react';
import { useFilecoinCIDStore } from '../hooks/useFilecoinCIDStore';
import { isMetaMaskInstalled, getMetaMaskInstallUrl, formatFIL, truncateAddress } from '../utils/filecoin';

interface FilecoinWalletProps {
  network?: 'calibration' | 'filecoin';
  onConnect?: (connected: boolean) => void;
}

export const FilecoinWallet: React.FC<FilecoinWalletProps> = ({
  network = 'calibration',
  onConnect
}) => {
  const { isConnected, isLoading, error, connectWallet } = useFilecoinCIDStore(network);
  const [userAddress, setUserAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    onConnect?.(isConnected);
  }, [isConnected, onConnect]);

  useEffect(() => {
    const getAccountInfo = async () => {
      if (isConnected && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);

            // Get balance
            const balanceHex = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            const balanceWei = parseInt(balanceHex, 16);
            const balanceEth = balanceWei / Math.pow(10, 18);
            setBalance(balanceEth.toFixed(4));
          }
        } catch (err) {
          console.error('Error getting account info:', err);
        }
      }
    };

    getAccountInfo();
  }, [isConnected]);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled()) {
      const installUrl = getMetaMaskInstallUrl();
      window.open(installUrl, '_blank');
      return;
    }

    try {
      await connectWallet();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  if (!isMetaMaskInstalled()) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-orange-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800">
              MetaMask Required
            </h3>
            <p className="text-sm text-orange-700">
              You need MetaMask wallet to interact with Filecoin network
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Install MetaMask
          </button>
        </div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            </div>
            <div>
              <div className="text-sm font-medium text-green-800">
                Connected to {network === 'calibration' ? 'Filecoin Calibration' : 'Filecoin Mainnet'}
              </div>
              <div className="text-xs text-green-600">
                {truncateAddress(userAddress)} • {formatFIL(balance)}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Connected
            </span>
          </div>
        </div>

        {network === 'calibration' && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-700">
              Need test FIL?{' '}
              <a
                href="https://faucet.calibnet.chainsafe-fil.io"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:no-underline"
              >
                Get from faucet
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Connect Wallet
            </h3>
            <p className="text-sm text-blue-700">
              Connect to {network === 'calibration' ? 'Filecoin Calibration testnet' : 'Filecoin mainnet'}
            </p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      </div>

      {error && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {error}
          </p>
        </div>
      )}
    </div>
  );
};
