import { useState, useCallback } from "react";
import { UserPrompt, GeneratedImage } from "@/types/prompt";
import { useEthersSigner } from "@/hooks/useEthers";
import { useAccount } from "wagmi";
import { Synapse } from "@filoz/synapse-sdk";
import { config } from "@/config";

export const useSynapseStorage = () => {
  const [isStoring, setIsStoring] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [storedPromptCids, setStoredPromptCids] = useState<string[]>([]);

  const signer = useEthersSigner();
  const { address } = useAccount();

  // Load stored CIDs for the current wallet
  const loadWalletCids = useCallback(() => {
    if (!address) {
      console.log("❌ No address for loading CIDs");
      return [];
    }
    try {
      const key = `base0_cids_${address}`;
      const stored = localStorage.getItem(key);
      console.log(
        "📂 Loading from localStorage key:",
        key,
        "Raw data:",
        stored
      );
      const result = stored ? JSON.parse(stored) : [];
      console.log("📋 Parsed CIDs:", result);
      return result;
    } catch (error) {
      console.error("Error loading wallet CIDs:", error);
      return [];
    }
  }, [address]);

  // Save CIDs for the current wallet
  const saveWalletCids = useCallback(
    (cids: string[]) => {
      if (!address) {
        console.log("❌ No address for saving CIDs");
        return;
      }
      try {
        const key = `base0_cids_${address}`;
        console.log("💾 Saving to localStorage key:", key, "CIDs:", cids);
        localStorage.setItem(key, JSON.stringify(cids));
      } catch (error) {
        console.error("Error saving wallet CIDs:", error);
      }
    },
    [address]
  );

  const initializeStorage = useCallback(async () => {
    setIsInitializing(true);
    try {
      console.log("Storage initialized for prompt storage on Filecoin");
      // Load existing CIDs for the current wallet
      const walletCids = loadWalletCids();
      setStoredPromptCids(walletCids);
    } finally {
      setIsInitializing(false);
    }
  }, [loadWalletCids]);

  const storePromptOnFilecoin = useCallback(
    async (promptData: UserPrompt) => {
      setIsStoring(true);
      try {
        console.log(
          "🔍 Storage check - Signer:",
          !!signer,
          "Address:",
          address
        );
        console.log("🔍 Signer object details:", signer);

        if (!address) {
          throw new Error(
            "Wallet address not found. Please connect your wallet."
          );
        }

        if (!signer) {
          console.log(
            "⚠️ Signer not available, but address exists. Implementing retry logic..."
          );

          // Retry mechanism for signer timing issues
          let retryCount = 0;
          const maxRetries = 3;

          while (!signer && retryCount < maxRetries) {
            console.log(
              `🔄 Retry ${retryCount + 1}/${maxRetries}: Waiting for signer...`
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // The signer from the hook won't update, but we can give it time
            retryCount++;
          }

          if (!signer) {
            console.error("❌ Signer still not available after retries");
            throw new Error(
              "🔄 Signer timing issue detected.\n\n" +
                "Please try:\n" +
                "1. Wait 5 seconds and try again\n" +
                "2. Refresh page (Ctrl+F5)\n" +
                "3. Disconnect & reconnect wallet\n" +
                "4. Switch networks in MetaMask"
            );
          }
        }

        console.log("📦 Starting Filecoin storage for prompt:", promptData);

        // Convert prompt data to JSON string
        const promptJson = JSON.stringify(promptData, null, 2);
        const promptBytes = new TextEncoder().encode(promptJson);

        // Create Synapse instance
        const synapse = await Synapse.create({
          signer,
          disableNonceManager: false,
          withCDN: config.withCDN,
        });

        // Preflight check for storage
        await synapse.storage.preflightUpload(promptBytes.length, {
          withCDN: config.withCDN,
        });

        // Upload prompt data to Filecoin
        const uploadResult = await synapse.storage.upload(promptBytes, {
          callbacks: {
            onUploadComplete: (pieceCid) => {
              console.log(
                "Prompt stored successfully with CID:",
                pieceCid.toString()
              );
            },
          },
        });

        const cid = uploadResult.pieceCid.toString();

        // Store CID mapped to wallet address
        const currentCids = loadWalletCids();
        const updatedCids = [...currentCids, cid];
        console.log("💾 Saving CID to localStorage:", cid);
        console.log("📝 Updated CIDs list:", updatedCids);
        saveWalletCids(updatedCids);

        // Update local state
        setStoredPromptCids(updatedCids);

        return {
          success: true,
          cid,
          downloadUrl: `https://api.synapse.storage/piece/${cid}`,
          promptData,
        };
      } catch (error) {
        console.error("Error storing prompt on Filecoin:", error);
        throw error;
      } finally {
        setIsStoring(false);
      }
    },
    [signer, address]
  );

  const retrievePromptFromFilecoin = useCallback(
    async (cid: string) => {
      try {
        if (!signer)
          throw new Error("Signer not found. Please connect your wallet.");

        console.log("Retrieving prompt from Filecoin with CID:", cid);

        // Create Synapse instance
        const synapse = await Synapse.create({
          signer,
          withCDN: config.withCDN,
        });

        // Download prompt data
        const data = await synapse.download(cid, {
          withCDN: config.withCDN,
        });

        // Convert bytes back to JSON
        const promptJson = new TextDecoder().decode(new Uint8Array(data));
        const promptData: UserPrompt = JSON.parse(promptJson);

        return promptData;
      } catch (error) {
        console.error("Error retrieving prompt from Filecoin:", error);
        throw error;
      }
    },
    [signer]
  );

  const getWalletCids = useCallback(() => {
    return loadWalletCids();
  }, [loadWalletCids]);

  const storeImageWithOnchainRecord = useCallback(
    async (imageUrl: string, prompt: string) => {
      setIsStoring(true);
      try {
        console.log("Storing image and prompt:", { imageUrl, prompt });
        // TODO: Store image to Filecoin and save prompt
        return { success: true, cid: "mock-cid" };
      } finally {
        setIsStoring(false);
      }
    },
    []
  );

  const savePrompt = useCallback(
    async (prompt: UserPrompt) => {
      try {
        console.log("Saving prompt to localStorage:", prompt);

        if (!address) {
          throw new Error("Wallet address not found");
        }

        // Get existing prompts for this wallet
        const key = `base0_prompts_${address}`;
        const existingPrompts = localStorage.getItem(key);
        const prompts: UserPrompt[] = existingPrompts
          ? JSON.parse(existingPrompts)
          : [];

        // Add or update the prompt
        const existingIndex = prompts.findIndex((p) => p.id === prompt.id);
        if (existingIndex >= 0) {
          prompts[existingIndex] = prompt;
        } else {
          prompts.push(prompt);
        }

        // Save back to localStorage
        localStorage.setItem(key, JSON.stringify(prompts));
        console.log("✅ Prompt saved to localStorage successfully");

        return prompt;
      } catch (error) {
        console.error("Error saving prompt:", error);
        throw error;
      }
    },
    [address]
  );

  const saveGeneratedImage = useCallback(
    async (image: GeneratedImage) => {
      try {
        console.log("Saving generated image to localStorage:", image);

        if (!address) {
          throw new Error("Wallet address not found");
        }

        // Get existing images for this wallet
        const key = `base0_images_${address}`;
        const existingImages = localStorage.getItem(key);
        const images: GeneratedImage[] = existingImages
          ? JSON.parse(existingImages)
          : [];

        // Add or update the image
        const existingIndex = images.findIndex((img) => img.id === image.id);
        if (existingIndex >= 0) {
          images[existingIndex] = image;
        } else {
          images.push(image);
        }

        // Save back to localStorage
        localStorage.setItem(key, JSON.stringify(images));
        console.log("✅ Image saved to localStorage successfully");

        return image;
      } catch (error) {
        console.error("Error saving generated image:", error);
        throw error;
      }
    },
    [address]
  );

  const getUserPrompts = useCallback(async (): Promise<UserPrompt[]> => {
    try {
      console.log("Getting user prompts from localStorage");

      if (!address) {
        console.log("No wallet address, returning empty array");
        return [];
      }

      const key = `base0_prompts_${address}`;
      const stored = localStorage.getItem(key);
      const prompts: UserPrompt[] = stored ? JSON.parse(stored) : [];

      console.log(
        `Found ${prompts.length} stored prompts for wallet ${address}`
      );
      return prompts;
    } catch (error) {
      console.error("Error getting user prompts:", error);
      return [];
    }
  }, [address]);

  const getUserImages = useCallback(async (): Promise<GeneratedImage[]> => {
    try {
      console.log("Getting user images from localStorage");

      if (!address) {
        console.log("No wallet address, returning empty array");
        return [];
      }

      const key = `base0_images_${address}`;
      const stored = localStorage.getItem(key);
      const images: GeneratedImage[] = stored ? JSON.parse(stored) : [];

      console.log(`Found ${images.length} stored images for wallet ${address}`);
      return images;
    } catch (error) {
      console.error("Error getting user images:", error);
      return [];
    }
  }, [address]);

  return {
    isStoring,
    isInitializing,
    initializeStorage,
    storePromptOnFilecoin,
    retrievePromptFromFilecoin,
    getWalletCids,
    storedPromptCids,
    storeImageWithOnchainRecord,
    savePrompt,
    saveGeneratedImage,
    getUserPrompts,
    getUserImages,
  };
};
