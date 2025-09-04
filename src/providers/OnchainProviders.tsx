'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';
import { WagmiProvider } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Base0 - AI Avatar Playground',
      preference: 'all', // Allow both Smart Wallet and regular Coinbase Wallet
    }),
    metaMask({
      dappMetadata: {
        name: 'Base0 - AI Avatar Playground',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        iconUrl: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

export function OnchainProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
          chain={baseSepolia} // Use baseSepolia for development, base for production
          config={{
            appearance: {
              mode: 'dark', // Matches your black theme
              theme: 'base',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
