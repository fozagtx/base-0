import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  images: {
    formats: ["image/webp"],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/github",
        destination: "https://github.com/base0-ai",
        permanent: false,
      },
      {
        source: "/twitter",
        destination: "https://twitter.com/base0_ai",
        permanent: false,
      },
      {
        source: "/docs",
        destination: "https://docs.base0.ai",
        permanent: false,
      },
      {
        source: "/feedback",
        destination: "https://forms.gle/base0feedback",
        permanent: false,
      },
      {
        source: "/support",
        destination: "mailto:support@base0.ai",
        permanent: false,
      },
      {
        source: "/demo",
        destination: "/playground",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
