"use client";

import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useSynapseStorage } from "@/hooks/useSynapseStorage";
import { UserPrompt, GeneratedImage } from "@/types/prompt";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const { getUserPrompts, getUserImages, isInitializing, initializeStorage } = useSynapseStorage();
  
  const [prompts, setPrompts] = useState<UserPrompt[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'prompts' | 'images'>('images');

  // Initialize storage and load data
  useEffect(() => {
    const loadData = async () => {
      if (!isConnected) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);
        await initializeStorage();
        
        const [userPrompts, userImages] = await Promise.all([
          getUserPrompts(),
          getUserImages()
        ]);
        
        setPrompts(userPrompts);
        setImages(userImages);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isConnected, router, initializeStorage, getUserPrompts, getUserImages]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Redirecting to login...</div>
      </div>
    );
  }

  if (loading || isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Loading your history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Creation History</h1>
            <p className="text-gray-400">
              Wallet: {address} • {images.length} images • {prompts.length} prompts
            </p>
          </div>
          <Button 
            onClick={() => router.push('/playground')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Playground
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'images'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Generated Images ({images.length})
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'prompts'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Saved Prompts ({prompts.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'images' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12">
                <p className="text-xl mb-4">No images generated yet</p>
                <p>Start creating in the playground to see your history here</p>
              </div>
            ) : (
              images.map((image) => (
                <Card key={image.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={image.imageUrl}
                      alt="Generated image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                      {prompts.find(p => p.id === image.promptId)?.prompt || 'Unknown prompt'}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>{new Date(image.timestamp).toLocaleDateString()}</span>
                      <span>{image.metadata?.width}x{image.metadata?.height}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-xl mb-4">No prompts saved yet</p>
                <p>Generate images in the playground to see your prompts here</p>
              </div>
            ) : (
              prompts.map((prompt) => {
                const relatedImages = images.filter(img => img.promptId === prompt.id);
                return (
                  <Card key={prompt.id} className="bg-gray-800 border-gray-700">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-2">Original Prompt</h3>
                          <p className="text-gray-300 mb-3">{prompt.prompt}</p>
                          
                          {prompt.enhancedPrompt !== prompt.prompt && (
                            <>
                              <h4 className="text-md font-medium mb-2 text-blue-400">Enhanced Prompt</h4>
                              <p className="text-gray-300 mb-3">{prompt.enhancedPrompt}</p>
                            </>
                          )}
                          
                          <div className="flex gap-4 text-sm text-gray-400">
                            <span>Created: {new Date(prompt.timestamp).toLocaleString()}</span>
                            <span>Size: {prompt.metadata.width}x{prompt.metadata.height}</span>
                            <span>Style: {prompt.metadata.preference}</span>
                            <span>Version: {prompt.metadata.version}</span>
                          </div>
                        </div>
                      </div>
                      
                      {relatedImages.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium mb-3">Generated Images ({relatedImages.length})</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {relatedImages.map((image) => (
                              <div key={image.id} className="aspect-square">
                                <img
                                  src={image.imageUrl}
                                  alt="Generated image"
                                  className="w-full h-full object-cover rounded border border-gray-600"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
