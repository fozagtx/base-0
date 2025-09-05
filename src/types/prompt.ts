export interface UserPrompt {
  id: string;
  userId: string; // wallet address
  prompt: string;
  enhancedPrompt: string;
  baseImageUrl?: string;
  timestamp: number;
  metadata: {
    width: number;
    height: number;
    version: string;
    preference: string;
  };
}

export interface GeneratedImage {
  id: string;
  userId: string;
  promptId: string;
  imageUrl: string;
  shareUrl?: string;
  deepaiId: string;
  timestamp: number;
  metadata: any;
}