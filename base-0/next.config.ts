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
        destination: "https://github.com/fozagtx/base-0",
        permanent: false,
      },
      {
        source: "/twitter",
        destination: "https://x.com/zanbuilds",
        permanent: false,
      },
      {
        source: "/learn",
        destination: "https://www.post-bridge.com/growth-guide/start-here",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
