import { cn } from "@/lib/utils";
import Image from "next/image";

const ChatGPTLogo = ({ size = 56 }: { size?: number }) => (
  <Image
    src="/chatgpt.png"
    alt="ChatGPT Logo"
    width={size}
    height={size}
    className="rounded-xl shadow-lg"
  />
);

const ClaudeLogo = ({ size = 56 }: { size?: number }) => (
  <Image
    src="/claude.png"
    alt="Claude Logo"
    width={size}
    height={size}
    className="rounded-xl shadow-lg"
  />
);

const CombinedLogos = () => (
  <div className="flex items-center space-x-6">
    <ChatGPTLogo size={64} />
    <ClaudeLogo size={64} />
  </div>
);

export default function BentoGrid() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="group relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Icons */}
          <div className="mb-8 flex items-center justify-center">
            <CombinedLogos />
          </div>

          {/* Title */}
          <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white group-hover:text-blue-300 transition-colors duration-200">
            Works with Your Favorite AI Models
          </h3>

          {/* Description */}
          <p className="text-lg text-zinc-300 group-hover:text-zinc-200 transition-colors duration-200 leading-relaxed max-w-3xl mx-auto">
            Seamlessly integrate with{" "}
            <span className="text-blue-400 font-semibold">OpenAI GPT-4</span>,{" "}
            <span className="text-blue-400 font-semibold">GPT-3.5-Turbo</span>,{" "}
            <span className="text-purple-400 font-semibold">
              Claude 3.5 Sonnet
            </span>
            , <span className="text-purple-400 font-semibold">Haiku</span>, and{" "}
            <span className="text-purple-400 font-semibold">Opus</span>. Switch
            between models instantly based on your needs - from creative writing
            to complex analysis, all in one unified platform.
          </p>

          {/* Hover indicator */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>

        {/* Corner decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full transform translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-300" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full transform -translate-x-12 translate-y-12 group-hover:-translate-x-8 group-hover:translate-y-8 transition-transform duration-300" />
      </div>
    </div>
  );
}
