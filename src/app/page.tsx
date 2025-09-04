"use client";

import { useCallback, useState, useEffect } from "react";
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
  Panel,
  NodeTypes,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageNode, ImageNodeData } from "@/components/ImageNode";
import { Card } from "@/components/ui/card";
import { WalletConnector } from "@/components/WalletConnector";

const nodeTypes: NodeTypes = {
  imageNode: ImageNode,
};

const initialNodes: Node<ImageNodeData>[] = [
  {
    id: "1",
    type: "imageNode",
    position: { x: 400, y: 200 },
    data: { nodeType: "avatar", nodeId: "1" },
  },
];

const initialEdges: Edge[] = [];

function Base0Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [connectionContext, setConnectionContext] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const onConnect = useCallback(
    (params: Connection) => {
      // Add edge first
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#ffffff", strokeWidth: 2 },
          },
          eds,
        ),
      );

      // Trigger prompt modal for connection context
      if (params.source && params.target) {
        setConnectionContext({
          sourceId: params.source,
          targetId: params.target,
        });
        setShowPromptModal(true);
      }
    },
    [setEdges],
  );

  const addNode = useCallback(() => {
    const newNodeId = `${nodes.length + 1}`;
    const newNode: Node<ImageNodeData> = {
      id: newNodeId,
      type: "imageNode",
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        nodeType: "avatar",
        nodeId: newNodeId,
        onFileUpload: handleFileUpload,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, setNodes]);

  const handleFileUpload = useCallback(
    (file: File, nodeId: string) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, baseObject: imageUrl } }
              : node,
          ),
        );
      };
      reader.readAsDataURL(file);
    },
    [setNodes],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
    },
    [setNodes, setEdges],
  );

  const connectWallet = useCallback(() => {
    // This function is no longer needed - OnchainKit handles wallet connection
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const generateImage = useCallback(
    async (
      nodeId: string,
      prompt: string,
      instruction?: string,
      baseObject?: string,
    ) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, isGenerating: true } }
            : node,
        ),
      );

      // Start loading counter animation
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15 + 5; // Random increment between 5-20
        });
      }, 200);

      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, instruction, baseObject }),
        });

        const result = await response.json();

        // Complete the loading animation
        clearInterval(interval);
        setLoadingProgress(100);

        setTimeout(() => {
          if (result.imageUrl) {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        imageUrl: result.imageUrl,
                        isGenerating: false,
                      },
                    }
                  : node,
              ),
            );
          }
          setLoadingProgress(0);
        }, 500);
      } catch (error) {
        console.error("Failed to generate image:", error);
        clearInterval(interval);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, isGenerating: false } }
              : node,
          ),
        );
        setLoadingProgress(0);
      }
    },
    [setNodes],
  );

  const handlePromptSubmit = useCallback(() => {
    if (prompt.trim()) {
      let targetNodeId = selectedNodeId;
      let baseObject = "";

      // Handle connection context
      if (connectionContext) {
        const sourceNode = nodes.find(
          (n) => n.id === connectionContext.sourceId,
        );
        const targetNode = nodes.find(
          (n) => n.id === connectionContext.targetId,
        );

        if (
          sourceNode?.data.nodeType === "upload" &&
          sourceNode.data.baseObject
        ) {
          baseObject = sourceNode.data.baseObject;
        }

        targetNodeId = connectionContext.targetId;
      }

      // If no target node is selected, find the first available avatar node
      if (!targetNodeId) {
        const avatarNode = nodes.find(
          (node) => node.data.nodeType === "avatar" && !node.data.imageUrl,
        );
        targetNodeId = avatarNode?.id || nodes[0]?.id;
      }

      if (targetNodeId) {
        generateImage(
          targetNodeId,
          prompt,
          instruction || undefined,
          baseObject || undefined,
        );
      }

      // Reset form
      setPrompt("");
      setInstruction("");
      setShowPromptModal(false);
      setSelectedNodeId(null);
      setConnectionContext(null);
    }
  }, [
    selectedNodeId,
    prompt,
    instruction,
    connectionContext,
    nodes,
    generateImage,
  ]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "p" && selectedNodeId) {
        event.preventDefault();
        setShowPromptModal(true);
      }
      if (event.key === "Escape") {
        setShowPromptModal(false);
        setPrompt("");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedNodeId]);

  // Add file upload and delete handlers to existing nodes
  const nodesWithHandlers = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onFileUpload: handleFileUpload,
      onDeleteNode: handleDeleteNode,
      onAddNode: addNode,
      loadingProgress: node.data.isGenerating ? loadingProgress : undefined,
      nodeId: node.id,
    },
  }));

  return (
    <div className="h-screen w-screen relative bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4 relative">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-xl font-bold text-white">BASE0</h1>
              {/* <p className="text-xs text-white/50">by Canvas</p> */}
            </div>
          </div>
          <div>
            <WalletConnector />
          </div>
        </div>
      </div>

      {/* Central Content */}
      <div className="w-full h-full flex items-center justify-center pt-16">
        <div className="max-w-3xl w-full text-center p-10 relative">
          <div className="absolute -left-20 top-1/3 w-32 h-px bg-gradient-to-r from-white/0 to-white/40"></div>
          <div className="absolute -right-20 top-2/3 w-32 h-px bg-gradient-to-l from-white/0 to-white/40"></div>
          
          <h1 className="text-6xl font-bold text-white mt-20 mb-2">
            Easy Avatar Creation,
          </h1>
          <h1 className="text-6xl font-bold text-white mb-8">
            Zero Stress
          </h1>
          <p className="text-white/70 mb-10 max-w-md mx-auto">
            Smart AI assistant that takes care of your avatar generation needs.
          </p>
          
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setShowPromptModal(true)} 
              className="bg-white text-black hover:bg-white/90 rounded-full px-8 py-6"
            >
              Start Creating
            </Button>
          </div>
          
          <div className="mt-20 w-full h-40 relative overflow-hidden">
            <div className="absolute w-full h-40 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-xl"></div>
          </div>
        </div>
      </div>

      {/* Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-black/90 rounded-xl p-8 w-full max-w-md shadow-2xl border border-white/20">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white">
                  Generate Avatar
                </h3>
                {connectionContext && (
                  <p className="text-sm text-white/60 mt-2">
                    Objects will be combined
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handlePromptSubmit()
                    }
                    placeholder="Describe your avatar..."
                    className="w-full p-4 bg-black/40 border border-white/20 focus:border-white/50 focus:outline-none text-white rounded-lg text-sm"
                    autoFocus
                  />
                </div>

                {connectionContext && (
                  <div>
                    <input
                      type="text"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handlePromptSubmit()
                      }
                      placeholder="How should they interact with the object?"
                      className="w-full p-4 bg-black/40 border border-white/20 focus:border-white/50 focus:outline-none text-white rounded-lg text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handlePromptSubmit}
                  disabled={!prompt.trim()}
                  className="flex-1 bg-white text-black hover:bg-white/90 disabled:opacity-30 py-3 rounded-lg text-sm font-medium"
                >
                  Generate
                </button>
                <button
                  onClick={() => {
                    setShowPromptModal(false);
                    setPrompt("");
                    setInstruction("");
                    setConnectionContext(null);
                  }}
                  className="px-4 py-3 text-white/70 hover:text-white border border-white/20 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show ReactFlow when actively creating */}
      {nodes.length > 1 || edges.length > 0 ? (
        <div className="pt-16 h-screen">
          <ReactFlow
            nodes={nodesWithHandlers}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            style={{ background: "#111111", height: "calc(100vh - 64px)" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#333333"
            />
            <Controls
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              }}
            />
            <MiniMap
              nodeColor="#ffffff"
              nodeStrokeColor="#111111"
              nodeStrokeWidth={2}
              style={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              }}
            />
          </ReactFlow>
        </div>
      ) : null}
    </div>
  );
}

export default function Base0() {
  return (
    <ReactFlowProvider>
      <Base0Flow />
    </ReactFlowProvider>
  );
}