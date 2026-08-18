import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@photobooth/ui", "@photobooth/types"],
  reactStrictMode: true,
};

export default nextConfig;