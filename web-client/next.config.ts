import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "http://localhost:8000/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
