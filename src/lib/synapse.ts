import { Synapse, RPC_URLS } from "@filoz/synapse-sdk";
import { ethers } from "ethers";

export interface StoredImage {
  pieceCid: string;
  url: string;
  timestamp: number;
  metadata?: {
    prompt?: string;
    nodeId?: string;
    walletAddress?: string;
  };
}

export class SynapseImageStorage {
  private synapse: Synapse | null = null;
  private initialized = false;

  async initialize(privateKeyOrProvider?: string | any) {
    try {
      if (
        typeof window !== "undefined" &&
        window.ethereum &&
        !privateKeyOrProvider
      ) {
        // Browser environment with MetaMask
        const provider = new ethers.BrowserProvider(window.ethereum);
        this.synapse = await Synapse.create({
          provider,
          rpcURL: RPC_URLS.calibration.websocket, // Use testnet for development
        });
      } else if (
        privateKeyOrProvider &&
        typeof privateKeyOrProvider === "string"
      ) {
        // Server environment with private key
        this.synapse = await Synapse.create({
          privateKey: privateKeyOrProvider,
          rpcURL: RPC_URLS.calibration.websocket,
        });
      } else {
        throw new Error("No valid wallet provider or private key provided");
      }

      this.initialized = true;
      console.log("Synapse SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Synapse SDK:", error);
      throw error;
    }
  }

  async storeImage(
    imageData: string | Buffer | Uint8Array,
    metadata?: {
      prompt?: string;
      nodeId?: string;
      walletAddress?: string;
    },
  ): Promise<StoredImage> {
    if (!this.initialized || !this.synapse) {
      throw new Error("Synapse SDK not initialized. Call initialize() first.");
    }

    try {
      // Convert base64 data URL to buffer if needed
      let dataToStore: Uint8Array;

      if (typeof imageData === "string") {
        if (imageData.startsWith("data:image/")) {
          // Handle data URL
          const base64Data = imageData.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          dataToStore = new Uint8Array(buffer);
        } else {
          // Handle regular string
          dataToStore = new TextEncoder().encode(imageData);
        }
      } else if (Buffer.isBuffer(imageData)) {
        dataToStore = new Uint8Array(imageData);
      } else {
        dataToStore = imageData;
      }

      // Store the image data
      const uploadResult = await this.synapse.storage.upload(dataToStore);

      // Create stored image record
      const storedImage: StoredImage = {
        pieceCid: uploadResult.pieceCid.toString(),
        url: `https://calibration.filfox.info/en/storage/${uploadResult.pieceCid}`, // Testnet explorer URL
        timestamp: Date.now(),
        metadata,
      };

      console.log("Image stored successfully:", storedImage);
      return storedImage;
    } catch (error) {
      console.error("Failed to store image:", error);
      throw error;
    }
  }

  async retrieveImage(pieceCid: string): Promise<Uint8Array> {
    if (!this.initialized || !this.synapse) {
      throw new Error("Synapse SDK not initialized. Call initialize() first.");
    }

    try {
      const data = await this.synapse.storage.download(pieceCid);
      return data;
    } catch (error) {
      console.error("Failed to retrieve image:", error);
      throw error;
    }
  }

  async getStorageStatus(pieceCid: string) {
    if (!this.initialized || !this.synapse) {
      throw new Error("Synapse SDK not initialized. Call initialize() first.");
    }

    try {
      // You can implement status checking logic here
      // This might involve querying the Filecoin network for storage proofs
      return {
        pieceCid,
        status: "stored", // This would be dynamic based on actual network status
        retrievalUrl: `https://calibration.filfox.info/en/storage/${pieceCid}`,
      };
    } catch (error) {
      console.error("Failed to get storage status:", error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const synapseStorage = new SynapseImageStorage();
