"use client";

import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WalletConnector } from "@/components/WalletConnector";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [showPromptModal, setShowPromptModal] = useState(false);

  // Redirect to playground when wallet is connected
  useEffect(() => {
    if (isConnected) {
      router.push('/playground');
    }
  }, [isConnected, router]);


  return (
    <div className="h-screen w-screen overflow-x-hidden relative bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between p-4 relative">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-xl font-bold text-white">BASE0</h1>
            </div>
          </div>
          <div>
            <WalletConnector />
          </div>
        </div>
      </div>

      {/* Landing Page Content */}
      <div className="w-full h-full flex items-center justify-center pt-16">
        <div className="max-w-4xl w-full text-center p-10 relative">
          <div className="absolute -left-20 top-1/3 w-32 h-px bg-gradient-to-r from-white/0 to-white/40"></div>
          <div className="absolute -right-20 top-2/3 w-32 h-px bg-gradient-to-l from-white/0 to-white/40"></div>
          
          <h1 className="text-7xl font-bold text-white mt-20 mb-4">
            Easy Avatar Creation,
          </h1>
          <h1 className="text-7xl font-bold text-white mb-8">
            Zero Stress
          </h1>
          <p className="text-white/70 mb-12 max-w-2xl mx-auto text-lg">
            Smart AI assistant that takes care of your avatar generation needs. 
            Connect your wallet to get started with our Base-powered playground.
          </p>
          <Button className="cursor-pointer" onClick={() => router.push("/playground")}>Start Building</Button>
          
          {/* Wallet Connection CTA */}
          {/* <div className="flex flex-col items-center gap-6">
            <div className="text-white/50 text-sm mb-4">
              Connect with MetaMask or Coinbase Wallet to continue
            </div>
            
            {!isConnected ? (
              <div className="border border-white/20 rounded-2xl p-8 bg-white/5 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Choose Your Wallet
                </h3>
                <p className="text-white/60 mb-6 text-sm">
                  Connect your wallet to access the AI avatar playground
                </p>
                <WalletConnector />
              </div>
            ) : (
              <div className="border border-green-500/20 rounded-2xl p-8 bg-green-500/5 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-green-400 font-medium">Wallet Connected!</p>
                </div>
                <p className="text-white/60 text-sm">Redirecting to playground...</p>
              </div>
            )}
          </div> */}
          
          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-blue-400 rounded-sm"></div>
              </div>
              <h3 className="text-white font-semibold mb-2">AI-Powered</h3>
              <p className="text-white/60 text-sm">Advanced AI models for stunning avatar generation</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
              </div>
              <h3 className="text-white font-semibold mb-2">Base Network</h3>
              <p className="text-white/60 text-sm">Fast and low-cost transactions on Base L2</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-green-400 rounded-lg"></div>
              </div>
              <h3 className="text-white font-semibold mb-2">Easy Setup</h3>
              <p className="text-white/60 text-sm">No technical knowledge required</p>
            </div>
          </div>
          
          <div className="mt-20 w-full h-40 relative overflow-hidden">
            <div className="absolute w-full h-40 bg-gradient-to-b from-white/5 to-transparent rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}