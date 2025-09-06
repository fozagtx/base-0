import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useAccount } from "wagmi";
import { useNetwork } from "@/hooks/useNetwork";
import { config } from "@/config";

export type UploadedInfo = {
  fileName: string;
  fileSize: number;
  pieceCid: string;
  txHash?: string;
  downloadUrl?: string;
};

export type UploadStatus = {
  status: string;
  progress: number;
  phase: "preparing" | "uploading" | "confirming" | "completed" | "error";
};

/**
 * Hook to upload files to Filecoin using Synapse SDK
 * Based on Filecoin Synapse dApp tutorial
 */
export const useFileUpload = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "",
    progress: 0,
    phase: "preparing",
  });
  const [uploadedInfo, setUploadedInfo] = useState<UploadedInfo | null>(null);

  const signer = useEthersSigner();
  const { address, chainId } = useAccount();
  const { data: network } = useNetwork();

  const uploadMutation = useMutation({
    mutationKey: ["file-upload", address, chainId],
    mutationFn: async (file: File) => {
      console.log("Upload debug info:", {
        signer: !!signer,
        address,
        chainId,
        network,
      });

      if (!signer)
        throw new Error(
          "Signer not found. Please make sure your wallet is connected to a Filecoin network.",
        );
      if (!address)
        throw new Error(
          "Wallet address not found. Please connect your wallet.",
        );
      if (!chainId)
        throw new Error(
          "Chain ID not found. Please switch to Filecoin network.",
        );
      if (!network)
        throw new Error(
          "Network not found. Please check your network connection.",
        );

      setUploadStatus({
        status: "🔄 Preparing file for upload to Filecoin...",
        progress: 0,
        phase: "preparing",
      });
      setUploadedInfo(null);

      // Convert File to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);

      setUploadStatus({
        status: "⚙️ Creating Synapse instance...",
        progress: 10,
        phase: "preparing",
      });

      // Create Synapse instance
      const synapse = await Synapse.create({
        signer,
        disableNonceManager: false,
        withCDN: config.withCDN,
      });

      setUploadStatus({
        status: "💰 Checking storage balance and allowances...",
        progress: 20,
        phase: "preparing",
      });

      // Preflight check
      try {
        await synapse.storage.preflightUpload(file.size, {
          withCDN: config.withCDN,
        });
      } catch (error) {
        throw new Error(
          "Insufficient storage balance. Please pay for storage first.",
        );
      }

      setUploadStatus({
        status: "📁 Starting file upload to Filecoin...",
        progress: 40,
        phase: "uploading",
      });

      // Upload file using storage manager
      const uploadResult = await synapse.storage.upload(uint8ArrayBytes, {
        callbacks: {
          onUploadComplete: (pieceCid) => {
            setUploadStatus({
              status: "📊 File uploaded successfully!",
              progress: 80,
              phase: "confirming",
            });

            setUploadedInfo({
              fileName: file.name,
              fileSize: file.size,
              pieceCid: pieceCid.toString(),
            });
          },
        },
      });

      // Final update
      const finalInfo: UploadedInfo = {
        fileName: file.name,
        fileSize: file.size,
        pieceCid: uploadResult.pieceCid.toString(),
        downloadUrl: `https://api.synapse.storage/piece/${uploadResult.pieceCid}`,
      };

      setUploadedInfo(finalInfo);

      setUploadStatus({
        status: "🎉 File successfully stored on Filecoin!",
        progress: 100,
        phase: "completed",
      });

      return finalInfo;
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setUploadStatus({
        status: `❌ Upload failed: ${error.message || "Please try again"}`,
        progress: 0,
        phase: "error",
      });
    },
  });

  const downloadFile = async (pieceCid: string, fileName: string) => {
    if (!signer) throw new Error("Signer not found");

    try {
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      const data = await synapse.download(pieceCid, {
        withCDN: config.withCDN,
      });

      // Create download link - fix Blob type issue
      const blob = new Blob([new Uint8Array(data)]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  };

  const resetUpload = () => {
    setUploadStatus({
      status: "",
      progress: 0,
      phase: "preparing",
    });
    setUploadedInfo(null);
  };

  return {
    uploadFile: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadStatus,
    uploadedInfo,
    uploadError: uploadMutation.error,
    downloadFile,
    resetUpload,
  };
};
