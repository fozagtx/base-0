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

const nodeTypes: NodeTypes = {
  imageNode: ImageNode,
};

const initialNodes: Node<ImageNodeData>[] = [
  {
    id: "1",
    type: "imageNode",
    position: { x: 100, y: 100 },
    data: { nodeType: "avatar", nodeId: "1" },
  },
  {
    id: "2",
    type: "imageNode",
    position: { x: 400, y: 200 },
    data: { nodeType: "avatar", nodeId: "2" },
  },
  {
    id: "3",
    type: "imageNode",
    position: { x: 700, y: 100 },
    data: { nodeType: "upload", nodeId: "3" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    style: { stroke: "#000000", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    style: { stroke: "#000000", strokeWidth: 2 },
  },
];

function Base0Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isConnected, setIsConnected] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [connectionContext, setConnectionContext] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      // Add edge first
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#000000", strokeWidth: 2 },
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
    setIsConnected(!isConnected);
  }, [isConnected]);

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

      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, instruction, baseObject }),
        });

        const result = await response.json();

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
      } catch (error) {
        console.error("Failed to generate image:", error);
        setNodes((nds) =>
          nds.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, isGenerating: false } }
              : node,
          ),
        );
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
      nodeId: node.id,
    },
  }));

  return (
    <div className="h-screen w-screen relative bg-white">
      {/* Blur Header Modal */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-black/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-xl font-bold text-black">Base0</h1>
              <p className="text-xs text-black/70">AI Avatar Playground</p>
            </div>
            <div className="text-xs text-black/50">
              Click node → Press P → Generate
            </div>
            <div className="flex gap-2">
              <Button
                onClick={connectWallet}
                className={`shadow-sm shadow-black/10 text-sm ${
                  isConnected
                    ? "bg-white text-black border border-black hover:bg-black/5"
                    : "bg-black text-white hover:bg-black/90"
                }`}
              >
                {isConnected ? "Connected" : "Connect Wallet"}
              </Button>
              <Button
                onClick={addNode}
                className="bg-black text-white hover:bg-black/90 shadow-sm shadow-black/10 w-8 h-8 p-0 text-lg"
              >
                +
              </Button>
            </div>
          </div>
        </div>

        {showPromptModal && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-black">
                    Generate Avatar
                  </h3>
                  {connectionContext && (
                    <p className="text-xs text-black/60 mt-1">
                      Objects will be combined
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your avatar..."
                      className="w-full p-3 border border-black/20 focus:border-black focus:outline-none text-black rounded-lg text-sm"
                      autoFocus
                    />
                  </div>

                  {connectionContext && (
                    <div>
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="How should they interact with the object?"
                        className="w-full p-3 border border-black/20 focus:border-black focus:outline-none text-black rounded-lg text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePromptSubmit}
                    disabled={!prompt.trim()}
                    className="flex-1 bg-black text-white hover:bg-black/90 disabled:opacity-50 py-3 rounded-lg text-sm font-medium"
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
                    className="px-4 py-3 text-black/70 hover:text-black text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-20">
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
            style={{ background: "#ffffff", height: "calc(100vh - 80px)" }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e5e5"
            />
            <Controls
              style={{
                background: "#ffffff",
                border: "2px solid #000000",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            />
            <MiniMap
              nodeColor="#000000"
              nodeStrokeColor="#ffffff"
              nodeStrokeWidth={2}
              style={{
                background: "#ffffff",
                border: "2px solid #000000",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            />
            <Panel position="bottom-center">
              <div className="bg-white border border-black/20 p-3 shadow-sm shadow-black/10 rounded">
                <p className="text-black text-xs font-mono">
                  Click node → Press P → Enter prompt → Generate AI avatar
                </p>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
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
