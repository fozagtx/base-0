import { CONTRACT_ADDRESSES } from "@filoz/synapse-sdk";

// Returns the warm storage service address for the given network
export const getPandoraServiceAddress = (
  network: "mainnet" | "calibration",
) => {
  return CONTRACT_ADDRESSES.WARM_STORAGE[network];
};

export const MAX_UINT256 = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

// 0.1 USDFC in wei (used for proof set creation fee)
export const PROOF_SET_CREATION_FEE = BigInt("100000000000000000"); // 0.1 * 10^18
