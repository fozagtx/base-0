import { getPandoraServiceAddress } from "@/utils";
import { Synapse } from "@filoz/synapse-sdk";
import { config } from "@/config";
import { ethers } from "ethers";
import { checkAllowances } from "./pandoraUtils";

/**
 * Simplified preflight check for image upload
 */
export const preflightCheck = async (
  file: File,
  synapse: Synapse,
  network: "mainnet" | "calibration",
  includeProofsetCreationFee: boolean,
  updateStatus: (status: string) => void,
  updateProgress: (progress: number) => void,
) => {
  const signer = synapse.getSigner();
  if (!signer) throw new Error("Signer not found");
  if (!signer.provider) throw new Error("Provider not found");

  updateStatus("💰 Checking storage costs and balances...");
  updateProgress(10);

  // Check if we have sufficient allowances for the file
  const allowanceCheck = await checkAllowances(synapse, file.size);

  if (!allowanceCheck.isSufficient && allowanceCheck.estimatedCost) {
    updateStatus("💰 Insufficient balance, preparing deposit...");

    try {
      // Estimate deposit amount needed
      const depositAmount =
        allowanceCheck.estimatedCost.perDay *
        BigInt(config.persistencePeriod || 30);

      updateStatus("💰 Depositing USDFC to cover storage costs...");
      const depositTx = await synapse.payments.deposit(depositAmount, "USDFC", {
        onDepositStarting: () => updateStatus("💰 Starting USDFC deposit..."),
        onAllowanceCheck: (current: bigint, required: bigint) =>
          updateStatus(
            `💰 Checking allowance: ${current >= required ? "✓" : "insufficient"}`,
          ),
        onApprovalTransaction: async (tx: ethers.TransactionResponse) => {
          updateStatus(`💰 Approving USDFC... ${tx.hash}`);
          const receipt = await tx.wait();
          updateStatus(`💰 USDFC approved ${receipt?.hash}`);
        },
      });

      await depositTx.wait();
      updateStatus("💰 USDFC deposited successfully");
      updateProgress(15);

      // Approve service to spend
      updateStatus("💰 Approving storage service spending...");
      const serviceAddress = getPandoraServiceAddress(network);
      const approvalTx = await synapse.payments.approveService(
        serviceAddress,
        allowanceCheck.estimatedCost.perEpoch,
        depositAmount,
        depositAmount, // maxLockupPeriod parameter
      );

      await approvalTx.wait();
      updateStatus("💰 Storage service approved");
      updateProgress(20);
    } catch (error) {
      console.error("Preflight check failed:", error);
      throw new Error(
        `Failed to prepare payment: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  } else {
    updateStatus("💰 Sufficient balance available");
    updateProgress(20);
  }
};
