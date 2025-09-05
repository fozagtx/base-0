import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { SynapseImageStorage, type StoredImage } from '@/lib/synapse';

export function useSynapseStorage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [storage] = useState(() => new SynapseImageStorage());
  const { address, isConnected } = useAccount();

  const initializeStorage = useCallback(async () => {
    if (!isConnected || !window.ethereum) {
      throw new Error('Wallet not connected');
    }

    setIsInitializing(true);
    try {
      if (!storage.isInitialized()) {
        await storage.initialize(); // Uses browser wallet
      }
    } finally {
      setIsInitializing(false);
    }
  }, [storage, isConnected]);

  const storeImage = useCallback(async (
    imageData: string,
    metadata?: {
      prompt?: string;
      nodeId?: string;
    }
  ): Promise<StoredImage> => {
    if (!storage.isInitialized()) {
      await initializeStorage();
    }

    setIsStoring(true);
    try {
      const storedImage = await storage.storeImage(imageData, {
        ...metadata,
        walletAddress: address,
      });
      return storedImage;
    } finally {
      setIsStoring(false);
    }
  }, [storage, initializeStorage, address]);

  const retrieveImage = useCallback(async (pieceCid: string): Promise<Uint8Array> => {
    if (!storage.isInitialized()) {
      await initializeStorage();
    }

    return await storage.retrieveImage(pieceCid);
  }, [storage, initializeStorage]);

  const getStorageStatus = useCallback(async (pieceCid: string) => {
    if (!storage.isInitialized()) {
      await initializeStorage();
    }

    return await storage.getStorageStatus(pieceCid);
  }, [storage, initializeStorage]);

  return {
    storage,
    isInitializing,
    isStoring,
    isInitialized: storage.isInitialized(),
    initializeStorage,
    storeImage,
    retrieveImage,
    getStorageStatus,
    isConnected,
    address,
  };
}
