"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  NodeTypes,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { LoadImageNode } from "@/components/nodes/LoadImageNode";
import { GeminiImageNode } from "@/components/nodes/GeminiImageNode";
import { PreviewImageNode } from "@/components/nodes/PreviewImageNode";
import { PreviewAnyNode } from "@/components/nodes/PreviewAnyNode";
import { PlaygroundMetaMaskConnector } from "@/components/PlaygroundMetaMaskConnector";
import { useSynapseStorage } from "@/hooks/useSynapseStorage";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const nodeTypes: NodeTypes = {
  loadImage: LoadImageNode,
  geminiImage: GeminiImageNode,
  previewImage: PreviewImageNode,
  previewAny: PreviewAnyNode,
};

const initialNodes: Node[] = [
  {
    id: "load-1",
    type: "loadImage",
    position: { x: 100, y: 150 },
    data: { onFileUpload: null },
  },
  {
    id: "gemini-1",
    type: "geminiImage",
    position: { x: 500, y: 100 },
    data: {
      prompt:
        "Inflatable, 3D render, shiny, glossy, soft, rounded edges, studio lighting, isolated on a blue background",
      onGenerate: null,
    },
  },
  {
    id: "preview-1",
    type: "previewImage",
    position: { x: 950, y: 150 },
    data: { title: "Preview Image" },
  },
  {
    id: "preview-any-1",
    type: "previewAny",
    position: { x: 950, y: 450 },
    data: { response: "Empty response from Gemini model..." },
  },
];

const initialEdges: Edge[] = [
  {
    id: "load-to-gemini",
    source: "load-1",
    target: "gemini-1",
    sourceHandle: "image",
    targetHandle: "image",
    style: { stroke: "#ffffff", strokeWidth: 2 },
  },
  {
    id: "gemini-to-preview",
    source: "gemini-1",
    target: "preview-1",
    sourceHandle: "output",
    targetHandle: "image",
    style: { stroke: "#ffffff", strokeWidth: 2 },
  },
  {
    id: "gemini-to-any",
    source: "gemini-1",
    target: "preview-any-1",
    sourceHandle: "output",
    targetHandle: "source",
    style: { stroke: "#ffffff", strokeWidth: 2 },
    type: "smoothstep",
  },
];

function PlaygroundFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const {
    storeImage,
    isStoring,
    isInitialized: synapseInitialized,
  } = useSynapseStorage();

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
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
        setNodes((nds) =>
          nds.map((node) =>
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
    async (nodeId: string, prompt: string) => {
      // Set generating state
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, isGenerating: true } }
            : node,
        ),
      );

      try {
        // Find connected image input
        const geminiNode = nodes.find((n) => n.id === nodeId);
        const connectedEdge = edges.find(
          (e) => e.target === nodeId && e.targetHandle === "image",
        );
        let baseObject = "";

        if (connectedEdge) {
          const sourceNode = nodes.find((n) => n.id === connectedEdge.source);
          if (sourceNode?.data.imageUrl) {
            baseObject = sourceNode.data.imageUrl;
          }
        }

        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            baseObject: baseObject || undefined,
            walletAddress: address,
          }),
        });

        const result = await response.json();

        // Update preview nodes with generated image
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return { ...node, data: { ...node.data, isGenerating: false } };
            }

            // Update connected preview nodes
            const isConnectedPreview = edges.some(
              (e) => e.source === nodeId && e.target === node.id,
            );

            if (isConnectedPreview) {
              if (node.type === "previewImage") {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    imageUrl: result.imageUrl,
                    filecoinStorage: result.filecoinStorage || null,
                  },
                };
              }
              if (node.type === "previewAny") {
                const responseText = result.imageUrl
                  ? "Image generated successfully!"
                  : result.error || "Generation failed";
                const filecoinInfo = result.filecoinStorage
                  ? `\nStored on Filecoin: ${result.filecoinStorage.pieceCid.slice(0, 8)}...`
                  : "\nFilecoin storage: Not available";

                return {
                  ...node,
                  data: {
                    ...node.data,
                    response: responseText + filecoinInfo,
                    filecoinStorage: result.filecoinStorage || null,
                  },
                };
              }
            }

            return node;
          }),
        );
      } catch (error) {
        console.error("Failed to generate image:", error);

        // Update error state
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return { ...node, data: { ...node.data, isGenerating: false } };
            }

            const isConnectedPreview = edges.some(
              (e) =>
                e.source === nodeId &&
                e.target === node.id &&
                node.type === "previewAny",
            );

            if (isConnectedPreview) {
              return {
                ...node,
                data: {
                  ...node.data,
                  response: `Error: ${error instanceof Error ? error.message : "Generation failed"}`,
                },
              };
            }

            return node;
          }),
        );
      }
    },
    [nodes, edges, setNodes],
  );

  // Redirect to login if wallet is not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/login");
    }
  }, [isConnected, router]);

  // Show loading state while checking connection
  if (!isConnected) {
    return (
      <div
        className="h-screen w-screen bg-gray-900 flex items-center justify-center"
        style={{ background: "#1a1a1a" }}
      >
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // Add handlers to nodes
  const nodesWithHandlers = nodes.map((node) => ({
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
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        fitView
        style={{ background: "#1a1a1a" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#333333"
        />
        <Controls
          style={{
            background: "#2d2d2d",
            border: "1px solid #444",
            borderRadius: "8px",
          }}
        />
        <MiniMap
          nodeColor="#666"
          nodeStrokeColor="#888"
          nodeStrokeWidth={1}
          style={{
            background: "#2d2d2d",
            border: "1px solid #444",
            borderRadius: "8px",
          }}
        />

        {/* Wallet connector in top right */}
        <div className="absolute top-4 right-4 z-50">
          <PlaygroundMetaMaskConnector />
        </div>
      </ReactFlow>
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
