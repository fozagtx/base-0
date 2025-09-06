import { Synapse } from "@filoz/synapse-sdk";

/**
 * Utility functions for storage operations
 * Based on Filecoin Synapse dApp tutorial
 */

export const formatStorageSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatBalance = (balance: bigint, decimals: number = 18): string => {
  const balanceStr = balance.toString();
  const decimalPos = balanceStr.length - decimals;

  if (decimalPos <= 0) {
    return '0.' + '0'.repeat(-decimalPos) + balanceStr;
  }

  const integerPart = balanceStr.slice(0, decimalPos);
  const decimalPart = balanceStr.slice(decimalPos);

  return integerPart + '.' + decimalPart.slice(0, 4);
};

export const calculateDaysFromBalance = (
  balance: bigint,
  dailyRate: bigint
): number => {
  if (dailyRate === BigInt(0)) return 0;
  return Math.floor(Number(balance / dailyRate));
};

export const isStorageBalanceSufficient = (
  currentUsageGB: number,
  paidStorageGB: number,
  daysRemaining: number
): { sufficient: boolean; message: string } => {
  if (currentUsageGB > paidStorageGB) {
    return {
      sufficient: false,
      message: `Usage (${currentUsageGB.toFixed(2)}GB) exceeds paid storage (${paidStorageGB}GB)`,
    };
  }

  if (daysRemaining < 10) {
    return {
      sufficient: false,
      message: `Storage expires in ${daysRemaining} days. Please renew to continue uploading.`,
    };
  }

  return {
    sufficient: true,
    message: `Storage valid for ${daysRemaining} more days`,
  };
};

export const getNetworkConfig = (network: "mainnet" | "calibration") => {
  return {
    name: network === "mainnet" ? "Filecoin Mainnet" : "Filecoin Calibration",
    chainId: network === "mainnet" ? 314 : 314159,
    explorer: network === "mainnet"
      ? "https://filfox.info/en/tx/"
      : "https://calibration.filfox.info/en/tx/",
    faucet: network === "calibration"
      ? "https://faucet.calibration.fildev.network/"
      : null,
  };
};
