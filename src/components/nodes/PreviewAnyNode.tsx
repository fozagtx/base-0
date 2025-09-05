'use client';

import { Handle, Position } from 'reactflow';

interface PreviewAnyNodeProps {
  id: string;
  data: {
    response?: string;
  };
}

export function PreviewAnyNode({ id, data }: PreviewAnyNodeProps) {
  return (
    <div className="bg-gray-700 rounded-lg shadow-lg min-w-[280px]">
      {/* Header */}
      <div className="bg-gray-600 rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-white text-sm font-medium">Preview Any</span>
        </div>
        <button className="text-orange-400 hover:text-orange-300">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Connection point */}
        <div className="flex items-center mb-4">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
          <span className="text-white text-xs">source</span>
        </div>

        {/* Console output area */}
        <div className="bg-gray-900 rounded-lg p-3 min-h-[100px] border border-gray-600">
          <div className="text-green-400 font-mono text-xs">
            {data.response || 'Empty response from Gemini model...'}
          </div>
        </div>
      </div>

      {/* React Flow Handles */}
      <Handle type="target" position={Position.Left} id="source" style={{ top: 60, background: '#4ade80' }} />
    </div>
  );
}
