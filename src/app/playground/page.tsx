"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { LoadImageNode } from "@/components/nodes/LoadImageNode";
import { ImageGeneratorNode } from "@/components/nodes/ImageGeneratorNode";
import { PreviewImageNode } from "@/components/nodes/PreviewImageNode";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSynapseStorage } from "@/hooks/useSynapseStorage";
import { UserPrompt, GeneratedImage } from "@/types/prompt";
import { Button } from "@/components/ui/button";

const nodeTypes: NodeTypes = {
  loadImage: LoadImageNode,
  imageGenerator: ImageGeneratorNode,
  previewImage: PreviewImageNode,
};

const initialNodes: Node[] = [
  {
    id: "load-1",
    type: "loadImage",
    position: { x: 100, y: 150 },
    data: { onFileUpload: null },
  },
  {
    id: "generator-1",
    type: "imageGenerator",
    position: { x: 500, y: 100 },
    data: {
      prompt: "A beautiful cyberpunk city at night with neon lights",
      width: 512,
      height: 512,
      version: "standard",
      preference: "photography",
      onGenerate: null,
    },
  },
  {
    id: "preview-1",
    type: "previewImage",
    position: { x: 950, y: 150 },
    data: { title: "Preview Image" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "load-to-generator",
    source: "load-1",
    target: "generator-1",
    sourceHandle: "image",
    targetHandle: "baseImage",
    style: { stroke: "#ffffff", strokeWidth: 2 },
  },
  {
    id: "generator-to-preview",
    source: "generator-1",
    target: "preview-1",
    sourceHandle: "output",
    targetHandle: "image",
    style: { stroke: "#ffffff", strokeWidth: 2 },
  },
];

function PlaygroundFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { isConnected, address } = useAccount();
  const router = useRouter();

  // Use the custom hook for image generation
  const { generateImage, isGenerating, error } = useImageGeneration();
  
  // Use the storage hook
  const { 
    savePrompt, 
    saveGeneratedImage, 
    isStoring, 
    initializeStorage 
  } = useSynapseStorage();

  // Initialize storage when component mounts
  useEffect(() => {
    if (isConnected) {
      initializeStorage();
    }
  }, [isConnected, initializeStorage]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#ffffff", strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const handleFileUpload = useCallback(
    (file: File, nodeId: string) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setNodes((nds: Node[]) =>
          nds.map((node: Node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, imageUrl } }
              : node,
          ),
        );

        // Find connected image generator nodes and update them with base image
        const connectedEdges = edges.filter((edge: Edge) => 
          edge.source === nodeId && edge.sourceHandle === "image"
        );
        
        connectedEdges.forEach((edge: Edge) => {
          setNodes((nds: Node[]) =>
            nds.map((node: Node) =>
              node.id === edge.target
                ? { 
                    ...node, 
                    data: { 
                      ...node.data, 
                      baseImageUrl: imageUrl,
                    } 
                  }
                : node,
            ),
          );
        });
      };
      reader.readAsDataURL(file);
    },
    [setNodes, edges],
  );

  const handleGenerate = useCallback(
    async (
      nodeId: string,
      prompt: string,
      options: {
        width?: number;
        height?: number;
        image_generator_version?: "standard" | "hd" | "genius";
        genius_preference?: "anime" | "photography" | "graphic" | "cinematic";
        negative_prompt?: string;
        baseImageUrl?: string;
      } = {},
    ) => {
      // Set generating state
      setNodes((nds: Node[]) =>
        nds.map((node: Node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, isGenerating: true } }
            : node,
        ),
      );

      // Set loading state on connected preview nodes
      const connectedEdges = edges.filter(
        (edge: Edge) => edge.source === nodeId,
      );
      connectedEdges.forEach((edge: Edge) => {
        setNodes((nds: Node[]) =>
          nds.map((node: Node) =>
            node.id === edge.target
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    isLoading: true,
                    showPrompt: false,
                  },
                }
              : node,
          ),
        );
      });

      try {
        // Find connected base image if any
        const connectedImageEdge = edges.find((edge: Edge) => 
          edge.target === nodeId && edge.targetHandle === "baseImage"
        );
        
        let baseImageUrl = options.baseImageUrl;
        if (connectedImageEdge) {
          const sourceNode = nodes.find((node: Node) => node.id === connectedImageEdge.source);
          if (sourceNode?.data?.imageUrl) {
            baseImageUrl = sourceNode.data.imageUrl;
            
            // Update the generator node to show the base image
            setNodes((nds: Node[]) =>
              nds.map((node: Node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, baseImageUrl } }
                  : node,
              ),
            );
          }
        }

        // Modify prompt to include base image context if available
        let enhancedPrompt = prompt;
        if (baseImageUrl) {
          enhancedPrompt = `Create a lifestyle avatar holding, using, or interacting with the product/item shown in the reference image. ${prompt}`;
        }

        console.log('Generating image with prompt:', enhancedPrompt);
        console.log('Base image URL:', baseImageUrl);
        
        // Use the hook to generate the image
        const result = await generateImage(enhancedPrompt, {
          ...options,
          baseImageUrl, // Pass the base image URL
        });

        if (result) {
          // Save prompt to storage
          const promptToSave: UserPrompt = {
            id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prompt: prompt,
            enhancedPrompt: enhancedPrompt,
            userId: address || '',
            timestamp: Date.now(),
            baseImageUrl,
            metadata: {
              width: options.width || 512,
              height: options.height || 512,
              version: options.image_generator_version || 'standard',
              preference: options.genius_preference || 'photography',
            },
          };

          // Save generated image to storage
          const imageToSave: GeneratedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            imageUrl: result.imageUrl,
            promptId: promptToSave.id,
            userId: address || '',
            timestamp: Date.now(),
            deepaiId: result.metadata?.id || '',
            metadata: {
              ...result.metadata,
              ...options,
              baseImageUrl,
              nodeId: nodeId,
            },
          };

          // Save to storage (async, don't wait)
          savePrompt(promptToSave).catch(err => 
            console.error('Failed to save prompt:', err)
          );
          saveGeneratedImage(imageToSave).catch(err => 
            console.error('Failed to save image:', err)
          );

          // Update the generator node with the result
          setNodes((nds: Node[]) =>
            nds.map((node: Node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      isGenerating: false,
                      generatedImage: result.imageUrl,
                      metadata: result.metadata,
                      savedPromptId: promptToSave.id,
                      savedImageId: imageToSave.id,
                    },
                  }
                : node,
            ),
          );

          // Update any connected preview nodes
          connectedEdges.forEach((edge: Edge) => {
            setNodes((nds: Node[]) =>
              nds.map((node: Node) =>
                node.id === edge.target
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        imageUrl: result.imageUrl,
                        isLoading: false,
                        showPrompt: true,
                        prompt: prompt,
                      },
                    }
                  : node,
              ),
            );
          });

          console.log("Image generation successful:", result.imageUrl);
        } else {
          throw new Error(error || "Failed to generate image");
        }
      } catch (err) {
        console.error("Image generation failed:", err);

        // Update node with error state
        setNodes((nds: Node[]) =>
          nds.map((node: Node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    isGenerating: false,
                    error: err instanceof Error ? err.message : "Unknown error",
                  },
                }
              : node,
          ),
        );
      }
    },
    [generateImage, error, edges, setNodes],
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Update selection state for all nodes
      setNodes((nds: Node[]) =>
        nds.map((n: Node) => ({
          ...n,
          data: {
            ...n.data,
            isSelected: n.id === node.id,
          },
        })),
      );
    },
    [setNodes],
  );

  // Redirect to login if wallet is not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

    // Show loading state while checking connection
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Checking wallet connection...</div>
      </div>
    );
  }

  // Add handlers to nodes

  // Add handlers to nodes
  const nodesWithHandlers = nodes.map((node: Node) => ({
    ...node,
    data: {
      ...node.data,
      onFileUpload: handleFileUpload,
      onGenerate: handleGenerate,
    },
  }));

  return (
    <div
      className="h-screen w-screen bg-gray-900"
      style={{ background: "#1a1a1a" }}
    >
      {/* Header with navigation */}
      <div className="absolute top-4 right-4 z-10 flex gap-3">
        <Button 
          onClick={() => router.push('/history')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          View History
        </Button>
        <Button 
          onClick={() => router.push('/')}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
          size="sm"
        >
          Logout
        </Button>
      </div>

      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      />
      
      {/* Storage status indicator */}
      {isStoring && (
        <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Saving to storage...
        </div>
      )}
    </div>
  );
}

export default function Playground() {
  return (
    <ReactFlowProvider>
      <PlaygroundFlow />
    </ReactFlowProvider>
  );
}
