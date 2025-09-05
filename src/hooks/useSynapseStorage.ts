import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { SynapseImageStorage, type StoredImage } from '@/lib/synapse';
import { UserPrompt, GeneratedImage } from '@/types/prompt';

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

  // New functions for prompt and image management
  const savePrompt = useCallback(async (prompt: UserPrompt): Promise<boolean> => {
    if (!address) {
      console.error('No wallet connected');
      return false;
    }

    try {
      setIsStoring(true);
      
      // Store in localStorage for now, later can be enhanced with actual Synapse storage
      const storagePath = `prompts_${address}`;
      const existingPrompts = JSON.parse(localStorage.getItem(storagePath) || '[]');
      const promptWithTimestamp = {
        ...prompt,
        savedAt: Date.now(),
      };
      existingPrompts.push(promptWithTimestamp);
      localStorage.setItem(storagePath, JSON.stringify(existingPrompts));

      console.log('Prompt saved successfully:', prompt.id);
      return true;
    } catch (err) {
      console.error('Failed to save prompt:', err);
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address]);

  const saveGeneratedImage = useCallback(async (image: GeneratedImage): Promise<boolean> => {
    if (!address) {
      console.error('No wallet connected');
      return false;
    }

    try {
      setIsStoring(true);
      
      // Store in localStorage for now, later can be enhanced with actual Synapse storage
      const storagePath = `images_${address}`;
      const existingImages = JSON.parse(localStorage.getItem(storagePath) || '[]');
      const imageWithTimestamp = {
        ...image,
        savedAt: Date.now(),
      };
      existingImages.push(imageWithTimestamp);
      localStorage.setItem(storagePath, JSON.stringify(existingImages));

      console.log('Image saved successfully:', image.id);
      return true;
    } catch (err) {
      console.error('Failed to save image:', err);
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address]);

  const getUserPrompts = useCallback(async (userId?: string): Promise<UserPrompt[]> => {
    const targetUserId = userId || address;
    if (!targetUserId) {
      return [];
    }

    try {
      const storagePath = `prompts_${targetUserId}`;
      const storedPrompts = JSON.parse(localStorage.getItem(storagePath) || '[]');
      return storedPrompts.sort((a: UserPrompt, b: UserPrompt) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to fetch user prompts:', err);
      return [];
    }
  }, [address]);

  const getUserImages = useCallback(async (userId?: string): Promise<GeneratedImage[]> => {
    const targetUserId = userId || address;
    if (!targetUserId) {
      return [];
    }

    try {
      const storagePath = `images_${targetUserId}`;
      const storedImages = JSON.parse(localStorage.getItem(storagePath) || '[]');
      return storedImages.sort((a: GeneratedImage, b: GeneratedImage) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to fetch user images:', err);
      return [];
    }
  }, [address]);

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
    // New functions
    savePrompt,
    saveGeneratedImage,
    getUserPrompts,
    getUserImages,
  };
}
