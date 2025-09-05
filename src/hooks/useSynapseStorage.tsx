
import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { GeneratedImage, UserPrompt } from "../types/prompt";

// Synapse SDK types
interface SynapseStorageOptions {
  path: string;
  data: any;
  metadata?: any;
}

interface SynapseQueryOptions {
  path: string;
  filter?: any;
  limit?: number;
  offset?: number;
}

export function useSynapseStorage() {
  const { address } = useAccount();
  const [isStoring, setIsStoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Synapse connection
  const initializeSynapse = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize Synapse SDK here
      // This would typically involve setting up the connection
      console.log('Initializing Synapse storage...');
      
      // For now, we'll use localStorage as a fallback
      // In production, this would be replaced with actual Synapse SDK calls
      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('Failed to initialize Synapse:', err);
      setError('Failed to initialize storage');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save user prompt to Filecoin via Synapse
  const savePrompt = useCallback(async (prompt: UserPrompt): Promise<boolean> => {
    if (!address) {
      setError('No wallet connected');
      return false;
    }

    try {
      setIsStoring(true);
      setError(null);

      // Construct storage path for user prompts
      const storagePath = `prompts/${address}/${prompt.id}`;
      
      // Prepare data for storage
      const storageData = {
        ...prompt,
        savedAt: Date.now(),
      };

      console.log('Saving prompt to Synapse:', storagePath);
      
      // TODO: Replace with actual Synapse SDK call
      // await synapseClient.store({
      //   path: storagePath,
      //   data: storageData,
      //   metadata: { type: 'user_prompt', version: '1.0' }
      // });

      // Temporary fallback to localStorage
      const existingPrompts = JSON.parse(localStorage.getItem(`prompts_${address}`) || '[]');
      existingPrompts.push(storageData);
      localStorage.setItem(`prompts_${address}`, JSON.stringify(existingPrompts));

      console.log('Prompt saved successfully');
      return true;
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address]);

  // Save generated image metadata to Filecoin via Synapse
  const saveGeneratedImage = useCallback(async (image: GeneratedImage): Promise<boolean> => {
    if (!address) {
      setError('No wallet connected');
      return false;
    }

    try {
      setIsStoring(true);
      setError(null);

      // Construct storage path for generated images
      const storagePath = `images/${address}/${image.id}`;
      
      // Prepare data for storage
      const storageData = {
        ...image,
        savedAt: Date.now(),
      };

      console.log('Saving image metadata to Synapse:', storagePath);
      
      // TODO: Replace with actual Synapse SDK call
      // await synapseClient.store({
      //   path: storagePath,
      //   data: storageData,
      //   metadata: { type: 'generated_image', version: '1.0' }
      // });

      // Temporary fallback to localStorage
      const existingImages = JSON.parse(localStorage.getItem(`images_${address}`) || '[]');
      existingImages.push(storageData);
      localStorage.setItem(`images_${address}`, JSON.stringify(existingImages));

      console.log('Image metadata saved successfully');
      return true;
    } catch (err) {
      console.error('Failed to save image metadata:', err);
      setError(err instanceof Error ? err.message : 'Failed to save image metadata');
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address]);

  // Get user prompts from Filecoin via Synapse
  const getUserPrompts = useCallback(async (userId?: string): Promise<UserPrompt[]> => {
    const targetUserId = userId || address;
    if (!targetUserId) {
      setError('No user ID provided');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching prompts for user:', targetUserId);
      
      // TODO: Replace with actual Synapse SDK call
      // const result = await synapseClient.query({
      //   path: `prompts/${targetUserId}`,
      //   filter: { userId: targetUserId },
      //   limit: 100
      // });

      // Temporary fallback to localStorage
      const storedPrompts = JSON.parse(localStorage.getItem(`prompts_${targetUserId}`) || '[]');
      
      // Sort by timestamp (newest first)
      return storedPrompts.sort((a: UserPrompt, b: UserPrompt) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to fetch user prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Get user images from Filecoin via Synapse
  const getUserImages = useCallback(async (userId?: string): Promise<GeneratedImage[]> => {
    const targetUserId = userId || address;
    if (!targetUserId) {
      setError('No user ID provided');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching images for user:', targetUserId);
      
      // TODO: Replace with actual Synapse SDK call
      // const result = await synapseClient.query({
      //   path: `images/${targetUserId}`,
      //   filter: { userId: targetUserId },
      //   limit: 100
      // });

      // Temporary fallback to localStorage
      const storedImages = JSON.parse(localStorage.getItem(`images_${targetUserId}`) || '[]');
      
      // Sort by timestamp (newest first)
      return storedImages.sort((a: GeneratedImage, b: GeneratedImage) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to fetch user images:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Get prompt by ID
  const getPromptById = useCallback(async (promptId: string): Promise<UserPrompt | null> => {
    if (!address) return null;

    try {
      const prompts = await getUserPrompts();
      return prompts.find(prompt => prompt.id === promptId) || null;
    } catch (err) {
      console.error('Failed to fetch prompt by ID:', err);
      return null;
    }
  }, [address, getUserPrompts]);

  // Get images by prompt ID
  const getImagesByPromptId = useCallback(async (promptId: string): Promise<GeneratedImage[]> => {
    if (!address) return [];

    try {
      const images = await getUserImages();
      return images.filter(image => image.promptId === promptId);
    } catch (err) {
      console.error('Failed to fetch images by prompt ID:', err);
      return [];
    }
  }, [address, getUserImages]);

  // Delete prompt
  const deletePrompt = useCallback(async (promptId: string): Promise<boolean> => {
    if (!address) return false;

    try {
      setIsStoring(true);
      
      // TODO: Replace with actual Synapse SDK call
      // await synapseClient.delete(`prompts/${address}/${promptId}`);

      // Temporary fallback to localStorage
      const existingPrompts = JSON.parse(localStorage.getItem(`prompts_${address}`) || '[]');
      const filteredPrompts = existingPrompts.filter((prompt: UserPrompt) => prompt.id !== promptId);
      localStorage.setItem(`prompts_${address}`, JSON.stringify(filteredPrompts));

      return true;
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address]);

  // Delete image
  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    if (!address) return false;

    try {
      setIsStoring(true);
      
      // TODO: Replace with actual Synapse SDK call
      // await synapseClient.delete(`images/${address}/${imageId}`);

      // Temporary fallback to localStorage
      const existingImages = JSON.parse(localStorage.getItem(`images_${address}`) || '[]');
      const filteredImages = existingImages.filter((image: GeneratedImage) => image.id !== imageId);
      localStorage.setItem(`images_${address}`, JSON.stringify(filteredImages));

      return true;
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      return false;
    } finally {
      setIsStoring(false);
    }
  }, [address]);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    if (!address) return { promptCount: 0, imageCount: 0, totalSize: 0 };

    try {
      const prompts = await getUserPrompts();
      const images = await getUserImages();
      
      return {
        promptCount: prompts.length,
        imageCount: images.length,
        totalSize: (JSON.stringify(prompts).length + JSON.stringify(images).length) / 1024, // KB
      };
    } catch (err) {
      console.error('Failed to get storage stats:', err);
      return { promptCount: 0, imageCount: 0, totalSize: 0 };
    }
  }, [address, getUserPrompts, getUserImages]);

  return {
    // State
    isStoring,
    isLoading,
    error,
    isInitialized,
    
    // Methods
    initializeSynapse,
    savePrompt,
    saveGeneratedImage,
    getUserPrompts,
    getUserImages,
    getPromptById,
    getImagesByPromptId,
    deletePrompt,
    deleteImage,
    getStorageStats,
    
    // Legacy methods (for backward compatibility)
    storeImage: saveGeneratedImage,
  };
}