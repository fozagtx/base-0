import { Synapse } from "@filoz/synapse-sdk";
import { config } from "@/config";

export type StorageCosts = {
  perEpoch: bigint;
  perDay: bigint;
  perMonth: bigint;
};

export const fetchPandoraStorageCosts = async (
  synapse: Synapse,
  size: number = 1024 * 1024
): Promise<StorageCosts> => {
  const preflightInfo = await synapse.storage.preflightUpload(size, {
    withCDN: config.withCDN,
  });

  return {
    perEpoch: preflightInfo.estimatedCost.perEpoch,
    perDay: preflightInfo.estimatedCost.perDay,
    perMonth: preflightInfo.estimatedCost.perMonth,
  };
};

export const checkAllowances = async (
  synapse: Synapse,
  fileSize: number
) => {
  try {
    const preflightInfo = await synapse.storage.preflightUpload(fileSize, {
      withCDN: config.withCDN,
    });

    return {
      isSufficient: true,
      estimatedCost: preflightInfo.estimatedCost,
    };
  } catch (error) {
    console.error("Error checking allowances:", error);
    return {
      isSufficient: false,
      estimatedCost: null,
    };
  }
};
