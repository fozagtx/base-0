// Types for image generation and prompt handling
export interface GenerationPrompt {
  id: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  style?: string;
  aspectRatio?: string;
  quality?: string;
  steps?: number;
  guidance?: number;
  seed?: number;
  timestamp: number;
  userId?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  format: string;
  size: number; // bytes
  generationTime: number; // ms
}

export interface GenerationSession {
  id: string;
  prompt: GenerationPrompt;
  images: GeneratedImage[];
  status: 'generating' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface PromptMetadata {
  version: string;
  generatedAt: string;
  platform: string;
  model: string;
  parameters: {
    prompt: string;
    negativePrompt?: string;
    steps?: number;
    guidance?: number;
    seed?: number;
    aspectRatio?: string;
    quality?: string;
    style?: string;
  };
  images: {
    id: string;
    filename: string;
    width: number;
    height: number;
    format: string;
    size: number;
    url?: string; // Optional IPFS/Filecoin URL after upload
    cid?: string; // Filecoin CID after storage
  }[];
  filecoin?: {
    dataCid?: string;
    pieceCid?: string;
    dealId?: number;
    storagePrice?: string;
    uploaded: boolean;
    uploadedAt?: string;
  };
}

export interface FilecoinUploadProgress {
  stage: 'preparing' | 'uploading' | 'generating_piece_cid' | 'storing_contract' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}
