"use client";

import { Handle, Position } from "reactflow";
import { useState, useEffect } from "react";


interface PreviewImageNodeProps {
  id: string;
  data: {
    imageUrl?: string;
    title?: string;
    isLoading?: boolean;
    prompt?: string;
    showPrompt?: boolean;
    isSelected?: boolean;
    filecoinStorage?: {
      pieceCid: string;
      url: string;
      timestamp: number;
    } | null;
  };
}

export function PreviewImageNode({ id, data }: PreviewImageNodeProps) {
  const [progress, setProgress] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 280, height: 200 });

  useEffect(() => {
    if (data.isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [data.isLoading]);

  // Handle image load to get dimensions
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const maxWidth = 400; // Maximum width for the node
    const maxHeight = 300; // Maximum height for the node

    let { naturalWidth, naturalHeight } = img;

    // Calculate aspect ratio and scale down if needed
    const aspectRatio = naturalWidth / naturalHeight;

    if (naturalWidth > maxWidth) {
      naturalWidth = maxWidth;
      naturalHeight = maxWidth / aspectRatio;
    }

    if (naturalHeight > maxHeight) {
      naturalHeight = maxHeight;
      naturalWidth = maxHeight * aspectRatio;
    }

    setImageDimensions({
      width: Math.max(280, naturalWidth), // Minimum width of 280px
      height: naturalHeight
    });
  };







  const borderClass = data.isSelected
    ? "border-2 border-blue-500 shadow-blue-500/50 shadow-lg"
    : "border border-gray-600";

  return (
    <div
      className={`bg-[#1A1A1A] rounded-lg shadow-lg ${borderClass} transition-all duration-300`}
      style={{ width: `${imageDimensions.width}px` }}
    >
      {/* Header */}
      <div className="bg-[#1A1A1A] rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-white text-sm font-medium">
            {data.title || "Preview Image"}
          </span>
        </div>
        <button className="text-orange-400 hover:text-orange-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Connection points */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="w-8 h-0.5 bg-blue-400"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-blue-400"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
        </div>

        {/* Image display area */}
        <div
          className="bg-transparent rounded-lg flex items-center justify-center relative overflow-hidden"
          style={{
            height: data.imageUrl ? `${imageDimensions.height}px` : '200px',
            minHeight: '120px'
          }}
        >
          {data.isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 bg-gray-800 rounded-lg w-full h-full">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-300 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {progress}%
                  </span>
                </div>
              </div>
              <div className="text-white text-sm">Generating...</div>
              <div className="w-40 bg-[#1A1A1A] rounded-full h-2 border border-white/10">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded"
              onLoad={handleImageLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          ) : (
            <div className="text-6xl text-yellow-400 bg-gray-800 rounded-lg w-full h-full flex items-center justify-center">
              🎨
            </div>
          )}
        </div>

        {/* Prompt reveal */}
        {data.showPrompt && data.prompt && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
            <div className="text-xs text-gray-400 mb-1">
              Generated from prompt:
            </div>
            <div className="text-sm text-white break-words">{data.prompt}</div>
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <div className="text-gray-400 text-xs">
            {data.imageUrl ? `${Math.round(imageDimensions.width)} x ${Math.round(imageDimensions.height)}` : '1024 x 1024'}
          </div>
          {data.filecoinStorage && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-green-400">Stored</span>
            </div>
          )}
        </div>

        {data.filecoinStorage && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
            <div className="text-green-400 font-mono">
              CID: {data.filecoinStorage.pieceCid.slice(0, 12)}...
            </div>
            <a
              href={data.filecoinStorage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              View on Explorer →
            </a>
          </div>
        )}
      </div>

      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        style={{ top: '50%', background: "#60a5fa", transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: '50%', background: "#60a5fa", transform: 'translateY(-50%)' }}
      />
    </div>
  );
}
