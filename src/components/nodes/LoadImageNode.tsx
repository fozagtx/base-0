"use client";

import { Handle, Position } from "reactflow";
import { useCallback, useState } from "react";

interface LoadImageNodeProps {
  id: string;
  data: {
    imageUrl?: string;
    isSelected?: boolean;
    onFileUpload?: (file: File, nodeId: string) => void;
    onRemoveImage?: (nodeId: string) => void;
  };
}

export function LoadImageNode({ id, data }: LoadImageNodeProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && data.onFileUpload) {
        data.onFileUpload(file, id);
      }
    },
    [id, data.onFileUpload],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);

      const file = event.dataTransfer.files?.[0];
      if (file && data.onFileUpload) {
        data.onFileUpload(file, id);
      }
    },
    [id, data.onFileUpload],
  );

  const borderClass = data.isSelected
    ? "border-2 border-blue-500 shadow-blue-500/50 shadow-lg"
    : "border border-gray-600";

  return (
    <div className="bg-gray-700 rounded-lg shadow-lg min-w-[280px]">
      {/* Header */}
      <div className="bg-gray-600 rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-white text-sm font-medium">Load Image</span>
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
            <span className="text-white text-xs">IMAGE</span>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="w-8 h-0.5 bg-blue-400"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-blue-400"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white text-xs">images</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-white text-xs">MASK</span>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="w-8 h-0.5 bg-orange-400"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-orange-400"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-white text-xs">files</span>
          </div>
        </div>

        {/* Image upload area */}
        <div
          className={`bg-blue-600 rounded-lg h-64 flex flex-col items-center justify-center border-2 border-dashed transition-colors ${
            dragOver ? 'border-white bg-blue-500' : 'border-blue-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {data.imageUrl ? (
            <div className="relative w-full h-full">
              <button
                onClick={() => {
                  if (data.onRemoveImage) {
                    data.onRemoveImage(id);
                  }
                }}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 transition-colors"
                title="Remove image"
              >
                ×
              </button>
              <img
                src={data.imageUrl}
                alt="Uploaded"
                className="w-full h-full object-cover rounded"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
          ) : (
            <>
              <div className="text-6xl mb-4 text-yellow-400">📁</div>
              <div className="text-center">
                <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2 mb-4 min-w-[200px]">
                  <span className="text-gray-300 text-sm">
                    choose file to upload
                  </span>
                  <button className="text-gray-400">▶</button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id={`file-${id}`}
                />
                <label
                  htmlFor={`file-${id}`}
                  className="text-blue-300 text-sm cursor-pointer hover:text-blue-200"
                >
                  Choose File
                </label>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-gray-400 text-xs mt-2">1024 x 1024</div>
      </div>

      {/* React Flow Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="image"
        style={{ top: 90, background: "#60a5fa" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="mask"
        style={{ top: 120, background: "#fb923c" }}
      />
    </div>
  );
}
