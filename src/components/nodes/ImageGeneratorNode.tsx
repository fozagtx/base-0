"use client";

import { Handle, Position } from "reactflow";
import { useState, useCallback } from "react";

interface ImageGeneratorNodeProps {
  id: string;
  data: {
    prompt?: string;
    width?: number;
    height?: number;
    version?: "standard" | "hd" | "genius";
    preference?: "anime" | "photography" | "graphic" | "cinematic";
    negative_prompt?: string;
    isGenerating?: boolean;
    isSelected?: boolean;
    onGenerate?: (
      nodeId: string,
      prompt: string,
      options?: {
        width?: number;
        height?: number;
        image_generator_version?: "standard" | "hd" | "genius";
        genius_preference?: "anime" | "photography" | "graphic" | "cinematic";
        negative_prompt?: string;
      },
    ) => void;
  };
}

export function ImageGeneratorNode({ id, data }: ImageGeneratorNodeProps) {
  const [prompt, setPrompt] = useState(
    data.prompt || "A beautiful landscape with mountains and a lake",
  );
  const [width, setWidth] = useState(data.width || 512);
  const [height, setHeight] = useState(data.height || 512);
  const [version, setVersion] = useState(data.version || "standard");
  const [preference, setPreference] = useState(
    data.preference || "photography",
  );
  const [negativePrompt, setNegativePrompt] = useState(
    data.negative_prompt || "",
  );

  const handleGenerate = useCallback(() => {
    if (data.onGenerate && prompt.trim()) {
      const options = {
        width,
        height,
        image_generator_version: version,
        genius_preference: preference,
        negative_prompt: negativePrompt || undefined,
      };
      data.onGenerate(id, prompt, options);
    }
  }, [
    data.onGenerate,
    id,
    prompt,
    width,
    height,
    version,
    preference,
    negativePrompt,
  ]);

  const borderClass = data.isSelected
    ? "border-2 border-blue-500 shadow-blue-500/50 shadow-lg"
    : "border border-gray-600";

  return (
    <div
      className={`bg-purple-900/60 rounded-lg shadow-lg min-w-[320px] backdrop-blur-sm ${borderClass} transition-all duration-300`}
    >
      {/* Header */}
      <div className="bg-purple-800/80 rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <span className="text-white text-sm font-medium">
            DeepAI Image Generator
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-purple-700 text-white text-xs px-2 py-1 rounded">
            AI
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Connection points */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs">BASE IMAGE</span>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white text-xs">OUTPUT</span>
          </div>
        </div>

        {/* Prompt textarea */}
        <div className="mb-4">
          <label className="text-white text-xs mb-1 block">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm p-3 rounded border border-gray-600 focus:border-purple-400 focus:outline-none resize-none"
            rows={3}
            placeholder="Describe the image you want to generate..."
          />
        </div>

        {/* Negative prompt */}
        <div className="mb-4">
          <label className="text-white text-xs mb-1 block">
            Negative Prompt (optional)
          </label>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm p-2 rounded border border-gray-600 focus:border-purple-400 focus:outline-none"
            placeholder="What to exclude from the image..."
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

          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-xs">Version</span>
            <select
              value={version}
              onChange={(e) =>
                setVersion(e.target.value as "standard" | "hd" | "genius")
              }
              className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600"
            >
              <option value="standard">Standard</option>
              <option value="hd">HD</option>
              <option value="genius">Genius</option>
            </select>
          </div>

          {version === "genius" && (
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">Style</span>
              <select
                value={preference}
                onChange={(e) =>
                  setPreference(
                    e.target.value as
                      | "anime"
                      | "photography"
                      | "graphic"
                      | "cinematic",
                  )
                }
                className="bg-gray-800 text-white text-xs p-1 rounded border border-gray-600"
              >
                <option value="photography">Photography</option>
                <option value="anime">Anime</option>
                <option value="graphic">Graphic</option>
                <option value="cinematic">Cinematic</option>
              </select>
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={data.isGenerating || !prompt.trim()}
          className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
            data.isGenerating
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-500"
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
