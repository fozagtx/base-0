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
import { ImageGeneratorNode } from "@/components/nodes/ImageGeneratorNode";
import { PreviewImageNode } from "@/components/nodes/PreviewImageNode";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSynapseStorage } from "@/hooks/useSynapseStorage";
import { usePayForStorage } from "@/hooks/usePayForStorage";
import { useBalances } from "@/hooks/useBalances";
import { UserPrompt, GeneratedImage } from "@/types/prompt";
import { Button } from "@/components/ui/button";
import { WalletInfo } from "@/components/WalletInfo";

const nodeTypes: NodeTypes = {
  imageGenerator: ImageGeneratorNode,
  previewImage: PreviewImageNode,
};

const initialNodes: Node[] = [
  {
    id: "generator-1",
    type: "imageGenerator",
    position: { x: 100, y: 100 },
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
    position: { x: 550, y: 150 },
    data: { title: "Preview Image" },
  },
];

const initialEdges: Edge[] = [
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
  const [mounted, setMounted] = useState(false);
  const [storageInitialized, setStorageInitialized] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const { isConnected, address } = useAccount();
  const router = useRouter();

  // Use the custom hook for image generation
  const { generateImage, isGenerating, error } = useImageGeneration();

  // Use the enhanced storage hook
  const {
    savePrompt,
    saveGeneratedImage,
    isStoring,
    initializeStorage,
    storePromptOnFilecoin,
    retrievePromptFromFilecoin,
    storedPromptCids,
  } = useSynapseStorage();

  const { payForStorage, isPaymentLoading, paymentStatus, paymentError } =
    usePayForStorage();

  const {
    synapseStorageUsage,
    isLoading: balancesLoading,
    error: balancesError,
  } = useBalances();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize storage when component mounts
  useEffect(() => {
    if (isConnected && mounted && typeof initializeStorage === "function") {
      initializeStorage()
        .then(() => {
          setStorageInitialized(true);
          setStorageError(null);
        })
        .catch((err) => {
          console.warn("Storage initialization failed:", err);
          // Check if it's a network error
          if (err.message?.includes("Unsupported network")) {
            setStorageError(
              "Synapse storage requires Filecoin network. Currently using localStorage for data persistence."
            );
          }
          // The app will continue to work with localStorage fallback
        });
    }
  }, [isConnected, mounted, initializeStorage]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: Edge[]) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#ffffff", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
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
              : node
          )
        );

        // Find connected image generator nodes and update them with base image
        const connectedEdges = edges.filter(
          (edge: Edge) =>
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
                    },
                  }
                : node
            )
          );
        });
      };
      reader.readAsDataURL(file);
    },
    [setNodes, edges]
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
      } = {}
    ) => {
      // Set generating state
      setNodes((nds: Node[]) =>
        nds.map((node: Node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, isGenerating: true } }
            : node
        )
      );

      // Set loading state on connected preview nodes
      const connectedEdges = edges.filter(
        (edge: Edge) => edge.source === nodeId
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
              : node
          )
        );
      });

      try {
        // Find connected base image if any
        const connectedImageEdge = edges.find(
          (edge: Edge) =>
            edge.target === nodeId && edge.targetHandle === "baseImage"
        );

        let baseImageUrl = options.baseImageUrl;
        if (connectedImageEdge) {
          const sourceNode = nodes.find(
            (node: Node) => node.id === connectedImageEdge.source
          );
          if (sourceNode?.data?.imageUrl) {
            baseImageUrl = sourceNode.data.imageUrl;

            // Update the generator node to show the base image
            setNodes((nds: Node[]) =>
              nds.map((node: Node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, baseImageUrl } }
                  : node
              )
            );
          }
        }

        // Modify prompt to include base image context if available
        let enhancedPrompt = prompt;
        if (baseImageUrl) {
          enhancedPrompt = `Create a lifestyle avatar holding, using, or interacting with the product/item shown in the reference image. ${prompt}`;
        }

        console.log("Generating image with prompt:", enhancedPrompt);
        console.log("Base image URL:", baseImageUrl);

        // Use the hook to generate the image
        const result = await generateImage(enhancedPrompt, {
          ...options,
          baseImageUrl, // Pass the base image URL
        });

        if (result) {
          console.log("Image generation successful:", result.imageUrl);

          // ✅ IMMEDIATELY update UI to show success (before storage attempts)
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
                : node
            )
          );

          // Update connected preview nodes immediately too
          const connectedEdges = edges.filter(
            (edge: Edge) => edge.source === nodeId
          );
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
                        prompt: enhancedPrompt,
                      },
                    }
                  : node
              )
            );
          });

          // Save prompt to storage
          const promptToSave: UserPrompt = {
            id: `prompt_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            prompt: prompt,
            enhancedPrompt: enhancedPrompt,
            userId: address || "",
            timestamp: Date.now(),
            baseImageUrl,
            metadata: {
              width: options.width || 512,
              height: options.height || 512,
              version: options.image_generator_version || "standard",
              preference: options.genius_preference || "photography",
            },
          };

          // Save generated image to storage
          const imageToSave: GeneratedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            imageUrl: result.imageUrl,
            promptId: promptToSave.id,
            userId: address || "",
            timestamp: Date.now(),
            deepaiId: (result.metadata?.id as string) || "",
            metadata: {
              ...result.metadata,
              ...options,
              baseImageUrl,
              nodeId: nodeId,
            },
          };

          // Check if user has paid for storage before attempting Filecoin storage
          console.log("💰 Checking storage status...");
          console.log("  - synapseStorageUsage:", synapseStorageUsage);
          console.log("  - balancesLoading:", balancesLoading);

          const hasSufficientStorage =
            synapseStorageUsage && !synapseStorageUsage.needsRepayment;

          if (!hasSufficientStorage && !balancesLoading) {
            console.log(
              "❌ Insufficient storage balance. User needs to pay first."
            );
            alert(
              "⚠️ Payment Required!\n\nYou need to pay for Filecoin storage before storing prompts.\n\nClick the '💳 Pay for Storage' button to continue."
            );

            // Save locally only without Filecoin storage
            savePrompt(promptToSave).catch((err) =>
              console.error("Failed to save prompt locally:", err)
            );
            return; // Don't attempt Filecoin storage
          }

          // Store prompt on Filecoin (user has sufficient balance)
          console.log(
            "🚀 User has sufficient balance. Storing prompt on Filecoin..."
          );
          console.log("Prompt data:", promptToSave);

          // Small delay to help with signer timing issues
          console.log("⏳ Brief delay to ensure signer is ready...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            const promptStorageResult = await storePromptOnFilecoin(
              promptToSave
            );
            console.log("✅ Prompt stored on Filecoin:", promptStorageResult);

            // Update the prompt with the CID
            const promptWithCid = {
              ...promptToSave,
              cid: promptStorageResult.cid,
              filecoinUrl: promptStorageResult.downloadUrl,
            };

            // Save updated prompt locally
            savePrompt(promptWithCid).catch((err) =>
              console.error("Failed to save prompt locally:", err)
            );
          } catch (storageErr) {
            console.error("❌ Prompt storage on Filecoin failed:", storageErr);

            // Check if error is payment-related
            const errorMessage =
              storageErr instanceof Error
                ? storageErr.message
                : String(storageErr);
            if (
              errorMessage.includes("Failed to create data set") ||
              errorMessage.includes("contract reverted")
            ) {
              console.log(
                "💳 Payment required for storage. Please pay for storage first."
              );
              alert(
                "⚠️ Payment Required!\n\nYou need to pay for Filecoin storage before storing prompts.\n\nClick 'Pay for Storage' button to continue."
              );
              // Don't fallback to local storage for payment errors
              return;
            }

            // Check if error is signer timing issue (very common with wagmi)
            if (
              errorMessage.includes("Signer") ||
              errorMessage.includes("timing issue")
            ) {
              console.log(
                "🔄 Signer timing issue detected - this is common with wagmi hooks"
              );
              alert(
                "🔄 Wallet Connection Timing Issue\n\n" +
                  "This is a common issue. Your image was generated successfully!\n\n" +
                  "To store on Filecoin:\n" +
                  "• Wait 5-10 seconds and try generating another image\n" +
                  "• Or refresh the page (Ctrl+F5) and try again\n\n" +
                  "Your prompt was saved locally."
              );
            }

            // Fallback to local storage for other errors
            savePrompt(promptToSave).catch((err) =>
              console.error("Failed to save prompt locally:", err)
            );
          }

          // Save generated image locally (not on Filecoin)
          saveGeneratedImage(imageToSave).catch((err) =>
            console.error("Failed to save image locally:", err)
          );

          // Just update the generator node with storage info (UI already updated above)
          setNodes((nds: Node[]) =>
            nds.map((node: Node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      savedPromptId: promptToSave.id,
                      savedImageId: imageToSave.id,
                    },
                  }
                : node
            )
          );
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
              : node
          )
        );
      }
    },
    [generateImage, error, edges, setNodes]
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
        }))
      );
    },
    [setNodes]
  );

  // Redirect to login if wallet is not connected
  useEffect(() => {
    if (mounted && !isConnected) {
      router.push("/");
    }
  }, [mounted, isConnected, router]);

  // Show loading state while checking connection or mounting
  if (!mounted || !isConnected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">
          {!mounted ? "Loading..." : "Checking wallet connection..."}
        </div>
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
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex gap-3">
          <WalletInfo />
          <Button
            onClick={() => window.open("/history", "_blank")}
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white"
            size="sm"
          >
            View History
          </Button>
        </div>

        {/* Payment for Storage */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              console.log("💳 Payment button clicked!");
              console.log("🔍 Payment prerequisites check:");
              console.log("  - isConnected:", isConnected);
              console.log("  - isPaymentLoading:", isPaymentLoading);
              console.log("  - synapseStorageUsage:", synapseStorageUsage);

              if (!isConnected) {
                alert("Please connect your wallet first!");
                return;
              }

              console.log("🚀 Calling payForStorage()...");
              payForStorage();
            }}
            disabled={isPaymentLoading || !isConnected}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            {isPaymentLoading ? "Processing..." : "💳 Pay for Storage"}
          </Button>
          {paymentStatus.status && (
            <div className="text-xs text-gray-300 bg-black/70 p-2 rounded max-w-xs">
              {paymentStatus.status}
              {paymentStatus.progress > 0 && (
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div
                    className="bg-purple-500 h-1 rounded-full transition-all"
                    style={{ width: `${paymentStatus.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
          {paymentError && (
            <div className="text-xs text-red-400 bg-black/70 p-2 rounded max-w-xs">
              Error: {paymentError.message}
            </div>
          )}
        </div>
      </div>

      {/* Storage status notification */}
      {mounted && storageError && (
        <div className="absolute top-16 right-4 left-4 md:left-auto md:max-w-lg z-10 bg-yellow-600 text-white px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <div className="text-yellow-200">ℹ️</div>
            <div className="text-sm">
              <p className="font-medium mb-1">Network Notice</p>
              <p className="mb-2">{storageError}</p>
              <p className="text-xs opacity-90">
                For full Filecoin storage features, switch to Filecoin network
                in your wallet. Your data is still being saved locally.
              </p>
            </div>
          </div>
        </div>
      )}

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
