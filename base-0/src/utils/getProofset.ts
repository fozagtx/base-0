import { JsonRpcSigner } from "ethers";

// Simplified for image upload only - proofset functionality disabled
export const getProofset = async (
  signer: JsonRpcSigner,
  network: "mainnet" | "calibration",
  address: string,
) => {
  console.warn("getProofset function is disabled for image-only storage");
  return { providerId: null, proofset: null };
};
