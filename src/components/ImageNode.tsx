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
  onRegenerateImage?: (nodeId: string, newPrompt: string) => void
  nodeId?: string
  loadingProgress?: number
  selected?: boolean
  originalPrompt?: string
}

export function ImageNode({ data }: { data: ImageNodeData }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editPrompt, setEditPrompt] = useState(data.originalPrompt || '')
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

  const handleEditSubmit = () => {
    if (editPrompt.trim() && data.onRegenerateImage && data.nodeId) {
      data.onRegenerateImage(data.nodeId, editPrompt.trim())
      setShowEditModal(false)
    }
  }

  const handleEditCancel = () => {
    setEditPrompt(data.originalPrompt || '')
    setShowEditModal(false)
  }

  // Always show nodes - they should be visible by default

  return (
    <div 
      className={`bg-[#171717] border-2 ${data.selected ? 'border-blue-500 shadow-blue-500/20' : 'border-white/20'} shadow-lg shadow-black/20 rounded-lg p-4 min-w-[250px] min-h-[300px] font-mono relative group transition-all duration-200 ${data.selected ? 'ring-2 ring-blue-400/30' : ''}`}
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

      {/* Edit Button - Always visible for avatar nodes with images */}
      {data.nodeType === 'avatar' && data.imageUrl && (
        <div 
          className="absolute -top-2 -right-10 w-8 h-8 hover:scale-110 transition-transform duration-200"
          onMouseEnter={() => setIsHovered(true)}
        >
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full h-full bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 z-10 transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      )}


      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-white border-[#171717] border-2"
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
                  className="w-40 h-40 object-cover border-2 border-white/20 rounded shadow-sm shadow-black/10"
                />
                <button
                  onClick={handleUploadClick}
                  className="text-xs text-white/60 hover:text-white border border-white/20 hover:border-white rounded px-2 py-1"
                >
                  Change file
                </button>
              </div>
            ) : (
              <button
                onClick={handleUploadClick}
                className="w-40 h-40 bg-black/20 border-2 border-white/20 border-dashed rounded flex flex-col items-center justify-center space-y-2 hover:border-white/40 transition-colors"
              >
                <div className="w-12 h-12 border-2 border-white/30 rounded flex items-center justify-center">
                  <span className="text-white/60 text-xl">+</span>
                </div>
                <span className="text-white/60 text-xs text-center font-mono">
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
              <div className="text-xs text-white/60 text-center font-mono">
                Upload an object for avatar to hold
              </div>
            )}
          </div>
        )}

        {/* Avatar Node Type */}
        {data.nodeType !== 'upload' && (
          <>
            {data.isGenerating && (
              <div className="w-full h-48 bg-white/5 border border-white/20 rounded flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
                {data.loadingProgress !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white font-mono">
                      {Math.round(data.loadingProgress)}%
                    </div>
                    <div className="text-xs text-white/60 font-mono">
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
                  className="w-full h-full object-cover border-2 border-white/20 rounded shadow-sm shadow-black/10"
                />
              </div>
            )}
            
            {!data.imageUrl && !data.isGenerating && (
              <div className="w-full h-48 bg-black/20 border-2 border-white/20 border-dashed rounded flex flex-col items-center justify-center space-y-2">
                <div className="w-16 h-16 border-2 border-white/30 rounded flex items-center justify-center">
                  <span className="text-white/60 text-2xl">○</span>
                </div>
                <span className="text-white/60 text-xs text-center font-mono">Avatar will appear here</span>
              </div>
            )}
            
            {isHovered && (
              <div className="text-xs text-white/60 text-center font-mono">
                {data.imageUrl ? 'Generated avatar' : 'Connect nodes or press P to generate'}
              </div>
            )}
          </>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-white border-[#171717] border-2"
      />
      
      {/* Visible round plus button below middle of node */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
        <button
          onClick={data.onAddNode}
          className="w-10 h-10 bg-white hover:bg-white/90 text-black rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-black/30 border-2 border-[#171717] transition-all duration-200 hover:scale-105"
        >
          +
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md">
          <div className="bg-[#171717] rounded-xl p-6 w-full max-w-md shadow-2xl border border-white/20 relative">
            {/* Red X close button in top right corner */}
            <button
              onClick={handleEditCancel}
              className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Edit Avatar Prompt</h3>
              
              <div className="relative">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
                  placeholder="Enter new prompt..."
                  className="w-full p-4 pr-12 bg-black/40 border border-white/20 focus:border-white/50 focus:outline-none text-white rounded-lg text-sm"
                  autoFocus
                />
                {/* Icon inside input field for submitting */}
                <button
                  onClick={handleEditSubmit}
                  disabled={!editPrompt.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 rounded-full"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L22 7L12 12L2 7L12 2Z" fill="currentColor" opacity="0.8"/>
                    <path d="M12 12L22 17L12 22L2 17L12 12Z" fill="currentColor" opacity="0.6"/>
                    <path d="M2 12L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}