'use client'

import { Handle, Position } from 'reactflow'
import { useState, useRef } from 'react'

export interface ImageNodeData {
  label?: string
  imageUrl?: string
  isGenerating?: boolean
  nodeType?: 'avatar' | 'upload' | 'default'
  baseObject?: string
  onFileUpload?: (file: File, nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onAddNode?: () => void
  nodeId?: string
  loadingProgress?: number
}

export function ImageNode({ data }: { data: ImageNodeData }) {
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && data.onFileUpload && data.nodeId) {
      data.onFileUpload(file, data.nodeId)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleDelete = () => {
    if (data.onDeleteNode && data.nodeId) {
      data.onDeleteNode(data.nodeId)
    }
  }

  // Always show nodes - they should be visible by default

  return (
    <div 
      className="bg-white border-2 border-black shadow-lg shadow-black/20 rounded-lg p-4 min-w-[250px] min-h-[300px] font-mono relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete Button */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10"
        >
          ×
        </button>
      )}

      {/* Plus Button for adding nodes */}
      {isHovered && data.imageUrl && (
        <button
          className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-black hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm z-10"
        >
          +
        </button>
      )}

      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-black border-white border-2"
      />
      
      <div className="space-y-4 h-full">
        {/* Upload Node Type */}
        {data.nodeType === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            {data.baseObject ? (
              <div className="space-y-2">
                <img 
                  src={data.baseObject} 
                  alt="Base object"
                  className="w-40 h-40 object-cover border-2 border-black/20 rounded shadow-sm shadow-black/10"
                />
                <button
                  onClick={handleUploadClick}
                  className="text-xs text-black/60 hover:text-black border border-black/20 hover:border-black rounded px-2 py-1"
                >
                  Change file
                </button>
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                className="w-40 h-40 bg-white border-2 border-black/10 border-dashed rounded flex flex-col items-center justify-center space-y-2 hover:border-black/30 transition-colors"
              >
                <div className="w-12 h-12 border-2 border-black/20 rounded flex items-center justify-center">
                  <span className="text-black/40 text-xl">+</span>
                </div>
                <span className="text-black/40 text-xs text-center font-mono">
                  Upload base object<br/>(medicine, tool, etc.)
                </span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {isHovered && (
              <div className="text-xs text-black/60 text-center font-mono">
                Upload an object for avatar to hold
              </div>
            )}
          </div>
        )}

        {/* Avatar Node Type */}
        {data.nodeType !== 'upload' && (
          <>
            {data.isGenerating && (
              <div className="w-full h-48 bg-black/5 border border-black/20 rounded flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full"></div>
                {data.loadingProgress !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black font-mono">
                      {Math.round(data.loadingProgress)}%
                    </div>
                    <div className="text-xs text-black/60 font-mono">
                      Generating avatar...
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {data.imageUrl && !data.isGenerating && (
              <div className="w-full h-48">
                <img 
                  src={data.imageUrl} 
                  alt="Generated avatar"
                  className="w-full h-full object-cover border-2 border-black/20 rounded shadow-sm shadow-black/10"
                />
              </div>
            )}
            
            {!data.imageUrl && !data.isGenerating && (
              <div className="w-full h-48 bg-white border-2 border-black/10 border-dashed rounded flex flex-col items-center justify-center space-y-2">
                <div className="w-16 h-16 border-2 border-black/20 rounded flex items-center justify-center">
                  <span className="text-black/40 text-2xl">○</span>
                </div>
                <span className="text-black/40 text-xs text-center font-mono">Avatar will appear here</span>
              </div>
            )}
            
            {isHovered && (
              <div className="text-xs text-black/60 text-center font-mono">
                {data.imageUrl ? 'Generated avatar' : 'Connect nodes or press P to generate'}
              </div>
            )}
          </>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-black border-white border-2"
      />
      
      {/* Plus button below node */}
      {data.imageUrl && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <button
            onClick={data.onAddNode}
            className="w-8 h-8 bg-black hover:bg-black/80 text-white rounded-full flex items-center justify-center text-lg shadow-md shadow-black/20"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}