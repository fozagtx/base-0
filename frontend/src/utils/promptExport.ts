import { GenerationSession, PromptMetadata, GeneratedImage } from '../types/generation';

// Convert generation session to exportable JSON
export const convertSessionToJSON = (session: GenerationSession): PromptMetadata => {
  return {
    version: "1.0",
    generatedAt: new Date(session.createdAt).toISOString(),
    platform: "Base0",
    model: session.prompt.model,
    parameters: {
      prompt: session.prompt.prompt,
      negativePrompt: session.prompt.negativePrompt,
      steps: session.prompt.steps,
      guidance: session.prompt.guidance,
      seed: session.prompt.seed,
      aspectRatio: session.prompt.aspectRatio,
      quality: session.prompt.quality,
      style: session.prompt.style,
    },
    images: session.images.map(image => ({
      id: image.id,
      filename: `${session.id}_${image.id}.${image.format}`,
      width: image.width,
      height: image.height,
      format: image.format,
      size: image.size,
      url: image.url,
    })),
    filecoin: {
      uploaded: false,
    }
  };
};

// Download JSON file
export const downloadJSON = (data: PromptMetadata, filename?: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `base0_generation_${data.generatedAt.replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Create a ZIP-like bundle with JSON + images
export const createGenerationBundle = async (
  session: GenerationSession,
  includeImages: boolean = true
): Promise<{ json: PromptMetadata, images?: Blob[], bundleSize: number }> => {
  const jsonData = convertSessionToJSON(session);
  let totalSize = JSON.stringify(jsonData).length;

  if (!includeImages) {
    return { json: jsonData, bundleSize: totalSize };
  }

  const imageBlobs: Blob[] = [];

  for (const image of session.images) {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      imageBlobs.push(blob);
      totalSize += blob.size;
    } catch (error) {
      console.warn(`Failed to fetch image ${image.id}:`, error);
    }
  }

  return {
    json: jsonData,
    images: imageBlobs,
    bundleSize: totalSize
  };
};

// Generate filename for Filecoin storage
export const generateFilecoinFilename = (session: GenerationSession): string => {
  const timestamp = new Date(session.createdAt).toISOString().replace(/[:.]/g, '-');
  const promptSlug = session.prompt.prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);

  return `base0-generation-${timestamp}-${promptSlug}.json`;
};

// Validate JSON format for reimport
export const validatePromptJSON = (jsonString: string): { valid: boolean, data?: PromptMetadata, error?: string } => {
  try {
    const data = JSON.parse(jsonString) as PromptMetadata;

    // Basic validation
    if (!data.version || !data.parameters || !data.images) {
      return { valid: false, error: 'Invalid JSON structure' };
    }

    if (!data.parameters.prompt) {
      return { valid: false, error: 'Missing prompt in parameters' };
    }

    if (!Array.isArray(data.images) || data.images.length === 0) {
      return { valid: false, error: 'No images found in JSON' };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};

// Create shareable link (for social sharing, etc.)
export const createShareableLink = (session: GenerationSession): string => {
  const params = new URLSearchParams({
    prompt: session.prompt.prompt,
    model: session.prompt.model,
    ...(session.prompt.style && { style: session.prompt.style }),
    ...(session.prompt.aspectRatio && { aspect: session.prompt.aspectRatio }),
  });

  return `${window.location.origin}/generate?${params.toString()}`;
};

// Estimate storage costs for Filecoin
export const estimateStorageCost = (sizeInBytes: number, durationDays: number = 365): {
  estimatedCostFIL: number;
  costBreakdown: {
    storagePrice: number;
    clientCollateral: number;
    platformFee: number;
    total: number;
  }
} => {
  // Rough estimates - adjust based on actual Filecoin pricing
  const filPerByte = 0.0000000001; // Very rough estimate
  const storageCost = sizeInBytes * filPerByte * (durationDays / 365);
  const clientCollateral = storageCost * 0.1; // 10% collateral
  const platformFee = storageCost * 0.05; // 5% platform fee

  return {
    estimatedCostFIL: storageCost + clientCollateral + platformFee,
    costBreakdown: {
      storagePrice: storageCost,
      clientCollateral,
      platformFee,
      total: storageCost + clientCollateral + platformFee,
    }
  };
};

// Format generation data for display
export const formatGenerationInfo = (session: GenerationSession): string => {
  const prompt = session.prompt;
  let info = `🎨 **Generation Details**\n\n`;
  info += `**Prompt:** ${prompt.prompt}\n`;

  if (prompt.negativePrompt) {
    info += `**Negative Prompt:** ${prompt.negativePrompt}\n`;
  }

  info += `**Model:** ${prompt.model}\n`;
  info += `**Images Generated:** ${session.images.length}\n`;
  info += `**Created:** ${new Date(session.createdAt).toLocaleString()}\n`;

  if (prompt.steps) info += `**Steps:** ${prompt.steps}\n`;
  if (prompt.guidance) info += `**Guidance:** ${prompt.guidance}\n`;
  if (prompt.seed) info += `**Seed:** ${prompt.seed}\n`;
  if (prompt.aspectRatio) info += `**Aspect Ratio:** ${prompt.aspectRatio}\n`;
  if (prompt.quality) info += `**Quality:** ${prompt.quality}\n`;
  if (prompt.style) info += `**Style:** ${prompt.style}\n`;

  return info;
};
