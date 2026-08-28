import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@photobooth/ui"],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;