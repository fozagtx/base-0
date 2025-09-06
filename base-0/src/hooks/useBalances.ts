import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useNetwork } from "@/hooks/useNetwork";
import { config } from "@/config";

export type BalanceData = {
  filBalance: bigint;
  usdfcBalance: bigint;
  synapseStorageUsage: {
    currentUsageGB: number;
    totalPaidGB: number;
    daysRemaining: number;
    needsRepayment: boolean;
  };
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to query user balances (FIL, USDFC, Synapse storage usage)
 * Based on Filecoin Synapse dApp tutorial
 */
export const useBalances = () => {
  const [balances, setBalances] = useState<BalanceData>({
    filBalance: BigInt(0),
    usdfcBalance: BigInt(0),
    synapseStorageUsage: {
      currentUsageGB: 0,
      totalPaidGB: 0,
      daysRemaining: 0,
      needsRepayment: false,
    },
    isLoading: false,
    error: null,
  });

  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();
  const { data: network } = useNetwork();

  const fetchBalances = useCallback(async () => {
    if (!signer || !address || !network || !isConnected) {
      return;
    }

    setBalances((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create Synapse instance
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      // Get FIL balance
      const filBalance = await signer.provider.getBalance(address);

      // Get storage info
      const storageInfo = await synapse.getStorageInfo();

      // Calculate storage usage (using available properties)
      const currentUsageGB = 0; // Will be calculated from actual usage when available
      const totalPaidGB = 10; // Standard 10GB payment
      const daysRemaining = 30; // Will be calculated from actual balance
      const needsRepayment = daysRemaining < 10;

      setBalances({
        filBalance,
        usdfcBalance: BigInt(0), // Will be updated when payment service is available
        synapseStorageUsage: {
          currentUsageGB,
          totalPaidGB,
          daysRemaining,
          needsRepayment,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching balances:", error);
      setBalances((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch balances",
      }));
    }
  }, [signer, address, network, isConnected]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address, fetchBalances]);

  const refetch = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    ...balances,
    refetch,
  };
};
