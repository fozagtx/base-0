'use client';

import { Handle, Position } from 'reactflow';
import { useState, useCallback } from 'react';

interface GeminiImageNodeProps {
  id: string;
  data: {
    prompt?: string;
    model?: string;
    seed?: string;
    control?: string;
    isGenerating?: boolean;
    onGenerate?: (nodeId: string, prompt: string) => void;
  };
}

export function GeminiImageNode({ id, data }: GeminiImageNodeProps) {
  const [prompt, setPrompt] = useState(data.prompt || 'Inflatable, 3D render, shiny, glossy, soft, rounded edges, studio lighting, isolated on a blue background');
  const [model] = useState(data.model || 'gemini-2.5-flash-image-preview');
  const [seed] = useState(data.seed || '979784968387020');
  const [control] = useState(data.control || 'randomize');

  const handleGenerate = useCallback(() => {
    if (data.onGenerate && prompt.trim()) {
      data.onGenerate(id, prompt);
    }
  }, [data.onGenerate, id, prompt]);

  return (
    <div className="bg-amber-900/60 rounded-lg shadow-lg min-w-[320px] backdrop-blur-sm">
      {/* Header */}
      <div className="bg-amber-800/80 rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
          <span className="text-white text-sm font-medium">Google Gemini Image</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-amber-700 text-white text-xs px-2 py-1 rounded">5</span>
          <button className="text-orange-400 hover:text-orange-300">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
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
            <span className="text-white text-xs">STRING</span>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-8 h-0.5 bg-green-400"></div>
          </div>
        </div>

        {/* Prompt textarea */}
        <div className="mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm p-3 rounded border border-gray-600 focus:border-amber-400 focus:outline-none resize-none"
            rows={3}
            placeholder="Enter your prompt..."
          />
        </div>

        {/* Parameters */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
            <span className="text-gray-300 text-xs">model</span>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs">{model}</span>
              <button className="text-gray-400">▶</button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
            <span className="text-gray-300 text-xs">seed</span>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs">{seed}</span>
              <button className="text-gray-400">▶</button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
            <span className="text-gray-300 text-xs">control after generate</span>
            <div className="flex items-center space-x-2">
              <span className="text-white text-xs">{control}</span>
              <button className="text-gray-400">▶</button>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={data.isGenerating || !prompt.trim()}
          className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
            data.isGenerating
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-amber-600 text-white hover:bg-amber-500'
          }`}
        >
          {data.isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* React Flow Handles */}
      <Handle type="target" position={Position.Left} id="image" style={{ top: 90, background: '#60a5fa' }} />
      <Handle type="target" position={Position.Left} id="string" style={{ top: 120, background: '#4ade80' }} />
      <Handle type="source" position={Position.Right} id="output" style={{ top: 90, background: '#60a5fa' }} />
    </div>
  );
}
