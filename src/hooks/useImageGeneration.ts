import { useState, useCallback } from 'react';

interface GenerateImageOptions {
  width?: number;
  height?: number;
  image_generator_version?: "standard" | "hd" | "genius";
  genius_preference?: "anime" | "photography" | "graphic" | "cinematic";
  negative_prompt?: string;
  baseImageUrl?: string;
  productType?: string; // e.g., "skincare cream", "coffee mug", "headphones"
  scenario?: string; // e.g., "morning routine", "work from home", "gym workout"
  modelPreference?: "female" | "male" | "any";
  ageRange?: "teens" | "young-adult" | "adult" | "mature";
  setting?: "home" | "office" | "outdoor" | "cafe" | "gym" | "any";
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

// Dynamic prompt builder based on product and context
function buildUGCPrompt(
  userPrompt: string, 
  productType?: string, 
  scenario?: string,
  options: GenerateImageOptions = {}
): string {
  const {
    modelPreference = "any",
    ageRange = "young-adult",
    setting = "any"
  } = options;

  // Base UGC style foundation
  let prompt = "UGC lifestyle photography, authentic smartphone aesthetic, natural lighting, high resolution but candid feel. ";

  // Model specification based on preferences
  if (modelPreference === "female" || modelPreference === "any") {
    prompt += `${getAgeDescription(ageRange)} woman with genuine smile, approachable and trustworthy, wearing casual everyday clothing. `;
  } else {
    prompt += `${getAgeDescription(ageRange)} man with confident friendly expression, relatable and modern, wearing casual or streetwear. `;
  }

  // Product integration - this is the key improvement
  if (productType) {
    prompt += `Naturally ${getProductInteraction(productType, scenario)} ${productType}. `;
    prompt += `The ${productType} should be prominently visible and integrated into the scene as part of a genuine daily routine. `;
  }

  // Setting and environment
  prompt += `Setting: ${getSettingDescription(setting, scenario)}. `;

  // Camera and composition
  prompt += "Shot from eye level or slight handheld angle, close-up composition focusing on both the person and product, natural framing. ";

  // Mood and branding
  prompt += "Warm, friendly, aspirational mood. The person should appear as if genuinely recommending or enjoying the product, like sharing with a friend. ";

  // Add user's specific instructions
  prompt += `Specific request: ${userPrompt}`;

  return prompt;
}

function getAgeDescription(ageRange: string): string {
  switch (ageRange) {
    case "teens": return "18-19 year old";
    case "young-adult": return "20-28 year old";
    case "adult": return "25-35 year old";
    case "mature": return "30-45 year old";
    default: return "25-30 year old";
  }
}

function getProductInteraction(productType: string, scenario?: string): string {
  const productLower = productType.toLowerCase();
  
  // Smart interaction based on product type
  if (productLower.includes('skincare') || productLower.includes('cream') || productLower.includes('lotion')) {
    return scenario === "morning routine" ? "applying" : "holding and demonstrating";
  } else if (productLower.includes('coffee') || productLower.includes('mug') || productLower.includes('drink')) {
    return "holding and sipping from";
  } else if (productLower.includes('headphones') || productLower.includes('earbuds')) {
    return "wearing and enjoying";
  } else if (productLower.includes('book') || productLower.includes('notebook')) {
    return "reading or writing in";
  } else if (productLower.includes('phone') || productLower.includes('device') || productLower.includes('tech')) {
    return "using and interacting with";
  } else if (productLower.includes('clothing') || productLower.includes('shirt') || productLower.includes('jacket')) {
    return "wearing and showing off";
  } else if (productLower.includes('food') || productLower.includes('snack')) {
    return "eating and enjoying";
  } else if (productLower.includes('supplement') || productLower.includes('vitamin')) {
    return "taking and showing";
  } else {
    // Generic fallback
    return "using, holding, or demonstrating";
  }
}

function getSettingDescription(setting: string, scenario?: string): string {
  if (scenario) {
    // Scenario-driven settings
    switch (scenario) {
      case "morning routine": return "bright bathroom or bedroom with natural morning light";
      case "work from home": return "clean home office or living room workspace";
      case "gym workout": return "modern gym or home workout space";
      case "coffee break": return "cozy cafe or kitchen counter";
      case "evening relaxation": return "comfortable living room with warm lighting";
      default: break;
    }
  }

  // Setting-driven descriptions
  switch (setting) {
    case "home": return "comfortable modern home interior with natural lighting";
    case "office": return "clean contemporary office space or co-working area";
    case "outdoor": return "natural outdoor setting, park or urban environment";
    case "cafe": return "trendy coffee shop or casual restaurant";
    case "gym": return "modern fitness center or home gym";
    default: return "realistic everyday environment with good natural lighting";
  }
}

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
        baseImageUrl,
        productType,
        scenario,
      } = options;

      console.log("Request options", options);

      // Build dynamic UGC prompt based on product and context
      let enhancedPrompt = buildUGCPrompt(prompt, productType, scenario, options);
      
      if (baseImageUrl && productType) {
        // Add specific instructions for base image integration
        enhancedPrompt += ` The person should interact with the ${productType} in a way that feels natural and authentic, similar to how someone would demonstrate or recommend it in a social media post.`;
      }

      console.log('Enhanced dynamic prompt:', enhancedPrompt);

      // Use FormData for API call
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
          originalPrompt: prompt,
          productType,
          scenario,
          hasBaseImage: !!baseImageUrl,
          baseImageUrl,
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

  // Helper function for easier usage
  const generateProductUGC = useCallback(async (
    productType: string,
    userPrompt: string,
    options: Omit<GenerateImageOptions, 'productType'> = {}
  ) => {
    return generateImage(userPrompt, { ...options, productType });
  }, [generateImage]);

  return {
    generateImage,
    generateProductUGC,
    isGenerating,
    error,
  };
}