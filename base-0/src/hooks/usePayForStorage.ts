import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useAccount } from "wagmi";
import { useNetwork } from "@/hooks/useNetwork";
import { config } from "@/config";
import { ethers } from "ethers";

type PaymentStatus = {
  status: string;
  progress: number;
  txHash?: string;
};

/**
 * Hook to pay for storage using USDFC tokens
 * Handles one-time payment for 10GB usage that persists 30 days
 * Based on Filecoin Synapse dApp tutorial
 */
export const usePayForStorage = () => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: "",
    progress: 0,
  });

  const signer = useEthersSigner();
  const { address } = useAccount();
  const { data: network } = useNetwork();

  // Helper function to get a working signer
  const getWorkingSigner = async (): Promise<ethers.Signer> => {
    // First try the wagmi signer
    if (signer) {
      console.log("✅ Using wagmi signer");
      return signer;
    }

    console.log(
      "🔄 Wagmi signer not available, trying direct MetaMask connection..."
    );

    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
    }

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" });

    // Create direct provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const directSigner = await provider.getSigner();

    console.log("✅ Using direct MetaMask signer");
    return directSigner;
  };

  const paymentMutation = useMutation({
    mutationKey: ["pay-for-storage", address],
    mutationFn: async () => {
      console.log("🔍 Payment mutation started!");
      console.log("  - signer:", !!signer);
      console.log("  - address:", address);
      console.log("  - network:", network);

      if (!address) {
        const error = "Wallet not connected - no address available";
        console.error("❌ Payment prerequisites failed:", error);
        throw new Error(error);
      }

      setPaymentStatus({
        status: "🔄 Connecting to wallet...",
        progress: 5,
      });

      // Get a working signer
      let finalSigner: ethers.Signer;
      try {
        finalSigner = await getWorkingSigner();
      } catch (signerError) {
        const error =
          "Failed to connect to MetaMask. Please:\n\n1. Make sure MetaMask is unlocked\n2. Approve the connection request\n3. Try refreshing the page";
        console.error("❌ Signer connection failed:", signerError);
        throw new Error(error);
      }

      console.log("✅ Prerequisites passed, starting payment flow...");

      setPaymentStatus({
        status: "🚀 Initializing payment for storage...",
        progress: 10,
      });

      // Create Synapse instance
      console.log("🔧 Creating Synapse instance...");
      let synapse;
      try {
        synapse = await Synapse.create({
          signer: finalSigner,
          withCDN: config.withCDN,
        });
        console.log("✅ Synapse instance created successfully");
      } catch (synapseError) {
        console.error("❌ Failed to create Synapse instance:", synapseError);
        throw synapseError;
      }

      setPaymentStatus({
        status: "💰 Calculating storage costs...",
        progress: 20,
      });

      // Calculate cost for 10GB storage for 30 days
      // Note: API has 200MB limit, so calculate for 100MB and extrapolate to 10GB
      const sampleSize = 100 * 1024 * 1024; // 100MB in bytes (safely under 200MB limit)
      const targetSize = 10 * 1024 * 1024 * 1024; // 10GB in bytes
      const multiplier = targetSize / sampleSize; // How many 100MB chunks = 10GB

      console.log(
        `📊 Calculating costs: ${sampleSize / (1024 * 1024)}MB sample → ${
          targetSize / (1024 * 1024 * 1024)
        }GB target (${multiplier}x multiplier)`
      );

      const preflightInfo = await synapse.storage.preflightUpload(sampleSize, {
        withCDN: config.withCDN,
      });

      // Scale up the costs to 10GB equivalent
      const scaledCosts = {
        perDay:
          preflightInfo.estimatedCost.perDay * BigInt(Math.ceil(multiplier)),
        perEpoch:
          preflightInfo.estimatedCost.perEpoch * BigInt(Math.ceil(multiplier)),
        perMonth:
          preflightInfo.estimatedCost.perMonth * BigInt(Math.ceil(multiplier)),
      };

      // Calculate deposit amount for 30 days
      const depositAmount = scaledCosts.perDay * BigInt(30);

      console.log("💰 Cost breakdown:");
      console.log(
        `  - Sample (100MB): ${ethers.formatUnits(
          preflightInfo.estimatedCost.perDay,
          18
        )} USDFC/day`
      );
      console.log(
        `  - Scaled (10GB): ${ethers.formatUnits(
          scaledCosts.perDay,
          18
        )} USDFC/day`
      );
      console.log(
        `  - 30-day deposit: ${ethers.formatUnits(depositAmount, 18)} USDFC`
      );

      setPaymentStatus({
        status: `💳 Depositing ${ethers.formatUnits(
          depositAmount,
          18
        )} USDFC...`,
        progress: 30,
      });

      // Deposit USDFC to cover storage costs
      const depositTx = await synapse.payments.deposit(depositAmount, "USDFC", {
        onDepositStarting: () => {
          setPaymentStatus({
            status: "💰 Starting USDFC deposit...",
            progress: 40,
          });
        },
        onAllowanceCheck: (current: bigint, required: bigint) => {
          const sufficient = current >= required;
          setPaymentStatus({
            status: `💰 Allowance check: ${
              sufficient ? "✓ Sufficient" : "❌ Insufficient"
            }`,
            progress: 50,
          });
        },
        onApprovalTransaction: async (tx: ethers.TransactionResponse) => {
          setPaymentStatus({
            status: `💰 Approving USDFC... Please confirm in MetaMask`,
            progress: 60,
            txHash: tx.hash,
          });
          await tx.wait();
          setPaymentStatus({
            status: "💰 USDFC approved successfully",
            progress: 70,
            txHash: tx.hash,
          });
        },
      });

      setPaymentStatus({
        status: `🔗 Confirming deposit transaction...`,
        progress: 80,
      });

      const depositReceipt = await depositTx.wait();

      setPaymentStatus({
        status: "💰 USDFC deposited successfully",
        progress: 85,
        txHash: depositReceipt?.hash,
      });

      // Approve storage service to spend USDFC
      setPaymentStatus({
        status: "🔐 Approving storage service...",
        progress: 90,
      });

      const storageAddress = synapse.getWarmStorageAddress();
      const approvalTx = await synapse.payments.approveService(
        storageAddress,
        scaledCosts.perEpoch, // rate allowance (scaled for 10GB)
        depositAmount, // lockup allowance
        depositAmount // max lockup period
      );

      await approvalTx.wait();

      setPaymentStatus({
        status: "🎉 Storage payment completed successfully!",
        progress: 100,
        txHash: approvalTx.hash,
      });

      return {
        depositAmount,
        storageGB: 10,
        durationDays: 30,
        txHash: approvalTx.hash,
      };
    },
    onError: (error) => {
      console.error("Payment failed:", error);
      setPaymentStatus({
        status: `❌ Payment failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        progress: 0,
      });
    },
  });

  const resetStatus = () => {
    setPaymentStatus({ status: "", progress: 0 });
  };

  return {
    payForStorage: paymentMutation.mutate,
    isPaymentLoading: paymentMutation.isPending,
    paymentStatus,
    paymentError: paymentMutation.error,
    resetStatus,
  };
};
