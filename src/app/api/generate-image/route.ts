import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface GenerateImageRequest {
  prompt: string;
  baseObject?: string;
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
      baseObject,
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
      return NextResponse.json(
        { error: "DeepAI API key not configured" },
        { status: 500 },
      );
    }

    console.log(`Request received:`, {
      prompt: prompt.substring(0, 50) + "...",
      hasBaseImage: !!baseObject,
      width,
      height,
      version: image_generator_version,
    });

    // For image-to-image, we'll use text2img with image input
    // If no base image, it's pure text-to-image
    const endpoint = "https://api.deepai.org/api/text2img";

    // Combine system prompt with user prompt
    const enhancedPrompt = UGC_SYSTEM_PROMPT + prompt;

    const formData = new FormData();
    formData.append("text", enhancedPrompt);

    // Add optional parameters
    if (width && height) {
      formData.append("width", width.toString());
      formData.append("height", height.toString());
    }

    if (image_generator_version) {
      formData.append("image_generator_version", image_generator_version);
    }

    if (genius_preference && image_generator_version === "genius") {
      formData.append("genius_preference", genius_preference);
    }

    if (negative_prompt) {
      formData.append("negative_prompt", negative_prompt);
    }

    // If baseObject (image) is provided, add it to the request
    if (baseObject) {
      try {
        if (baseObject.startsWith("data:image/")) {
          // Handle base64 image data
          const [, base64Data] = baseObject.split(",");
          const buffer = Buffer.from(base64Data, "base64");

          // Create a proper blob for the form data
          const blob = new Blob([buffer], { type: "image/png" });

          // Append as 'image' parameter for DeepAI
          formData.append("image", blob, "base_image.png");

          console.log(`Added base image: ${buffer.length} bytes`);
        } else if (baseObject.startsWith("http")) {
          // If it's a URL, DeepAI can accept it directly
          formData.append("image", baseObject);
          console.log(`Added base image URL: ${baseObject}`);
        }
      } catch (imageError) {
        console.error("Error processing base image:", imageError);
        return NextResponse.json(
          { error: "Invalid base image data" },
          { status: 400 },
        );
      }
    }

    console.log(`Making request to DeepAI: ${endpoint}`);

    // Make request to DeepAI API with retry logic and timeout using axios
    const maxRetries = 3;
    const timeoutMs = 60000; // 60 seconds
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}/${maxRetries} to DeepAI API`);

      try {
        const response = await axios({
          method: "POST",
          url: endpoint,
          headers: {
            "api-key": deepaiApiKey,
          },
          data: formData,
          timeout: timeoutMs,
          validateStatus: () => true, // Don't throw on non-2xx status codes
        });

        console.log(`DeepAI response status: ${response.status}`);
        console.log(
          `DeepAI response: ${JSON.stringify(response.data).substring(0, 200)}...`,
        );

        if (response.status !== 200) {
          console.error("DeepAI API error:", response.data);
          return NextResponse.json(
            {
              error: `DeepAI API error: ${response.status} - ${JSON.stringify(response.data)}`,
            },
            { status: response.status },
          );
        }

        const result: DeepAIResponse = response.data;

        // Return the generated image URL
        return NextResponse.json({
          success: true,
          imageUrl: result.output_url,
          id: result.id,
          nsfw_score: result.nsfw_score,
          metadata: {
            prompt,
            walletAddress,
            generatedAt: new Date().toISOString(),
            width,
            height,
            version: image_generator_version,
            preference: genius_preference,
            hasBaseImage: !!baseObject,
          },
        });
      } catch (axiosError: unknown) {
        lastError = axiosError;

        if (axios.isAxiosError(axiosError)) {
          if (axiosError.code === "ECONNABORTED") {
            console.error(`Attempt ${attempt}: DeepAI API request timed out`);
          } else if (
            axiosError.code === "ETIMEDOUT" ||
            axiosError.code === "ENOTFOUND"
          ) {
            console.error(
              `Attempt ${attempt}: Network error calling DeepAI API:`,
              axiosError.message,
            );
          } else {
            console.error(
              `Attempt ${attempt}: Axios error:`,
              axiosError.message,
            );
          }
        } else {
          console.error(`Attempt ${attempt}: Unknown error:`, axiosError);
        }

        // If this was the last attempt, break out of the loop
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Cap at 5 seconds
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // If we get here, all retries failed
    if (axios.isAxiosError(lastError) && lastError.code === "ECONNABORTED") {
      console.error("All attempts timed out");
      return NextResponse.json(
        {
          error:
            "Image generation request timed out after multiple attempts. Please try again later.",
        },
        { status: 408 },
      );
    }

    console.error("All attempts failed with network error:", lastError);
    return NextResponse.json(
      {
        error:
          "Network error connecting to image generation service after multiple attempts. Please check your internet connection and try again.",
      },
      { status: 503 },
    );
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
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
      usage:
        "POST with { prompt: string, baseObject?: string, walletAddress?: string }",
    },
    { status: 200 },
  );
}
