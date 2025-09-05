import { NextRequest, NextResponse } from "next/server";

interface GenerateImageRequest {
  prompt: string;
  walletAddress?: string;
  width?: number;
  height?: number;
  image_generator_version?: "standard" | "hd" | "genius";
  genius_preference?: "anime" | "photography" | "graphic" | "cinematic";
  negative_prompt?: string;
}

interface DeepAIResponse {
  id: string;
  output_url: string;
  share_url?: string;
  backend_request_id?: string;
  nsfw_score?: number;
  metadata?: unknown;
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

export async function POST(request: NextRequest) {
  try {
    const body: GenerateImageRequest = await request.json();
    const {
      prompt,
      walletAddress,
      width = 512,
      height = 512,
      image_generator_version = "standard",
      genius_preference = "photography",
      negative_prompt,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const deepaiApiKey = process.env.DEEP_API_KEY;
    if (!deepaiApiKey) {
      console.error("DeepAI API key not found in environment variables");
      return NextResponse.json(
        { error: "DeepAI API key not configured" },
        { status: 500 },
      );
    }

    console.log(`Request received:`, {
      prompt: prompt.substring(0, 50) + "...",
      width,
      height,
      version: image_generator_version,
    });

    const endpoint = "https://api.deepai.org/api/text2img";
    
    // Combine system prompt with user prompt (like in the working HTML)
    const enhancedPrompt = UGC_SYSTEM_PROMPT + prompt;

    // Use FormData exactly like the working HTML file
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

    console.log(`Making request to DeepAI: ${endpoint}`);
    console.log(`Enhanced prompt: ${enhancedPrompt.substring(0, 100)}...`);

    // Use fetch like the working HTML file
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-key": deepaiApiKey,
      },
      body: formData,
    });

    console.log(`DeepAI response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("DeepAI API error:", errorData);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your DeepAI API configuration." },
          { status: 401 },
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        );
      }
      
      return NextResponse.json(
        {
          error: `DeepAI API error: ${response.status}`,
          details: errorData,
        },
        { status: response.status },
      );
    }

    const result: DeepAIResponse = await response.json();

    if (!result.output_url) {
      throw new Error("Invalid response: missing output_url");
    }

    console.log(`Image generated successfully: ${result.output_url}`);

    return NextResponse.json({
      success: true,
      imageUrl: result.output_url,
      shareUrl: result.share_url,
      id: result.id,
      backendRequestId: result.backend_request_id,
      nsfw_score: result.nsfw_score,
      metadata: {
        prompt: enhancedPrompt,
        walletAddress,
        generatedAt: new Date().toISOString(),
        width,
        height,
        version: image_generator_version,
        preference: genius_preference,
      },
    });

  } catch (error) {
    console.error("Generate image error:", error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: "Network error connecting to image generation service",
          details: error.message,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process image generation request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Image generation API endpoint",
      usage: "POST with { prompt: string, walletAddress?: string, width?: number, height?: number, image_generator_version?: 'standard' | 'hd' | 'genius', genius_preference?: 'anime' | 'photography' | 'graphic' | 'cinematic', negative_prompt?: string }",
      example: {
        prompt: "A beautiful cyberpunk city at night with neon lights",
        width: 512,
        height: 512,
        image_generator_version: "standard"
      }
    },
    { status: 200 },
  );
}