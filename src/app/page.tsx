"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BentoGrid from "@/components/BentoGrid";

// Dynamically import Dither to avoid SSR issues with Three.js
const Dither = dynamic(() => import("@/components/Dither"), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-900" />,
});

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Dither Background */}
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={[0.2, 0.3, 0.5]}
          disableAnimation={false}
          enableMouseInteraction={true}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-white">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-20 p-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full"></div>
              </div>
              <span className="text-xl font-bold text-white">Base0</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8 text-sm text-white/70">
              <a
                href="#features"
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About
              </a>
              <button
                onClick={handleGetStarted}
                className="bg-white text-black px-4 py-2 rounded-full hover:bg-white/90 transition-colors font-medium"
              >
                Get Started
              </button>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="text-center space-y-8 max-w-4xl mx-auto pt-32 md:pt-40">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              Create AI
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Avatars That Sell
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              The next generation AI avatar playground for B2B and B2C
              businesses.
            </p>
          </div>
        </div>

        {/* Bento Grid Features Section */}
        <div id="features" className="w-full mt-16 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powered by{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Innovation
              </span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Experience the future of AI-powered creativity with cutting-edge
              models and tools
            </p>
          </div>
          <BentoGrid />
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 p-6 bg-black/20 backdrop-blur-sm">
        <div className="flex justify-center items-center text-white/50 text-sm">
          <p>© 2025 Base0. Powered by AI and Web3.</p>
        </div>
      </footer>
    </div>
  );
}
