import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, DEFAULT_NETWORK, switchToFilecoinNetwork } from '../contracts/config';

// Import the generated contract types
import { FilecoinCIDStore, FilecoinCIDStore__factory } from '../../../typechain-types';

export interface StoredContent {
  id: number;
  title: string;
  description: string;
  price: string;
  owner: string;
  isActive: boolean;
  createdAt: number;
  dealId: number;
  pieceSize: number;
  userHasAccess: boolean;
}

export interface UseFilecoinCIDStoreReturn {
  // State
  contract: FilecoinCIDStore | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  network: string;

  // Actions
  connectWallet: () => Promise<void>;
  storeContent: (params: {
    pieceCid: string;
    dataCid: string;
    price: string;
    title: string;
    description: string;
    pieceSize: number;
  }) => Promise<number>;
  purchaseAccess: (contentId: number) => Promise<void>;
  getCID: (contentId: number) => Promise<string>;
  getContentInfo: (contentId: number) => Promise<StoredContent>;
  getAllActiveContent: () => Promise<StoredContent[]>;
  getUserOwnedContent: () => Promise<StoredContent[]>;
  getUserPurchasedContent: () => Promise<StoredContent[]>;
  hasAccess: (contentId: number, userAddress?: string) => Promise<boolean>;
  checkDealActivation: (contentId: number) => Promise<boolean>;
}

export const useFilecoinCIDStore = (
  networkName: 'calibration' | 'filecoin' = DEFAULT_NETWORK as 'calibration' | 'filecoin'
): UseFilecoinCIDStoreReturn => {
  const [contract, setContract] = useState<FilecoinCIDStore | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const contractAddress = CONTRACT_ADDRESSES[networkName].FilecoinCIDStore;

  // Initialize contract when signer is available
  useEffect(() => {
    if (signer && contractAddress) {
      const contractInstance = FilecoinCIDStore__factory.connect(contractAddress, signer);
      setContract(contractInstance);
    }
  }, [signer, contractAddress]);

  const connectWallet = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
      }

      // Switch to Filecoin network
      await switchToFilecoinNetwork(networkName);

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);
      setIsConnected(true);

      console.log('Connected to Filecoin network:', networkName);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const storeContent = async (params: {
    pieceCid: string;
    dataCid: string;
    price: string;
    title: string;
    description: string;
    pieceSize: number;
  }): Promise<number> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setIsLoading(true);
      setError(null);

      // Convert piece CID to bytes
      const CID = await import('cids');
      const cid = new CID.default(params.pieceCid);
      const cidHex = '0x' + cid.toString('base16').substring(1);

      // Convert price to wei
      const priceInWei = ethers.parseEther(params.price);

      // Call contract method
      const tx = await contract.storeContent(
        cidHex,
        params.dataCid,
        priceInWei,
        params.title,
        params.description,
        params.pieceSize
      );

      const receipt = await tx.wait();

      // Extract content ID from event logs
      const log = receipt?.logs.find((log: any) =>
        log.fragment && log.fragment.name === 'ContentStored'
      );

      if (log) {
        return Number(log.args[0]);
      }

      throw new Error('Content ID not found in transaction receipt');
    } catch (err: any) {
      setError(err.message || 'Failed to store content');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseAccess = async (contentId: number): Promise<void> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setIsLoading(true);
      setError(null);

      // Get content info to get the price
      const contentInfo = await contract.getContentInfo(contentId);
      const price = contentInfo[2]; // price is the 3rd element

      // Purchase access
      const tx = await contract.purchaseAccess(contentId, { value: price });
      await tx.wait();

      console.log('Access purchased successfully for content ID:', contentId);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase access');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCID = async (contentId: number): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setError(null);
      const tx = await contract.getCID(contentId);
      return tx;
    } catch (err: any) {
      setError(err.message || 'Failed to get CID');
      throw err;
    }
  };

  const getContentInfo = async (contentId: number): Promise<StoredContent> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setError(null);
      const info = await contract.getContentInfo(contentId);

      return {
        id: contentId,
        title: info[0],
        description: info[1],
        price: ethers.formatEther(info[2]),
        owner: info[3],
        isActive: info[4],
        createdAt: Number(info[5]),
        dealId: Number(info[6]),
        pieceSize: Number(info[7]),
        userHasAccess: info[8],
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get content info');
      throw err;
    }
  };

  const getAllActiveContent = async (): Promise<StoredContent[]> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setError(null);
      const contentIds = await contract.getAllActiveContent();

      const contentPromises = contentIds.map(id => getContentInfo(Number(id)));
      return await Promise.all(contentPromises);
    } catch (err: any) {
      setError(err.message || 'Failed to get active content');
      throw err;
    }
  };

  const getUserOwnedContent = async (): Promise<StoredContent[]> => {
    if (!contract || !signer) throw new Error('Contract or signer not initialized');

    try {
      setError(null);
      const userAddress = await signer.getAddress();
      const contentIds = await contract.getUserOwnedContent(userAddress);

      const contentPromises = contentIds.map(id => getContentInfo(Number(id)));
      return await Promise.all(contentPromises);
    } catch (err: any) {
      setError(err.message || 'Failed to get owned content');
      throw err;
    }
  };

  const getUserPurchasedContent = async (): Promise<StoredContent[]> => {
    if (!contract || !signer) throw new Error('Contract or signer not initialized');

    try {
      setError(null);
      const userAddress = await signer.getAddress();
      const contentIds = await contract.getUserPurchasedContent(userAddress);

      const contentPromises = contentIds.map(id => getContentInfo(Number(id)));
      return await Promise.all(contentPromises);
    } catch (err: any) {
      setError(err.message || 'Failed to get purchased content');
      throw err;
    }
  };

  const hasAccess = async (contentId: number, userAddress?: string): Promise<boolean> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setError(null);
      const address = userAddress || (signer ? await signer.getAddress() : '');
      if (!address) throw new Error('No user address available');

      return await contract.hasAccess(contentId, address);
    } catch (err: any) {
      setError(err.message || 'Failed to check access');
      throw err;
    }
  };

  const checkDealActivation = async (contentId: number): Promise<boolean> => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setError(null);
      return await contract.checkDealActivation(contentId);
    } catch (err: any) {
      setError(err.message || 'Failed to check deal activation');
      throw err;
    }
  };

  return {
    // State
    contract,
    isConnected,
    isLoading,
    error,
    network: networkName,

    // Actions
    connectWallet,
    storeContent,
    purchaseAccess,
    getCID,
    getContentInfo,
    getAllActiveContent,
    getUserOwnedContent,
    getUserPurchasedContent,
    hasAccess,
    checkDealActivation,
  };
};
