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
  const { isConnected } = useAccount();
  const router = useRouter();

  // Use the custom hook for image generation
  const { generateImage, isGenerating, error } = useImageGeneration();

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
      };
      reader.readAsDataURL(file);
    },
    [setNodes],
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
      } = {},
    ) => {
      // Set generating state and update connected preview nodes to show loading
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
        console.log("Generating image with prompt:", prompt);

        // Use the hook to generate the image
        const result = await generateImage(prompt, options);

        if (result) {
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

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

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
  const nodesWithHandlers = nodes.map((node: Node) => ({
    ...node,
    data: {
      ...node.data,
      onFileUpload: handleFileUpload,
      onGenerate: handleGenerate,
      isSelected: selectedNodeId === node.id,
    },
  }));

  return (
    <div
      className="h-screen w-screen bg-gray-900"
      style={{ background: "#1a1a1a" }}
    >
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
