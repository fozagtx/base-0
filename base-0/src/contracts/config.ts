// Filecoin network configuration for Base0 app
export const FILECOIN_NETWORKS = {
  calibration: {
    chainId: 314159,
    name: "Filecoin Calibration",
    nativeCurrency: {
      name: "Test Filecoin",
      symbol: "tFIL",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["https://api.calibration.node.glif.io/rpc/v1"],
      },
      public: {
        http: ["https://api.calibration.node.glif.io/rpc/v1"],
      },
    },
    blockExplorers: {
      default: {
        name: "Filfox Calibration",
        url: "https://calibration.filfox.info",
      },
    },
    faucet: "https://faucet.calibnet.chainsafe-fil.io",
  },
  filecoin: {
    chainId: 314,
    name: "Filecoin Mainnet",
    nativeCurrency: {
      name: "Filecoin",
      symbol: "FIL",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["https://api.node.glif.io/rpc/v1"],
      },
      public: {
        http: ["https://api.node.glif.io/rpc/v1"],
      },
    },
    blockExplorers: {
      default: {
        name: "Filfox",
        url: "https://filfox.info",
      },
    },
  },
} as const;

// Contract addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  calibration: {
    FilecoinCIDStore:
      process.env.NEXT_PUBLIC_CALIBRATION_CID_STORE_ADDRESS || "",
  },
  filecoin: {
    FilecoinCIDStore: process.env.NEXT_PUBLIC_FILECOIN_CID_STORE_ADDRESS || "",
  },
} as const;

export const DEFAULT_NETWORK = "calibration";

// MetaMask network addition helper
export const addFilecoinNetwork = async (
  network: "calibration" | "filecoin"
) => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${FILECOIN_NETWORKS[network].chainId.toString(16)}`,
            chainName: FILECOIN_NETWORKS[network].name,
            nativeCurrency: FILECOIN_NETWORKS[network].nativeCurrency,
            rpcUrls: [FILECOIN_NETWORKS[network].rpcUrls.default.http[0]],
            blockExplorerUrls: [
              FILECOIN_NETWORKS[network].blockExplorers.default.url,
            ],
          },
        ],
      });
    } catch (error) {
      console.error("Error adding Filecoin network:", error);
      throw error;
    }
  }
};

// Switch to Filecoin network
export const switchToFilecoinNetwork = async (
  network: "calibration" | "filecoin"
) => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          { chainId: `0x${FILECOIN_NETWORKS[network].chainId.toString(16)}` },
        ],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        await addFilecoinNetwork(network);
      } else {
        throw switchError;
      }
    }
  }
};
