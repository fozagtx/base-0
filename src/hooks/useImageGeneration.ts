import { useState, useCallback } from 'react';

interface GenerateImageOptions {
  width?: number;
  height?: number;
  image_generator_version?: "standard" | "hd" | "genius";
  genius_preference?: "anime" | "photography" | "graphic" | "cinematic";
  negative_prompt?: string;
}

interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  shareUrl?: string;
  id: string;
  backendRequestId?: string;
  nsfw_score?: number;
  metadata?: any;
}

const UGC_SYSTEM_PROMPT = `Create a UGC lifestyle photography image with the following specifications:

STYLE: UGC lifestyle photography, casual and authentic, smartphone-shot aesthetic, natural lighting

MODELS:
- Female (20-35): genuine smile, approachable, trustworthy, casual everyday wear
- Male (20-35): confident, friendly, relatable, modern casual or streetwear

PRODUCT FOCUS: Natural usage, product held, applied, or integrated in a lifestyle setting. Product should look like part of daily routine, not forced.

BACKGROUND: Realistic everyday settings such as living room, coffee shop, work desk, or outdoors

CAMERA: Eye level or handheld POV, close-up on model and product, natural framing, high resolution but natural, not overly polished

BRANDING: Relatable, positive, authentic tone. Warm, friendly, aspirational mood. Model appears as if recommending product to a friend.

USER REQUEST: `;

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (
    prompt: string,
    options: GenerateImageOptions = {}
  ): Promise<GenerateImageResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const deepaiApiKey = process.env.NEXT_PUBLIC_DEEP_API_KEY;
      if (!deepaiApiKey) {
        throw new Error('DeepAI API key not configured');
      }

      const {
        width = 512,
        height = 512,
        image_generator_version = "standard",
        genius_preference = "photography",
        negative_prompt,
      } = options;

      // Combine system prompt with user prompt
      const enhancedPrompt = UGC_SYSTEM_PROMPT + prompt;

      // Use FormData like the working HTML file
      const formData = new FormData();
      formData.append("text", enhancedPrompt);
      formData.append("width", width.toString());
      formData.append("height", height.toString());
      formData.append("image_generator_version", image_generator_version);

      if (genius_preference && image_generator_version === "genius") {
        formData.append("genius_preference", genius_preference);
      }

      if (negative_prompt) {
        formData.append("negative_prompt", negative_prompt);
      }

      console.log('Making direct API call to DeepAI...');

      const response = await fetch('https://api.deepai.org/api/text2img', {
        method: 'POST',
        headers: {
          'api-key': deepaiApiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('DeepAI API error:', errorData);
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your DeepAI API configuration.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`DeepAI API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (!result.output_url) {
        throw new Error('Invalid response: missing output_url');
      }

      console.log('Image generated successfully:', result.output_url);

      return {
        success: true,
        imageUrl: result.output_url,
        shareUrl: result.share_url,
        id: result.id,
        backendRequestId: result.backend_request_id,
        nsfw_score: result.nsfw_score,
        metadata: {
          prompt: enhancedPrompt,
          generatedAt: new Date().toISOString(),
          width,
          height,
          version: image_generator_version,
          preference: genius_preference,
        },
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Image generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generateImage,
    isGenerating,
    error,
  };
}