"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig } from "wagmi";
import { WagmiProvider } from "wagmi";
import { metaMask, walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

const queryClient = new QueryClient();

// Define Filecoin Mainnet chain
const filecoinMainnet = defineChain({
  id: 314,
  name: "Filecoin Mainnet",
  nativeCurrency: { name: "Filecoin", symbol: "FIL", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://api.node.glif.io/rpc/v1"],
    },
  },
  blockExplorers: {
    default: {
      name: "Filfox",
      url: "https://filfox.info/en",
    },
  },
});

// Define Filecoin Calibration testnet chain
const filecoinCalibration = defineChain({
  id: 314159,
  name: "Filecoin Calibration",
  nativeCurrency: { name: "Test Filecoin", symbol: "tFIL", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://api.calibration.node.glif.io/rpc/v1"],
    },
  },
  blockExplorers: {
    default: {
      name: "Calibration Filfox",
      url: "https://calibration.filfox.info/en",
    },
  },
  testnet: true,
});

const wagmiConfig = createConfig({
  chains: [filecoinCalibration, filecoinMainnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Filecoin Image Upload dApp",
        url: typeof window !== "undefined" ? window.location.origin : "",
        iconUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/favicon.ico`
            : "",
      },
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
      metadata: {
        name: "Filecoin Image Upload dApp",
        description: "Upload images to Filecoin using Synapse",
        url: typeof window !== "undefined" ? window.location.origin : "",
        icons: [
          typeof window !== "undefined"
            ? `${window.location.origin}/favicon.ico`
            : "",
        ],
      },
    }),
  ],
  transports: {
    [filecoinMainnet.id]: http("https://api.node.glif.io/rpc/v1"),
    [filecoinCalibration.id]: http(
      "https://api.calibration.node.glif.io/rpc/v1"
    ),
  },
});

export function OnchainProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
