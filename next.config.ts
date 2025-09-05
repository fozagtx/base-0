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
        source: "/feedback",
        destination: "https://forms.gle/base0feedback",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
