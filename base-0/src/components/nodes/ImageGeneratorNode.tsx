"use client";

import { Handle, Position } from "reactflow";
import { useState, useCallback } from "react";

interface ImageGeneratorNodeProps {
  id: string;
  data: {
    prompt?: string;
    width?: number;
    height?: number;
    isGenerating?: boolean;
    baseImageUrl?: string; // Add base image URL
    isSelected?: boolean; // Add selection state
    onGenerate?: (
      nodeId: string,
      prompt: string,
      options?: {
        width?: number;
        height?: number;
        baseImageUrl?: string; // Add base image URL to options
      }
    ) => void;
    onRemoveBaseImage?: (nodeId: string) => void;
  };
}

export function ImageGeneratorNode({ id, data }: ImageGeneratorNodeProps) {
  const [prompt, setPrompt] = useState(
    data.prompt || "A beautiful landscape with mountains and a lake"
  );
  const [width, setWidth] = useState(data.width || 512);
  const [height, setHeight] = useState(data.height || 512);

  const handleGenerate = useCallback(() => {
    if (data.onGenerate && prompt.trim()) {
      const options = {
        width,
        height,
        baseImageUrl: data.baseImageUrl, // Pass base image URL
      };
      data.onGenerate(id, prompt, options);
    }
  }, [data.onGenerate, data.baseImageUrl, id, prompt, width, height]);

  return (
    <div
      className={`bg-black/60 rounded-lg shadow-lg min-w-[320px] backdrop-blur-sm ${
        data.isSelected
          ? "border-2 border-blue-500 shadow-blue-500/50 shadow-lg"
          : "border border-gray-600"
      }`}
    >
      {/* Header */}
      <div className="bg-gray-900/80 rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Base Image Preview */}
        {data.baseImageUrl && (
          <div className="mb-4">
            <label className="text-white text-xs mb-1 block">Base Image</label>
            <div className="bg-gray-800 rounded p-2 relative overflow-hidden">
              <button
                onClick={() => {
                  if (data.onRemoveBaseImage) {
                    data.onRemoveBaseImage(id);
                  }
                }}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 transition-colors"
                title="Remove base image"
              >
                ×
              </button>
              <div className="w-full h-24 overflow-hidden rounded">
                <img
                  src={data.baseImageUrl}
                  alt="Base image"
                  className="w-full h-full object-cover"
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Avatar will interact with this image
              </p>
            </div>
          </div>
        )}

        {/* Prompt textarea with upload */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-white text-xs block">Prompt</label>
            <div className="flex space-x-2">
              <input
                type="file"
                accept=".txt,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        // Try to parse as JSON first (for exported prompts)
                        try {
                          const parsed = JSON.parse(content);
                          setPrompt(
                            parsed.prompt || parsed.enhancedPrompt || content
                          );
                        } catch {
                          // If not JSON, use as plain text
                          setPrompt(content);
                        }
                      } catch (error) {
                        console.error("Error reading file:", error);
                      }
                    };
                    reader.readAsText(file);
                  }
                  // Reset the input
                  e.target.value = "";
                }}
                className="hidden"
                id={`file-upload-${id}`}
              />
              <label
                htmlFor={`file-upload-${id}`}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded cursor-pointer transition-colors"
                title="Upload prompt from file (.txt or .json)"
              >
                📁 Upload
              </label>
              <button
                onClick={() => {
                  // Copy current prompt to clipboard as JSON
                  const promptData = {
                    prompt: prompt,
                    width: width,
                    height: height,
                    timestamp: new Date().toISOString(),
                  };
                  navigator.clipboard.writeText(
                    JSON.stringify(promptData, null, 2)
                  );
                  // Show brief feedback
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.textContent;
                  btn.textContent = "✓ Copied!";
                  setTimeout(() => {
                    btn.textContent = originalText;
                  }, 1000);
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded transition-colors"
                title="Copy prompt as JSON"
              >
                📋 Copy
              </button>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm p-3 rounded border border-gray-600 focus:border-purple-400 focus:outline-none resize-none"
            rows={3}
            placeholder="Describe the image you want to generate... or upload a prompt file"
          />
        </div>

        {/* Parameters */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-xs">Size</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="w-16 bg-gray-800 text-white text-xs p-1 rounded border border-gray-600"
                min="128"
                max="1536"
                step="32"
              />
              <span className="text-gray-400 text-xs">×</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                className="w-16 bg-gray-800 text-white text-xs p-1 rounded border border-gray-600"
                min="128"
                max="1536"
                step="32"
              />
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={data.isGenerating || !prompt.trim()}
            className={`py-1 px-2 rounded text-xs font-medium transition-colors ${
              data.isGenerating
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            {data.isGenerating ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Cooking...</span>
              </div>
            ) : (
              "Start"
            )}
          </button>
        </div>
      </div>

      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="baseImage"
        style={{ top: 80, background: "#60a5fa" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: 80, background: "#60a5fa" }}
      />
    </div>
  );
}
