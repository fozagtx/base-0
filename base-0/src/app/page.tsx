"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/login");
  };

  return (
    <div
      className="w-full h-screen overflow-hidden bg-gray-900 flex flex-col"
      style={{ background: "#1a1a1a" }}
    >
      {/* Header */}
      <header className="flex-shrink-0 mx-4 md:mx-6 mt-3 md:mt-4 z-10">
        <div className="bg-[#1D1D1D]/90 backdrop-blur-md border border-white/10 rounded-xl max-w-xs sm:max-w-sm md:max-w-md mx-auto px-3 md:px-4 flex items-center justify-between h-11 md:h-12">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 md:w-3.5 md:h-3.5 bg-black rounded-full"></div>
            </div>
            <span className="text-base md:text-lg font-medium text-white">
              Base0
            </span>
          </div>

          {/* Navbar */}
          <nav className="flex items-center">
            <button
              onClick={handleGetStarted}
              className="px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-center rounded-lg text-xs md:text-sm bg-white text-black hover:bg-gray-100 font-medium transition-colors"
            >
              Connect
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white">
        <div className="text-center space-y-6 md:space-y-8 max-w-4xl mx-auto">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold tracking-tight leading-none">
              Marketing that
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                runs everywhere
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              The native onchain marketing studio built for B2B SaaS
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 p-3 md:p-4 bg-black/20 backdrop-blur-sm z-10">
        <div className="flex justify-center items-center text-white/50 text-xs md:text-sm">
          <p>© 2025 Base0. Powered by eth Accra.</p>
        </div>
      </footer>
    </div>
  );
}
