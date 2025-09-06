"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { WalletConnect } from "./WalletConnect";

export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isConnected, chainId } = useAccount();

  const {
    uploadFile,
    isUploading,
    uploadStatus,
    uploadedInfo,
    downloadFile,
    resetUpload,
  } = useFileUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        setFile(files[0]);
      }
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    uploadFile(file);
  }, [file, uploadFile]);

  const handleReset = useCallback(() => {
    setFile(null);
    resetUpload();
  }, [resetUpload]);

  const handleDownload = useCallback(async () => {
    if (!uploadedInfo) return;
    try {
      await downloadFile(uploadedInfo.pieceCid, uploadedInfo.fileName);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [uploadedInfo, downloadFile]);

  // Check if user is connected and on correct network
  const isFilecoinNetwork = chainId === 314 || chainId === 314159;

  if (!isConnected || !isFilecoinNetwork) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Upload to Filecoin</h2>

      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          accept="*/*"
        />

        {!file ? (
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-white mb-2">
                Drop a file here or click to select
              </p>
              <label
                htmlFor="file-input"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
              >
                Choose File
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">📄</div>
            <div>
              <p className="text-white font-medium">{file.name}</p>
              <p className="text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {!isUploading && !uploadedInfo && (
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleUpload}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Upload to Filecoin
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-6 space-y-4">
          <div className="bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadStatus.progress}%` }}
            />
          </div>
          <p className="text-white text-center">{uploadStatus.status}</p>
        </div>
      )}

      {/* Upload Success */}
      {uploadedInfo && uploadStatus.phase === "completed" && (
        <div className="mt-6 p-4 bg-green-800 rounded-lg">
          <h3 className="text-green-200 font-bold mb-2">
            ✅ Upload Successful!
          </h3>
          <div className="space-y-2 text-sm text-green-100">
            <div>
              <span className="font-medium">File:</span> {uploadedInfo.fileName}
            </div>
            <div>
              <span className="font-medium">Size:</span>{" "}
              {(uploadedInfo.fileSize / 1024 / 1024).toFixed(2)} MB
            </div>
            <div>
              <span className="font-medium">Piece CID:</span>{" "}
              {uploadedInfo.pieceCid}
            </div>
            {uploadedInfo.txHash && (
              <div>
                <span className="font-medium">Transaction:</span>{" "}
                <a
                  href={`https://calibration.filfox.info/en/tx/${uploadedInfo.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  View on Explorer
                </a>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadStatus.phase === "error" && (
        <div className="mt-6 p-4 bg-red-800 rounded-lg">
          <h3 className="text-red-200 font-bold mb-2">❌ Upload Failed</h3>
          <p className="text-red-100 text-sm">{uploadStatus.status}</p>
          <button
            onClick={handleReset}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
